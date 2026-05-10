import { Router } from "express";
import {
    getEventTypesHandler,
    createWebhookHandler,
    getWebhooksHandler,
    getWebhookByIdHandler,
    updateWebhookHandler,
    rotateSecretHandler,
    deleteWebhookHandler,
    retryDeliveriesHandler,
} from "./webhook.controller";
import { authenticateToken, requireOrg, requireRole } from "../../middleware/auth";

const router = Router();

// Public (authenticated) reference
router.get("/events",              authenticateToken, requireOrg, getEventTypesHandler);

// Read deliveries / list — ADMIN+
router.get("/",    authenticateToken, requireOrg, requireRole("ADMIN", "OWNER"), getWebhooksHandler);
router.get("/:id", authenticateToken, requireOrg, requireRole("ADMIN", "OWNER"), getWebhookByIdHandler);

// Manage — ADMIN+
router.post("/",                       authenticateToken, requireOrg, requireRole("ADMIN", "OWNER"), createWebhookHandler);
router.patch("/:id",                   authenticateToken, requireOrg, requireRole("ADMIN", "OWNER"), updateWebhookHandler);
router.post("/:id/rotate-secret",      authenticateToken, requireOrg, requireRole("ADMIN", "OWNER"), rotateSecretHandler);
router.delete("/:id",                  authenticateToken, requireOrg, requireRole("ADMIN", "OWNER"), deleteWebhookHandler);

// Retry failed deliveries
router.post("/retry",                  authenticateToken, requireOrg, requireRole("ADMIN", "OWNER"), retryDeliveriesHandler);

export default router;
