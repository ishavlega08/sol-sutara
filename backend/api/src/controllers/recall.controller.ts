import { Request, Response } from "express";
import { createRecall, getActiveRecalls, resolveRecall } from "../services/recall.service";

// ─── POST /recalls ────────────────────────────────────────────────────────────

export async function createRecallHandler(req: Request, res: Response) {
    const { componentId, reason, scope } = req.body as {
        componentId?: string;
        reason?:      string;
        scope?:       string;
    };

    if (!componentId || !reason) {
        return res.status(400).json({ success: false, error: "componentId and reason are required" });
    }

    const issuedBy = req.user?.userId;
    const orgId    = req.user?.orgId;

    if (!issuedBy) {
        return res.status(401).json({ success: false, error: "Authentication required" });
    }

    try {
        const recall = await createRecall({
            componentId,
            reason,
            scope:    scope ?? "Entire batch",
            issuedBy,
            orgId,
        });
        return res.status(201).json({ success: true, recall });
    } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /recalls ─────────────────────────────────────────────────────────────

export async function getActiveRecallsHandler(req: Request, res: Response) {
    try {
        const orgId   = req.user?.orgId;
        const recalls = await getActiveRecalls(orgId);
        return res.status(200).json({ success: true, recalls });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── PATCH /recalls/:id/resolve ───────────────────────────────────────────────

export async function resolveRecallHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    try {
        const orgId  = req.user?.orgId;
        const recall = await resolveRecall(id, orgId);
        return res.status(200).json({ success: true, recall });
    } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
