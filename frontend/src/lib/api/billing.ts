import client from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgPlan = "SANDBOX" | "STARTER" | "GROWTH" | "ENTERPRISE";

export interface PlanLimits {
    components:       number | null;
    members:          number | null;
    traces_per_month: number | null;
    writes_per_month: number | null;
    webhooks:         number | null;
    network:          string;
    support:          string;
}

export interface PlanCatalogue {
    id:     OrgPlan;
    limits: PlanLimits;
}

export interface OrgUsage {
    components:         number;
    shipments:          number;
    suppliers:          number;
    documents:          number;
    members:            number;
    webhooks:           number;
    webhook_deliveries: number;
    traces_this_month:  number;
    period_start:       string;
    period_end:         string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getOrgPlan(): Promise<{ plan: OrgPlan; limits: PlanLimits }> {
    const res = await client.get("/billing/plan");
    return res.data;
}

export async function getOrgUsage(): Promise<{ usage: OrgUsage }> {
    const res = await client.get("/billing/usage");
    return res.data;
}

export async function getPlanCatalogue(): Promise<{ plans: PlanCatalogue[] }> {
    const res = await client.get("/billing/plans");
    return res.data;
}

export async function updateOrgPlan(plan: OrgPlan): Promise<{ plan: OrgPlan }> {
    const res = await client.patch("/billing/plan", { plan });
    return res.data;
}
