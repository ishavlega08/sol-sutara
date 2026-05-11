import { prisma } from "../../lib/prisma";
import { OrgPlan } from "@prisma/client";
import { getDodoClient, getProductId, type BillingInterval } from "../../lib/dodo";
import { Webhook } from "standardwebhooks";

// ─── Plan definitions ─────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<OrgPlan, {
    components:          number | null;
    members:             number | null;
    traces_per_month:    number | null;
    writes_per_month:    number | null;
    webhooks:            number | null;
    network:             string;
    support:             string;
}> = {
    SANDBOX: {
        components:       500,
        members:          3,
        traces_per_month: 10_000,
        writes_per_month: 1_000,
        webhooks:         2,
        network:          "Devnet",
        support:          "Community",
    },
    STARTER: {
        components:       5_000,
        members:          10,
        traces_per_month: 50_000,
        writes_per_month: 25_000,
        webhooks:         5,
        network:          "Mainnet + Devnet",
        support:          "Email · 48h SLA",
    },
    GROWTH: {
        components:       null,
        members:          25,
        traces_per_month: 250_000,
        writes_per_month: 500_000,
        webhooks:         20,
        network:          "Mainnet + Devnet",
        support:          "Priority · 24h SLA",
    },
    ENTERPRISE: {
        components:       null,
        members:          null,
        traces_per_month: null,
        writes_per_month: null,
        webhooks:         null,
        network:          "Mainnet + Devnet",
        support:          "Dedicated engineer",
    },
};

// ─── Plan catalogue — marketing copy + pricing ────────────────────────────────
// Single source of truth for all plan metadata shown in the UI.

export const PLAN_CATALOGUE: Record<OrgPlan, {
    price_monthly: number | null;
    price_annual:  number | null;
    badge:         string | null;
    description:   string;
    features:      string[];
}> = {
    SANDBOX: {
        price_monthly: 0,
        price_annual:  0,
        badge:         null,
        description:   "Explore the graph and test on devnet — no card required.",
        features: [
            "Up to 500 components",
            "3 org members",
            "2 webhooks",
            "Devnet only",
            "Upstream + downstream trace",
            "Recall simulation",
            "Shipment & supplier tracking",
            "Community support",
        ],
    },
    STARTER: {
        price_monthly: 100,
        price_annual:  82,
        badge:         "Recommended",
        description:   "For small teams ready to go live with real supply chain data on mainnet.",
        features: [
            "Up to 5,000 components",
            "25k writes / mo",
            "50k traces / mo",
            "10 org members",
            "5 webhooks",
            "Mainnet + Devnet",
            "Document uploads",
            "Email notifications",
            "Email support · 48h SLA",
        ],
    },
    GROWTH: {
        price_monthly: 250,
        price_annual:  205,
        badge:         "Most popular",
        description:   "For teams scaling operations with high-volume writes and real-time integrations.",
        features: [
            "Unlimited components",
            "500k writes / mo",
            "250k traces / mo",
            "25 org members",
            "20 webhooks",
            "Mainnet + Devnet",
            "Document uploads (IPFS)",
            "Email notifications",
            "Priority support · 24h SLA",
        ],
    },
    ENTERPRISE: {
        price_monthly: null,
        price_annual:  null,
        badge:         null,
        description:   "Dedicated infrastructure, SAML SSO, and a named implementation engineer.",
        features: [
            "Unlimited writes & traces",
            "Unlimited members",
            "Dedicated indexer",
            "SAML / SSO",
            "Custom SLA (99.9%+)",
            "ERP connectors (SAP, NetSuite)",
            "EU DPP + FSMA 204 exports",
            "Named implementation engineer",
            "Slack-based support",
        ],
    },
};

// ─── Get org plan ─────────────────────────────────────────────────────────────

export async function getOrgPlan(orgId: string) {
    const org = await prisma.organization.findUnique({
        where:   { id: orgId },
        select:  { id: true, name: true, plan: true, created_at: true },
    });
    if (!org) throw new Error("Organization not found");

    const limits       = PLAN_LIMITS[org.plan];
    const subscription = await prisma.subscription.findUnique({
        where:  { org_id: orgId },
        select: { status: true, billing: true, current_period_end: true },
    });

    return { plan: org.plan, limits, subscription };
}

// ─── Get org usage ────────────────────────────────────────────────────────────

export async function getOrgUsage(orgId: string) {
    const now          = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        components, shipments, suppliers, documents,
        members, webhooks, webhookDeliveries, traces,
    ] = await Promise.all([
        prisma.component.count({ where: { org_id: orgId } }),
        prisma.shipment.count({ where: { org_id: orgId } }),
        prisma.supplier.count({ where: { org_id: orgId } }),
        prisma.document.count({ where: { org_id: orgId } }),
        prisma.organizationMember.count({ where: { org_id: orgId } }),
        prisma.webhook.count({ where: { org_id: orgId } }),
        prisma.webhookDelivery.count({
            where: { webhook: { org_id: orgId }, created_at: { gte: startOfMonth } },
        }),
        prisma.componentEvent.count({
            where: { component: { org_id: orgId }, created_at: { gte: startOfMonth } },
        }),
    ]);

    return {
        components, shipments, suppliers, documents,
        members, webhooks,
        webhook_deliveries: webhookDeliveries,
        traces_this_month:  traces,
        period_start:       startOfMonth.toISOString(),
        period_end:         now.toISOString(),
    };
}

// ─── Sync plan from Dodo subscription ────────────────────────────────────────
// Called from the billing/success return URL after checkout completes.
// Verifies with Dodo that the subscription is active and belongs to this org,
// then writes the plan to the DB without waiting for the webhook.

export async function syncPlanFromSubscription(orgId: string, subscriptionId: string) {
    const sub = await getDodoClient().subscriptions.retrieve(subscriptionId);

    // Verify the subscription belongs to this org
    const meta = (sub as unknown as { metadata?: Record<string, string> }).metadata ?? {};
    if (meta.org_id && meta.org_id !== orgId) {
        throw new Error("Subscription does not belong to this organization");
    }

    const plan = (meta.plan ?? "") as OrgPlan;
    if (!plan || !["STARTER", "GROWTH"].includes(plan)) {
        throw new Error("Invalid or missing plan in subscription metadata");
    }

    const status     = (sub as unknown as { status: string }).status;
    const periodStart = (sub as unknown as { current_period_start?: string }).current_period_start;
    const periodEnd   = (sub as unknown as { current_period_end?: string }).current_period_end;
    const customerId  = (sub as unknown as { customer_id?: string }).customer_id;

    if (status !== "active") {
        throw new Error(`Subscription is not active (status: ${status})`);
    }

    await Promise.all([
        prisma.organization.update({
            where: { id: orgId },
            data:  { plan },
        }),
        prisma.subscription.upsert({
            where:  { org_id: orgId },
            create: {
                org_id:               orgId,
                dodo_subscription_id: subscriptionId,
                dodo_customer_id:     customerId ?? null,
                plan,
                billing:              meta.billing ?? "monthly",
                status:               "active",
                current_period_start: periodStart ? new Date(periodStart) : new Date(),
                current_period_end:   periodEnd   ? new Date(periodEnd)   : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            update: {
                dodo_subscription_id: subscriptionId,
                dodo_customer_id:     customerId ?? undefined,
                plan,
                billing:              meta.billing ?? undefined,
                status:               "active",
                current_period_start: periodStart ? new Date(periodStart) : undefined,
                current_period_end:   periodEnd   ? new Date(periodEnd)   : undefined,
            },
        }),
    ]);

    return { plan };
}

// ─── Update plan (manual — admin bypass, no payment) ──────────────────────────

export async function updateOrgPlan(orgId: string, plan: OrgPlan) {
    const updated = await prisma.organization.update({
        where:  { id: orgId },
        data:   { plan },
        select: { id: true, plan: true },
    });
    return updated;
}

// ─── Create Dodo checkout session ─────────────────────────────────────────────

export async function createCheckoutSession(
    orgId:  string,
    userId: string,
    plan:   OrgPlan,
    billing: BillingInterval,
) {
    // Fetch user's email from DB — it's not in the JWT payload
    const userRecord = await prisma.user.findUnique({
        where:  { id: userId },
        select: { email: true },
    });
    const email = userRecord?.email ?? "";
    if (!email) throw new Error("Account email is required for checkout. Please ensure your Privy account has an email address.");

    if (plan === "SANDBOX" || plan === "ENTERPRISE") {
        throw new Error(`Plan ${plan} cannot be purchased through checkout`);
    }

    const productId = getProductId(plan, billing);
    const appUrl    = process.env.FRONTEND_URL ?? "http://localhost:3000";

    // Cast to any — Dodo's live API requires `name` even though the TS type
    // marks it optional, and the untagged enum discriminator needs both fields.
    const subscription = await getDodoClient().subscriptions.create({
        billing: {
            country: "US",
        },
        customer: {
            email,
            name: email,           // use email as display name fallback
        } as any,
        product_id:   productId,
        quantity:     1,
        payment_link: true,
        return_url:   `${appUrl}/billing/success?plan=${plan}&billing=${billing}`,
        metadata: {
            org_id:  orgId,
            plan,
            billing,
        },
    });

    return {
        payment_link:    (subscription as any).payment_link as string,
        subscription_id: subscription.subscription_id,
    };
}

// ─── Get subscription ─────────────────────────────────────────────────────────

export async function getSubscription(orgId: string) {
    return prisma.subscription.findUnique({ where: { org_id: orgId } });
}

// ─── Get invoices from Dodo ───────────────────────────────────────────────────

export async function getInvoices(orgId: string) {
    const sub = await prisma.subscription.findUnique({
        where:  { org_id: orgId },
        select: { dodo_subscription_id: true, dodo_customer_id: true },
    });
    if (!sub) return [];

    try {
        const payments = await getDodoClient().payments.list({
            customer_id: sub.dodo_customer_id ?? undefined,
        });
        return (payments as any).items ?? payments ?? [];
    } catch {
        return [];
    }
}

// ─── Handle Dodo webhook ──────────────────────────────────────────────────────

export async function verifyAndParseWebhook(
    rawBody:   Buffer,
    headers:   Record<string, string | string[] | undefined>,
): Promise<{ type: string; data: Record<string, unknown> }> {
    const secret = process.env.DODO_WEBHOOK_SECRET;
    if (!secret) throw new Error("DODO_WEBHOOK_SECRET not set");

    const wh  = new Webhook(secret);
    const evt = wh.verify(rawBody.toString(), {
        "webhook-id":        String(headers["webhook-id"]        ?? ""),
        "webhook-timestamp": String(headers["webhook-timestamp"] ?? ""),
        "webhook-signature": String(headers["webhook-signature"] ?? ""),
    }) as { type: string; data: Record<string, unknown> };

    return evt;
}

export async function handleWebhookEvent(
    eventType: string,
    data:      Record<string, unknown>,
) {
    const meta    = (data.metadata ?? {}) as Record<string, string>;
    const orgId   = meta.org_id   ?? (data.org_id   as string | undefined);
    const plan    = meta.plan     ?? (data.plan     as string | undefined);
    const billing = meta.billing  ?? (data.billing  as string | undefined);

    const subscriptionId = (data.subscription_id ?? data.id) as string | undefined;
    const customerId     = data.customer_id as string | undefined;

    switch (eventType) {
        // Subscription activated / renewed
        case "subscription.active": {
            if (!orgId || !plan || !subscriptionId) break;

            const periodStart = data.current_period_start
                ? new Date(data.current_period_start as string)
                : new Date();
            const periodEnd   = data.current_period_end
                ? new Date(data.current_period_end as string)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await Promise.all([
                prisma.organization.update({
                    where: { id: orgId },
                    data:  { plan: plan as OrgPlan },
                }),
                prisma.subscription.upsert({
                    where:  { org_id: orgId },
                    create: {
                        org_id:               orgId,
                        dodo_subscription_id: subscriptionId,
                        dodo_customer_id:     customerId,
                        plan:                 plan as OrgPlan,
                        billing:              billing ?? "monthly",
                        status:               "active",
                        current_period_start: periodStart,
                        current_period_end:   periodEnd,
                    },
                    update: {
                        dodo_subscription_id: subscriptionId,
                        dodo_customer_id:     customerId ?? undefined,
                        plan:                 plan as OrgPlan,
                        billing:              billing ?? undefined,
                        status:               "active",
                        current_period_start: periodStart,
                        current_period_end:   periodEnd,
                    },
                }),
            ]);
            break;
        }

        // Subscription cancelled / expired — downgrade to SANDBOX
        case "subscription.cancelled":
        case "subscription.expired": {
            if (!orgId) break;
            await Promise.all([
                prisma.organization.update({
                    where: { id: orgId },
                    data:  { plan: "SANDBOX" },
                }),
                prisma.subscription.updateMany({
                    where: { org_id: orgId },
                    data:  { status: "cancelled" },
                }),
            ]);
            break;
        }

        // Payment failed
        case "subscription.failed":
        case "payment.failed": {
            if (!orgId) break;
            await prisma.subscription.updateMany({
                where: { org_id: orgId },
                data:  { status: "past_due" },
            });
            break;
        }

        default:
            // Unhandled event — ignore silently
            break;
    }
}
