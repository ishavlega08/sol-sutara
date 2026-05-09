import { Router } from "express";
import { getAnalyticsHandler, getTimeSeriesHandler } from "../controllers/analytics.controller";
import { authenticateToken, requireOrg } from "../middleware/auth";

const router = Router();

router.get("/timeseries", authenticateToken, requireOrg, getTimeSeriesHandler);
router.get("/",           authenticateToken, requireOrg, getAnalyticsHandler);

export default router;
