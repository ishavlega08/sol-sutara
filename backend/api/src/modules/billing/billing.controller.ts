import { Request, Response } from "express";
import {
    getOrgPlan,
    getOrgUsage,
    updateOrgPlan,
    createCheckoutSession,
    getSubscription,
    getInvoices,
    verifyAndParseWebhook,
    handleWebhookEvent,
    PLAN_LIMITS,
} from "./billing.service";
import { OrgPlan } from "@prisma/client";
import type { BillingInterval } from "../../lib/dodo";

const VALID_PLANS: OrgPlan[] = ["SANDBOX", "STARTER", "GROWTH", "ENTERPRISE"];

// ─── GET /api/billing/plan ────────────────────────────────────────────────────

export async function getPlanHandler(req: Request, res: Response) {
    try {
        const orgId = req.user!.orgId!;
        const data  = await getOrgPlan(orgId);
        res.json({ success: true, ...data });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to fetch plan";
        res.status(500).json({ success: false, error: msg });
    }
}

// ─── GET /api/billing/usage ───────────────────────────────────────────────────

export async function getUsageHandler(req: Request, res: Response) {
    try {
        const orgId = req.user!.orgId!;
        const usage = await getOrgUsage(orgId);
        res.json({ success: true, usage });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to fetch usage";
        res.status(500).json({ success: false, error: msg });
    }
}

// ─── GET /api/billing/plans — public catalogue ────────────────────────────────

export async function getPlansHandler(_req: Request, res: Response) {
    const plans = VALID_PLANS.map((plan) => ({
        id:     plan,
        limits: PLAN_LIMITS[plan],
    }));
    res.json({ success: true, plans });
}

// ─── PATCH /api/billing/plan — manual override (owner only) ──────────────────

export async function updatePlanHandler(req: Request, res: Response) {
    try {
        const orgId    = req.user!.orgId!;
        const { plan } = req.body as { plan: OrgPlan };

        if (!plan || !VALID_PLANS.includes(plan)) {
            res.status(400).json({ success: false, error: `plan must be one of: ${VALID_PLANS.join(", ")}` });
            return;
        }

        const updated = await updateOrgPlan(orgId, plan);
        res.json({ success: true, plan: updated.plan });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update plan";
        res.status(500).json({ success: false, error: msg });
    }
}

// ─── POST /api/billing/checkout — create Dodo payment link (owner only) ───────

export async function createCheckoutHandler(req: Request, res: Response) {
    try {
        const orgId  = req.user!.orgId!;
        const userId = req.user!.userId;
        const { plan, billing = "monthly" } = req.body as {
            plan:     OrgPlan;
            billing?: BillingInterval;
        };

        if (!plan || !["STARTER", "GROWTH"].includes(plan)) {
            res.status(400).json({ success: false, error: "plan must be STARTER or GROWTH" });
            return;
        }
        if (!["monthly", "annual"].includes(billing)) {
            res.status(400).json({ success: false, error: "billing must be monthly or annual" });
            return;
        }

        const result = await createCheckoutSession(orgId, userId, plan, billing as BillingInterval);

        if (!result.payment_link) {
            res.status(500).json({ success: false, error: "Dodo did not return a payment link. Ensure payment_link is enabled on your product in the Dodo dashboard." });
            return;
        }

        res.json({ success: true, payment_link: result.payment_link, subscription_id: result.subscription_id });
    } catch (err: unknown) {
        // Log the full error in the backend terminal so we can see what Dodo is returning
        const dodoBody = (err as any)?.response?.data ?? (err as any)?.error ?? null;
        console.error("[Dodo checkout error]", err instanceof Error ? err.message : err, dodoBody ?? "");

        let msg: string =
            dodoBody?.message ??
            dodoBody?.error ??
            (err instanceof Error ? err.message : "Failed to create checkout session");

        // Make Dodo NOT_FOUND actionable
        if (dodoBody?.code === "NOT_FOUND") {
            msg = `Product not found in Dodo (${dodoBody.code}). Make sure the product IDs in .env match test/live mode and that annual products are Subscription type (not One-time) in the Dodo dashboard.`;
        }

        const isConfig = msg.includes("not configured") || msg.includes("Set DODO_") || msg.includes("email is required") || msg.includes("Product not found");
        res.status(isConfig ? 400 : 500).json({ success: false, error: msg });
    }
}

// ─── GET /api/billing/subscription ────────────────────────────────────────────

export async function getSubscriptionHandler(req: Request, res: Response) {
    try {
        const orgId = req.user!.orgId!;
        const sub   = await getSubscription(orgId);
        res.json({ success: true, subscription: sub });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to fetch subscription";
        res.status(500).json({ success: false, error: msg });
    }
}

// ─── GET /api/billing/invoices ────────────────────────────────────────────────

export async function getInvoicesHandler(req: Request, res: Response) {
    try {
        const orgId    = req.user!.orgId!;
        const invoices = await getInvoices(orgId);
        res.json({ success: true, invoices });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to fetch invoices";
        res.status(500).json({ success: false, error: msg });
    }
}

// ─── POST /api/billing/webhook — Dodo webhook receiver (no auth) ─────────────

export async function webhookHandler(req: Request, res: Response) {
    try {
        // req.body must be the raw Buffer (mounted with express.raw() on this route)
        const raw = req.body as Buffer;

        const event = await verifyAndParseWebhook(raw, req.headers as Record<string, string>);
        await handleWebhookEvent(event.type, event.data);

        res.json({ success: true });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Webhook error";
        res.status(400).json({ success: false, error: msg });
    }
}
