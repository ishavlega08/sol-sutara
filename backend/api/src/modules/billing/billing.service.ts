import { prisma } from "../../lib/prisma";
import { OrgPlan } from "@prisma/client";

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

// ─── Get org plan ─────────────────────────────────────────────────────────────

export async function getOrgPlan(orgId: string) {
    const org = await prisma.organization.findUnique({
        where:  { id: orgId },
        select: { id: true, name: true, plan: true, created_at: true },
    });
    if (!org) throw new Error("Organization not found");

    const limits = PLAN_LIMITS[org.plan];

    return {
        plan:    org.plan,
        limits,
    };
}

// ─── Get org usage ────────────────────────────────────────────────────────────

export async function getOrgUsage(orgId: string) {
    const now           = new Date();
    const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        components,
        shipments,
        suppliers,
        documents,
        members,
        webhooks,
        webhookDeliveries,
        traces,
    ] = await Promise.all([
        prisma.component.count({ where: { org_id: orgId } }),

        prisma.shipment.count({ where: { org_id: orgId } }),

        prisma.supplier.count({ where: { org_id: orgId } }),

        prisma.document.count({ where: { org_id: orgId } }),

        prisma.organizationMember.count({ where: { org_id: orgId } }),

        prisma.webhook.count({ where: { org_id: orgId } }),

        // Deliveries this month via webhooks belonging to this org
        prisma.webhookDelivery.count({
            where: {
                webhook:    { org_id: orgId },
                created_at: { gte: startOfMonth },
            },
        }),

        // Component events this month as a proxy for "trace writes"
        prisma.componentEvent.count({
            where: {
                component:  { org_id: orgId },
                created_at: { gte: startOfMonth },
            },
        }),
    ]);

    return {
        components,
        shipments,
        suppliers,
        documents,
        members,
        webhooks,
        webhook_deliveries: webhookDeliveries,
        traces_this_month:  traces,
        period_start:       startOfMonth.toISOString(),
        period_end:         now.toISOString(),
    };
}

// ─── Update plan (owner only, no payment yet — manual upgrade) ────────────────

export async function updateOrgPlan(orgId: string, plan: OrgPlan) {
    const updated = await prisma.organization.update({
        where: { id: orgId },
        data:  { plan },
        select: { id: true, plan: true },
    });
    return updated;
}
