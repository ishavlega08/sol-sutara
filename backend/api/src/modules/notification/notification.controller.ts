import { Request, Response } from "express";
import {
    getUserNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
} from "./notification.service";

// ─── GET /notifications ───────────────────────────────────────────────────────

export async function getNotificationsHandler(req: Request, res: Response) {
    const userId     = req.user!.userId;
    const orgId      = req.user!.orgId!;
    const unreadOnly = req.query["unread"] === "true";

    try {
        const notifications = await getUserNotifications(userId, orgId, unreadOnly);
        return res.status(200).json({ success: true, notifications });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /notifications/unread-count ─────────────────────────────────────────

export async function getUnreadCountHandler(req: Request, res: Response) {
    const userId = req.user!.userId;
    const orgId  = req.user!.orgId!;

    try {
        const count = await getUnreadCount(userId, orgId);
        return res.status(200).json({ success: true, count });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── PATCH /notifications/:id/read ───────────────────────────────────────────

export async function markReadHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const userId = req.user!.userId;

    try {
        const notification = await markNotificationRead(id, userId);
        return res.status(200).json({ success: true, notification });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── POST /notifications/mark-all-read ───────────────────────────────────────

export async function markAllReadHandler(req: Request, res: Response) {
    const userId = req.user!.userId;
    const orgId  = req.user!.orgId!;

    try {
        await markAllNotificationsRead(userId, orgId);
        return res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
