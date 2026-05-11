import { Request, Response } from "express";
import {
    createShipment,
    getShipments,
    getShipmentById,
    updateShipmentStatus,
    updateShipment,
} from "./shipment.service";
import { notifyOrgMembers } from "../notification/notification.service";
import type { ShipmentStatus, ShipmentPriority } from "@prisma/client";

// ─── POST /shipments ──────────────────────────────────────────────────────────

export async function createShipmentHandler(req: Request, res: Response) {
    const orgId  = req.user!.orgId!;
    const userId = req.user!.userId;

    const { supplierId, origin, destination, carrier, trackingNumber, priority, estimatedDelivery, notes } = req.body as {
        supplierId?:        string;
        origin?:            string;
        destination?:       string;
        carrier?:           string;
        trackingNumber?:    string;
        priority?:          ShipmentPriority;
        estimatedDelivery?: string;
        notes?:             string;
    };

    if (!origin?.trim())      return res.status(400).json({ success: false, error: "origin is required" });
    if (!destination?.trim()) return res.status(400).json({ success: false, error: "destination is required" });

    try {
        const shipment = await createShipment({ supplierId, origin, destination, carrier, trackingNumber, priority, estimatedDelivery, notes }, orgId, userId);

        // Notify all members that a new shipment was created
        notifyOrgMembers({
            orgId,
            title:    `New shipment created: ${shipment.shipment_number}`,
            body:     `${origin} → ${destination}${carrier ? ` via ${carrier}` : ""}`,
            type:     "shipment_created",
            entityId: shipment.id,
            roles:    ["OWNER", "ADMIN", "MEMBER"],
        }).catch(console.error);

        return res.status(201).json({ success: true, shipment });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /shipments ───────────────────────────────────────────────────────────

export async function getShipmentsHandler(req: Request, res: Response) {
    const orgId = req.user!.orgId!;
    const { search, status, priority, supplierId, page, limit } = req.query as Record<string, string>;

    try {
        const result = await getShipments(orgId, {
            search,
            status:     status     as ShipmentStatus   | undefined,
            priority:   priority   as ShipmentPriority | undefined,
            supplierId,
            page:       page  ? Number(page)  : undefined,
            limit:      limit ? Number(limit) : undefined,
        });
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /shipments/:id ───────────────────────────────────────────────────────

export async function getShipmentByIdHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        const shipment = await getShipmentById(id, orgId);
        return res.status(200).json({ success: true, shipment });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── PATCH /shipments/:id/status ─────────────────────────────────────────────

export async function updateShipmentStatusHandler(req: Request, res: Response) {
    const { id }                    = req.params as { id: string };
    const orgId                     = req.user!.orgId!;
    const userId                    = req.user!.userId;
    const { status, location, notes } = req.body as {
        status?:   string;
        location?: string;
        notes?:    string;
    };

    const VALID_STATUSES: ShipmentStatus[] = [
        "CREATED", "PICKED_UP", "IN_TRANSIT", "CUSTOMS_HOLD", "DELAYED", "DELIVERED", "CANCELLED",
    ];

    if (!status || !VALID_STATUSES.includes(status as ShipmentStatus)) {
        return res.status(400).json({
            success: false,
            error:   `status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
    }

    try {
        const shipment = await updateShipmentStatus({
            id, orgId, userId,
            toStatus: status as ShipmentStatus,
            location,
            notes,
        });
        return res.status(200).json({ success: true, shipment });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found"))    return res.status(404).json({ success: false, error: msg });
        if (msg.includes("Invalid status")) return res.status(422).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── PATCH /shipments/:id ─────────────────────────────────────────────────────

export async function updateShipmentHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        const shipment = await updateShipment(id, orgId, req.body);
        return res.status(200).json({ success: true, shipment });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
