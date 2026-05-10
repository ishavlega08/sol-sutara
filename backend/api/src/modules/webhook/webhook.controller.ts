import { Request, Response } from "express";
import {
    createWebhook,
    getWebhooks,
    getWebhookById,
    updateWebhook,
    rotateWebhookSecret,
    deleteWebhook,
    triggerRetry,
    WEBHOOK_EVENTS,
} from "./webhook.service";

// ─── GET /webhooks/events ─────────────────────────────────────────────────────

export async function getEventTypesHandler(_req: Request, res: Response) {
    return res.status(200).json({ success: true, events: WEBHOOK_EVENTS });
}

// ─── POST /webhooks ───────────────────────────────────────────────────────────

export async function createWebhookHandler(req: Request, res: Response) {
    const orgId  = req.user!.orgId!;
    const userId = req.user!.userId;
    const { url, events } = req.body as { url?: string; events?: string[] };

    if (!url?.trim())          return res.status(400).json({ success: false, error: "url is required" });
    if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ success: false, error: "events array is required" });
    }

    try {
        const webhook = await createWebhook({ orgId, userId, url, events });
        return res.status(201).json({ success: true, webhook });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("URL must")) return res.status(400).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /webhooks ────────────────────────────────────────────────────────────

export async function getWebhooksHandler(req: Request, res: Response) {
    const orgId = req.user!.orgId!;

    try {
        const webhooks = await getWebhooks(orgId);
        return res.status(200).json({ success: true, webhooks });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /webhooks/:id ────────────────────────────────────────────────────────

export async function getWebhookByIdHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        const webhook = await getWebhookById(id, orgId);
        return res.status(200).json({ success: true, webhook });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── PATCH /webhooks/:id ──────────────────────────────────────────────────────

export async function updateWebhookHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        const webhook = await updateWebhook(id, orgId, req.body);
        return res.status(200).json({ success: true, webhook });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        if (msg.includes("URL must"))  return res.status(400).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── POST /webhooks/:id/rotate-secret ────────────────────────────────────────

export async function rotateSecretHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        const webhook = await rotateWebhookSecret(id, orgId);
        return res.status(200).json({ success: true, webhook });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── DELETE /webhooks/:id ─────────────────────────────────────────────────────

export async function deleteWebhookHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        await deleteWebhook(id, orgId);
        return res.status(200).json({ success: true, message: "Webhook deleted" });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── POST /webhooks/retry ─────────────────────────────────────────────────────

export async function retryDeliveriesHandler(req: Request, res: Response) {
    const orgId = req.user!.orgId!;

    try {
        const retried = await triggerRetry(orgId);
        return res.status(200).json({ success: true, retried });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
