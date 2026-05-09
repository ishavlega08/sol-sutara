import { Router } from "express";
import {
    getDashboardStatsHandler,
    getRecentLinksHandler,
    getAllLinksHandler,
    getBatchRiskHandler,
} from "../controllers/dashboard.controller";
import { authenticateToken, requireOrg } from "../middleware/auth";

const router = Router();

router.get("/stats",      authenticateToken, requireOrg, getDashboardStatsHandler);
router.get("/links",      authenticateToken, requireOrg, getRecentLinksHandler);
router.get("/links/all",  authenticateToken, requireOrg, getAllLinksHandler);
router.get("/risks",      authenticateToken, requireOrg, getBatchRiskHandler);

export default router;
