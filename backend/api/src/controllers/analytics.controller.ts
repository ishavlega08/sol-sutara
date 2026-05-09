import { Request, Response } from "express";
import { getAnalytics, getTimeSeries } from "../services/analytics.service";

// ─── GET /analytics ───────────────────────────────────────────────────────────

export async function getAnalyticsHandler(req: Request, res: Response) {
    try {
        const orgId  = req.user?.orgId;
        const period = (req.query["period"] as string ?? "all") as "7d" | "30d" | "90d" | "all";
        const result = await getAnalytics(orgId, period);
        return res.status(200).json({ success: true, analytics: result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /analytics/timeseries ────────────────────────────────────────────────

export async function getTimeSeriesHandler(req: Request, res: Response) {
    try {
        const orgId = req.user?.orgId;
        const weeks = Math.min(Number(req.query["weeks"] ?? 14), 52);
        const timeSeries = await getTimeSeries(orgId, weeks);
        return res.status(200).json({ success: true, timeSeries });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
