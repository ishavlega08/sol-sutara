import crypto from "crypto";
import { prisma } from "../../lib/prisma";

// ─── Retry config ─────────────────────────────────────────────────────────────

const RETRY_DELAYS_MS = [
    30_000,    // 30 seconds
    300_000,   // 5 minutes
    1_800_000, // 30 minutes
    7_200_000, // 2 hours
];

const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1; // 5 total

// ─── HMAC signature ───────────────────────────────────────────────────────────

export function signPayload(secret: string, payload: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// ─── Attempt a single delivery ────────────────────────────────────────────────

async function attemptDelivery(
    deliveryId: string,
    url:        string,
    secret:     string,
    event:      string,
    payload:    unknown,
    attempt:    number,
): Promise<void> {
    const bodyString = JSON.stringify(payload);
    const signature  = signPayload(secret, bodyString);

    let statusCode: number | null = null;
    let responseBody              = "";
    let success                   = false;

    try {
        const response = await fetch(url, {
            method:  "POST",
            headers: {
                "Content-Type":         "application/json",
                "X-Sutara-Event":       event,
                "X-Sutara-Signature":   `sha256=${signature}`,
                "X-Sutara-Delivery":    deliveryId,
                "X-Sutara-Timestamp":   Date.now().toString(),
            },
            body:    bodyString,
            signal:  AbortSignal.timeout(10_000), // 10-second timeout
        });

        statusCode   = response.status;
        responseBody = (await response.text()).slice(0, 1000); // cap response at 1 KB
        success      = response.status >= 200 && response.status < 300;
    } catch (err) {
        responseBody = err instanceof Error ? err.message : "Unknown error";
    }

    if (success) {
        await prisma.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
                status:       "SUCCESS",
                status_code:  statusCode,
                response:     responseBody,
                attempts:     attempt,
                delivered_at: new Date(),
                next_retry:   null,
            },
        });
        return;
    }

    // Delivery failed — schedule retry if attempts remain
    const nextRetryDelay = RETRY_DELAYS_MS[attempt - 1]; // attempt starts at 1
    const hasRetry       = attempt < MAX_ATTEMPTS && nextRetryDelay !== undefined;

    await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
            status:      hasRetry ? "PENDING" : "FAILED",
            status_code: statusCode,
            response:    responseBody,
            attempts:    attempt,
            next_retry:  hasRetry ? new Date(Date.now() + nextRetryDelay) : null,
        },
    });
}

// ─── Dispatch an event to all active webhooks for an org ─────────────────────

export async function dispatch(
    orgId:   string,
    event:   string,
    payload: Record<string, unknown>,
): Promise<void> {
    // Find all active webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
        where: {
            org_id: orgId,
            status: "ACTIVE",
            events: { has: event },
        },
    });

    if (webhooks.length === 0) return;

    const fullPayload = {
        event,
        org_id: orgId,
        data:   payload,
        timestamp: new Date().toISOString(),
    };

    // Create delivery records and attempt delivery for each webhook
    await Promise.allSettled(
        webhooks.map(async (webhook) => {
            const delivery = await prisma.webhookDelivery.create({
                data: {
                    webhook_id: webhook.id,
                    event,
                    payload:    fullPayload as any,
                    status:     "PENDING",
                    attempts:   0,
                },
            });

            // Fire-and-forget delivery — non-fatal
            attemptDelivery(
                delivery.id,
                webhook.url,
                webhook.secret,
                event,
                fullPayload,
                1,
            ).catch((err) =>
                console.error(`[webhook] delivery ${delivery.id} error:`, err)
            );
        })
    );

    // Background: also retry any overdue failed deliveries for this org
    retryOverdueDeliveries(orgId).catch((err) =>
        console.error("[webhook] retry sweep error:", err)
    );
}

// ─── Retry overdue deliveries ─────────────────────────────────────────────────

export async function retryOverdueDeliveries(orgId?: string): Promise<number> {
    const now      = new Date();
    const overdue  = await prisma.webhookDelivery.findMany({
        where: {
            status:     "PENDING",
            next_retry: { lte: now },
            attempts:   { lt: MAX_ATTEMPTS },
            webhook: orgId ? { org_id: orgId } : undefined,
        },
        include: { webhook: true },
        take: 50,
    });

    await Promise.allSettled(
        overdue.map((d) =>
            attemptDelivery(
                d.id,
                d.webhook.url,
                d.webhook.secret,
                d.event,
                d.payload,
                d.attempts + 1,
            ).catch((err) =>
                console.error(`[webhook] retry ${d.id} error:`, err)
            )
        )
    );

    return overdue.length;
}
