import { Request, Response } from "express";
import { getOrgPlan, getOrgUsage, updateOrgPlan, PLAN_LIMITS } from "./billing.service";
import { OrgPlan } from "@prisma/client";

const VALID_PLANS: OrgPlan[] = ["SANDBOX", "GROWTH", "ENTERPRISE"];

// GET /api/billing/plan
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

// GET /api/billing/usage
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

// GET /api/billing/plans  — public plan catalogue, no auth needed
export async function getPlansHandler(_req: Request, res: Response) {
    const plans = VALID_PLANS.map((plan) => ({
        id:     plan,
        limits: PLAN_LIMITS[plan],
    }));
    res.json({ success: true, plans });
}

// PATCH /api/billing/plan  — owner only
export async function updatePlanHandler(req: Request, res: Response) {
    try {
        const orgId = req.user!.orgId!;
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
