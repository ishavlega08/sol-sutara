import express, { Router } from "express";
import { authenticateToken, requireOrg, requireRole } from "../../middleware/auth";
import {
    getPlanHandler,
    getUsageHandler,
    getPlansHandler,
    updatePlanHandler,
    createCheckoutHandler,
    getSubscriptionHandler,
    getInvoicesHandler,
    webhookHandler,
} from "./billing.controller";

const router = Router();

// ── Public ─────────────────────────────────────────────────────────────────────

// Plan catalogue — no auth
router.get("/plans", getPlansHandler);

// Dodo webhook — raw body required for signature verification, no JWT auth
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    webhookHandler,
);

// ── Authenticated ──────────────────────────────────────────────────────────────

router.use(authenticateToken, requireOrg);

router.get  ("/plan",         getPlanHandler);
router.get  ("/usage",        getUsageHandler);
router.get  ("/subscription", getSubscriptionHandler);
router.get  ("/invoices",     getInvoicesHandler);
router.patch("/plan",         requireRole("OWNER"), updatePlanHandler);
router.post ("/checkout",     requireRole("OWNER"), createCheckoutHandler);

export default router;
