import { Router } from "express";
import {
    createShipmentHandler,
    getShipmentsHandler,
    getShipmentByIdHandler,
    updateShipmentStatusHandler,
    updateShipmentHandler,
} from "./shipment.controller";
import { authenticateToken, requireOrg, requireRole } from "../../middleware/auth";

const router = Router();

// Read — VIEWER+
router.get("/",    authenticateToken, requireOrg, getShipmentsHandler);
router.get("/:id", authenticateToken, requireOrg, getShipmentByIdHandler);

// Create — MEMBER+
router.post("/", authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), createShipmentHandler);

// Update metadata — MEMBER+
router.patch("/:id",        authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), updateShipmentHandler);

// Status transitions — MEMBER+
router.patch("/:id/status", authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), updateShipmentStatusHandler);

export default router;
