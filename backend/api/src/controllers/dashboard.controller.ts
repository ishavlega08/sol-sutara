import { Request, Response } from "express";
import { getDashboardStats, getRecentLinks, getBatchRisk, getAllLinks } from "../services/dashboard.service";

// ─── GET /dashboard/stats ─────────────────────────────────────────────────────

export async function getDashboardStatsHandler(req: Request, res: Response) {
    try {
        const orgId  = req.user?.orgId;
        const result = await getDashboardStats(orgId);
        return res.status(200).json({ success: true, stats: result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /dashboard/activity ──────────────────────────────────────────────────

export async function getActivityHandler(req: Request, res: Response) {
    try {
        const orgId  = req.user?.orgId;
        const result = await getDashboardStats(orgId);
        return res.status(200).json({ success: true, activity: result.recentActivity });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /links/recent ────────────────────────────────────────────────────────

export async function getRecentLinksHandler(req: Request, res: Response) {
    try {
        const orgId  = req.user?.orgId;
        const limit  = Math.min(Number(req.query["limit"] ?? 10), 50);
        const links  = await getRecentLinks(orgId, limit);
        return res.status(200).json({ success: true, links });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /dashboard/links/all ─────────────────────────────────────────────────

export async function getAllLinksHandler(req: Request, res: Response) {
    try {
        const orgId = req.user?.orgId;
        const links = await getAllLinks(orgId);
        return res.status(200).json({ success: true, links });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /components/risks ────────────────────────────────────────────────────

export async function getBatchRiskHandler(req: Request, res: Response) {
    try {
        const orgId = req.user?.orgId;
        const risks = await getBatchRisk(orgId);
        return res.status(200).json({ success: true, risks });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
