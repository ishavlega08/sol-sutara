import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { retryOverdueDeliveries } from "./webhook.dispatcher";

// ─── create webhook ───────────────────────────────────────────────────────────

export async function createWebhook(params: {
    orgId:    string;
    userId:   string;
    url:      string;
    events:   string[];
}) {
    if (!params.url.startsWith("https://") && !params.url.startsWith("http://")) {
        throw new Error("Webhook URL must start with http:// or https://");
    }
    if (params.events.length === 0) {
        throw new Error("At least one event must be specified");
    }

    const secret = crypto.randomBytes(32).toString("hex");

    return prisma.webhook.create({
        data: {
            org_id:     params.orgId,
            url:        params.url,
            secret,
            events:     params.events,
            status:     "ACTIVE",
            created_by: params.userId,
        },
    });
}

// ─── get webhooks for org ─────────────────────────────────────────────────────

export async function getWebhooks(orgId: string) {
    return prisma.webhook.findMany({
        where:   { org_id: orgId },
        orderBy: { created_at: "desc" },
        include: {
            _count: { select: { deliveries: true } },
        },
    });
}

// ─── get webhook by id ────────────────────────────────────────────────────────

export async function getWebhookById(id: string, orgId: string) {
    const webhook = await prisma.webhook.findFirst({
        where:   { id, org_id: orgId },
        include: {
            deliveries: {
                orderBy: { created_at: "desc" },
                take:    20,
                select: {
                    id: true, event: true, status: true,
                    status_code: true, attempts: true,
                    created_at: true, delivered_at: true,
                },
            },
        },
    });
    if (!webhook) throw new Error(`Webhook not found: ${id}`);
    return webhook;
}

// ─── update webhook ───────────────────────────────────────────────────────────

export async function updateWebhook(
    id:    string,
    orgId: string,
    input: { url?: string; events?: string[]; status?: "ACTIVE" | "DISABLED" },
) {
    const existing = await prisma.webhook.findFirst({ where: { id, org_id: orgId } });
    if (!existing) throw new Error(`Webhook not found: ${id}`);

    if (input.url && !input.url.startsWith("https://") && !input.url.startsWith("http://")) {
        throw new Error("Webhook URL must start with http:// or https://");
    }

    return prisma.webhook.update({
        where: { id },
        data: {
            ...(input.url    !== undefined ? { url:    input.url    } : {}),
            ...(input.events !== undefined ? { events: input.events } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
        },
    });
}

// ─── rotate secret ────────────────────────────────────────────────────────────

export async function rotateWebhookSecret(id: string, orgId: string) {
    const existing = await prisma.webhook.findFirst({ where: { id, org_id: orgId } });
    if (!existing) throw new Error(`Webhook not found: ${id}`);

    const secret = crypto.randomBytes(32).toString("hex");
    return prisma.webhook.update({ where: { id }, data: { secret } });
}

// ─── delete webhook ───────────────────────────────────────────────────────────

export async function deleteWebhook(id: string, orgId: string) {
    const existing = await prisma.webhook.findFirst({ where: { id, org_id: orgId } });
    if (!existing) throw new Error(`Webhook not found: ${id}`);

    await prisma.webhook.delete({ where: { id } });
}

// ─── trigger retry sweep ──────────────────────────────────────────────────────

export async function triggerRetry(orgId: string): Promise<number> {
    return retryOverdueDeliveries(orgId);
}

// ─── available event types ────────────────────────────────────────────────────

export const WEBHOOK_EVENTS = [
    "shipment.created",
    "shipment.picked_up",
    "shipment.in_transit",
    "shipment.customs_hold",
    "shipment.delayed",
    "shipment.delivered",
    "shipment.cancelled",
    "supplier.approved",
    "supplier.suspended",
    "supplier.rejected",
    "document.uploaded",
    "recall.issued",
    "recall.resolved",
] as const;
