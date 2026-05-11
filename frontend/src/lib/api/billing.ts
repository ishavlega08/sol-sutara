import client from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgPlan        = "SANDBOX" | "STARTER" | "GROWTH" | "ENTERPRISE";
export type BillingInterval = "monthly" | "annual";

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

export interface Subscription {
    id:                   string;
    org_id:               string;
    dodo_subscription_id: string;
    plan:                 OrgPlan;
    billing:              BillingInterval;
    status:               string;
    current_period_start: string | null;
    current_period_end:   string | null;
}

export interface Invoice {
    payment_id:  string;
    amount:      number;
    currency:    string;
    status:      string;
    created_at:  string;
    description: string | null;
    payment_link: string | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getOrgPlan(): Promise<{ plan: OrgPlan; limits: PlanLimits; subscription: Subscription | null }> {
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

export async function createCheckout(
    plan:    OrgPlan,
    billing: BillingInterval,
): Promise<{ payment_link: string; subscription_id: string }> {
    const res = await client.post("/billing/checkout", { plan, billing });
    return res.data;
}

export async function getSubscription(): Promise<{ subscription: Subscription | null }> {
    const res = await client.get("/billing/subscription");
    return res.data;
}

export async function getInvoices(): Promise<{ invoices: Invoice[] }> {
    const res = await client.get("/billing/invoices");
    return res.data;
}
