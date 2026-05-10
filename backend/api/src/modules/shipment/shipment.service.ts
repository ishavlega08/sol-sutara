import { prisma } from "../../lib/prisma";
import type { ShipmentStatus, ShipmentPriority } from "@prisma/client";
import { notifyShipmentStatusChange } from "../notification/notification.service";
import { dispatch } from "../webhook/webhook.dispatcher";

// ─── Status transition matrix ─────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
    CREATED:      ["PICKED_UP", "CANCELLED"],
    PICKED_UP:    ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT:   ["CUSTOMS_HOLD", "DELAYED", "DELIVERED", "CANCELLED"],
    CUSTOMS_HOLD: ["IN_TRANSIT", "DELAYED", "CANCELLED"],
    DELAYED:      ["IN_TRANSIT", "CANCELLED"],
    DELIVERED:    [],
    CANCELLED:    [],
};

export function isValidTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateShipmentNumber(): string {
    return `SHP-${Date.now().toString(36).toUpperCase()}`;
}

// ─── create shipment ─────────────────────────────────────────────────────────

export interface CreateShipmentInput {
    supplierId?:         string;
    origin:              string;
    destination:         string;
    carrier?:            string;
    trackingNumber?:     string;
    priority?:           ShipmentPriority;
    estimatedDelivery?:  string; // ISO date string
    notes?:              string;
}

export async function createShipment(
    input:  CreateShipmentInput,
    orgId:  string,
    userId: string,
) {
    if (input.supplierId) {
        const supplier = await prisma.supplier.findFirst({
            where: { id: input.supplierId, org_id: orgId },
        });
        if (!supplier) throw new Error(`Supplier not found: ${input.supplierId}`);
    }

    const shipment_number = generateShipmentNumber();

    const shipment = await prisma.shipment.create({
        data: {
            org_id:             orgId,
            shipment_number,
            supplier_id:        input.supplierId ?? null,
            origin:             input.origin,
            destination:        input.destination,
            carrier:            input.carrier ?? null,
            tracking_number:    input.trackingNumber ?? null,
            priority:           input.priority ?? "STANDARD",
            estimated_delivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : null,
            notes:              input.notes ?? null,
            created_by:         userId,
        },
        include: {
            supplier: { select: { company_name: true, supplier_code: true } },
            creator:  { select: { email: true } },
        },
    });

    // Create initial CREATED event
    await prisma.shipmentEvent.create({
        data: {
            shipment_id: shipment.id,
            to_status:   "CREATED",
            notes:       "Shipment created",
            recorded_by: userId,
        },
    });

    // Dispatch webhook
    dispatch(orgId, "shipment.created", {
        shipmentId:     shipment.id,
        shipmentNumber: shipment_number,
        origin:         input.origin,
        destination:    input.destination,
    }).catch((err) => console.error("[shipment] webhook dispatch error:", err));

    return shipment;
}

// ─── get shipments (paginated + filtered) ────────────────────────────────────

export interface ShipmentFilters {
    search?:     string;
    status?:     ShipmentStatus;
    priority?:   ShipmentPriority;
    supplierId?: string;
    page?:       number;
    limit?:      number;
}

export async function getShipments(orgId: string, filters: ShipmentFilters = {}) {
    const { search, status, priority, supplierId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
        org_id: orgId,
        ...(status     ? { status }                          : {}),
        ...(priority   ? { priority }                        : {}),
        ...(supplierId ? { supplier_id: supplierId }         : {}),
        ...(search     ? {
            OR: [
                { shipment_number: { contains: search, mode: "insensitive" as const } },
                { origin:          { contains: search, mode: "insensitive" as const } },
                { destination:     { contains: search, mode: "insensitive" as const } },
                { carrier:         { contains: search, mode: "insensitive" as const } },
                { tracking_number: { contains: search, mode: "insensitive" as const } },
            ],
        } : {}),
    };

    const [total, shipments] = await Promise.all([
        prisma.shipment.count({ where }),
        prisma.shipment.findMany({
            where,
            orderBy: { created_at: "desc" },
            skip,
            take:    limit,
            include: {
                supplier: { select: { company_name: true, supplier_code: true } },
                creator:  { select: { email: true } },
                _count:   { select: { events: true, documents: true } },
            },
        }),
    ]);

    return { shipments, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── get shipment by id ───────────────────────────────────────────────────────

export async function getShipmentById(id: string, orgId: string) {
    const shipment = await prisma.shipment.findFirst({
        where: { id, org_id: orgId },
        include: {
            supplier:  { select: { id: true, company_name: true, supplier_code: true } },
            creator:   { select: { email: true } },
            events: {
                orderBy: { created_at: "asc" },
                include: { recorder: { select: { email: true } } },
            },
            documents: {
                orderBy: { created_at: "desc" },
                select: {
                    id: true, name: true, type: true,
                    file_url: true, created_at: true,
                },
            },
        },
    });
    if (!shipment) throw new Error(`Shipment not found: ${id}`);
    return shipment;
}

// ─── update shipment status ───────────────────────────────────────────────────

export async function updateShipmentStatus(params: {
    id:       string;
    orgId:    string;
    userId:   string;
    toStatus: ShipmentStatus;
    location?: string;
    notes?:   string;
}) {
    const shipment = await prisma.shipment.findFirst({ where: { id: params.id, org_id: params.orgId } });
    if (!shipment) throw new Error(`Shipment not found: ${params.id}`);

    if (!isValidTransition(shipment.status, params.toStatus)) {
        throw new Error(
            `Invalid status transition: ${shipment.status} → ${params.toStatus}`
        );
    }

    const isDelivered = params.toStatus === "DELIVERED";

    // Atomic: update shipment + append tracking event
    const [updatedShipment] = await prisma.$transaction([
        prisma.shipment.update({
            where: { id: params.id },
            data: {
                status:          params.toStatus,
                ...(isDelivered ? { actual_delivery: new Date() } : {}),
            },
        }),
        prisma.shipmentEvent.create({
            data: {
                shipment_id: params.id,
                from_status: shipment.status,
                to_status:   params.toStatus,
                location:    params.location ?? null,
                notes:       params.notes ?? null,
                recorded_by: params.userId,
            },
        }),
    ]);

    // Notify org members (fire-and-forget)
    notifyShipmentStatusChange({
        orgId:          params.orgId,
        shipmentNumber: shipment.shipment_number,
        shipmentId:     params.id,
        status:         params.toStatus,
        origin:         shipment.origin,
        destination:    shipment.destination,
        notes:          params.notes,
        location:       params.location,
    }).catch((err) => console.error("[shipment] notification error:", err));

    // Dispatch webhook
    dispatch(params.orgId, `shipment.${params.toStatus.toLowerCase()}`, {
        shipmentId:     params.id,
        shipmentNumber: shipment.shipment_number,
        from:           shipment.status,
        to:             params.toStatus,
        location:       params.location,
    }).catch((err) => console.error("[shipment] webhook dispatch error:", err));

    return updatedShipment;
}

// ─── update shipment metadata ─────────────────────────────────────────────────

export async function updateShipment(
    id:    string,
    orgId: string,
    input: {
        carrier?:           string;
        trackingNumber?:    string;
        estimatedDelivery?: string;
        notes?:             string;
        priority?:          ShipmentPriority;
    },
) {
    const existing = await prisma.shipment.findFirst({ where: { id, org_id: orgId } });
    if (!existing) throw new Error(`Shipment not found: ${id}`);

    return prisma.shipment.update({
        where: { id },
        data: {
            ...(input.carrier           !== undefined ? { carrier:           input.carrier           } : {}),
            ...(input.trackingNumber    !== undefined ? { tracking_number:   input.trackingNumber    } : {}),
            ...(input.priority          !== undefined ? { priority:          input.priority          } : {}),
            ...(input.notes             !== undefined ? { notes:             input.notes             } : {}),
            ...(input.estimatedDelivery !== undefined ? {
                estimated_delivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : null,
            } : {}),
        },
    });
}
