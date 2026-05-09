import { Request, Response } from "express";
import { getComponentEvents, changeComponentStatus } from "../services/event.service";
import type { ComponentStatus } from "@prisma/client";

const VALID_STATUSES: ComponentStatus[] = [
    "CREATED", "IN_TRANSIT", "RECEIVED", "INSPECTED", "RECALLED", "ARCHIVED",
];

// ─── GET /components/:id/events ───────────────────────────────────────────────

export async function getEventsHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    try {
        const events = await getComponentEvents(id);
        return res.status(200).json({
            success: true,
            events: events.map((e) => ({
                id:         e.id,
                fromStatus: e.from_status,
                toStatus:   e.to_status,
                changedBy:  e.changer.email ?? e.changer.wallet_address ?? "unknown",
                notes:      e.notes,
                createdAt:  e.created_at,
            })),
        });
    } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── PATCH /components/:id/status ────────────────────────────────────────────

export async function patchStatusHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const { status, notes } = req.body as { status?: string; notes?: string };
    const changedBy = req.user?.userId;

    if (!status || !VALID_STATUSES.includes(status as ComponentStatus)) {
        return res.status(400).json({
            success: false,
            error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
    }
    if (!changedBy) {
        return res.status(401).json({ success: false, error: "Authentication required" });
    }

    try {
        const result = await changeComponentStatus(id, status as ComponentStatus, changedBy, notes);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
