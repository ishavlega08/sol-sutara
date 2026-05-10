import { Router } from "express";
import { authenticateToken, requireOrg, requireRole } from "../../middleware/auth";
import {
    getPlanHandler,
    getUsageHandler,
    getPlansHandler,
    updatePlanHandler,
} from "./billing.controller";

const router = Router();

// Public — plan catalogue (no auth)
router.get("/plans", getPlansHandler);

// Authenticated routes
router.use(authenticateToken, requireOrg);

router.get("/plan",    getPlanHandler);
router.get("/usage",   getUsageHandler);
router.patch("/plan",  requireRole("OWNER"), updatePlanHandler);

export default router;
