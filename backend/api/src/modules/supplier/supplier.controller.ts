import { Request, Response } from "express";
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    updateSupplierStatus,
    deleteSupplier,
} from "./supplier.service";
import { notifySupplierStatusChange, notifyOrgMembers } from "../notification/notification.service";
import { dispatch } from "../webhook/webhook.dispatcher";
import type { SupplierStatus, SupplierRisk } from "@prisma/client";

// ─── POST /suppliers ──────────────────────────────────────────────────────────

export async function createSupplierHandler(req: Request, res: Response) {
    const orgId  = req.user!.orgId!;
    const userId = req.user!.userId;

    const { company_name, legal_name, contact_email, contact_phone, country, address, certifications, notes } = req.body as {
        company_name?:  string;
        legal_name?:    string;
        contact_email?: string;
        contact_phone?: string;
        country?:       string;
        address?:       string;
        certifications?: string[];
        notes?:         string;
    };

    if (!company_name?.trim()) {
        return res.status(400).json({ success: false, error: "company_name is required" });
    }

    try {
        const supplier = await createSupplier({ company_name, legal_name, contact_email, contact_phone, country, address, certifications, notes }, orgId, userId);

        // Notify OWNER + ADMIN that a new supplier was registered
        notifyOrgMembers({
            orgId,
            title:    `New supplier registered: ${supplier.company_name}`,
            body:     `${supplier.supplier_code} has been added to your supplier network.`,
            type:     "supplier_created",
            entityId: supplier.id,
            roles:    ["OWNER", "ADMIN"],
        }).catch(console.error);

        return res.status(201).json({ success: true, supplier });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /suppliers ───────────────────────────────────────────────────────────

export async function getSuppliersHandler(req: Request, res: Response) {
    const orgId = req.user!.orgId!;
    const { search, status, risk_level, page, limit } = req.query as Record<string, string>;

    try {
        const result = await getSuppliers(orgId, {
            search,
            status:    status as SupplierStatus | undefined,
            risk_level: risk_level as SupplierRisk | undefined,
            page:      page   ? Number(page)  : undefined,
            limit:     limit  ? Number(limit) : undefined,
        });
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /suppliers/:id ───────────────────────────────────────────────────────

export async function getSupplierByIdHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        const supplier = await getSupplierById(id, orgId);
        return res.status(200).json({ success: true, supplier });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── PATCH /suppliers/:id ─────────────────────────────────────────────────────

export async function updateSupplierHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        const supplier = await updateSupplier(id, req.body, orgId);
        return res.status(200).json({ success: true, supplier });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── PATCH /suppliers/:id/status ─────────────────────────────────────────────

export async function updateSupplierStatusHandler(req: Request, res: Response) {
    const { id }     = req.params as { id: string };
    const orgId      = req.user!.orgId!;
    const { status } = req.body as { status?: string };

    const VALID_STATUSES: SupplierStatus[] = ["PENDING_REVIEW", "APPROVED", "SUSPENDED", "REJECTED"];
    if (!status || !VALID_STATUSES.includes(status as SupplierStatus)) {
        return res.status(400).json({
            success: false,
            error:   `status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
    }

    try {
        const supplier = await updateSupplierStatus(id, status as SupplierStatus, orgId);

        // Notifications + webhooks (fire-and-forget)
        notifySupplierStatusChange({
            orgId,
            supplierId:   supplier.id,
            supplierName: supplier.company_name,
            supplierCode: supplier.supplier_code,
            status,
        }).catch(console.error);

        dispatch(orgId, `supplier.${status.toLowerCase()}`, {
            supplierId:   supplier.id,
            supplierCode: supplier.supplier_code,
            status,
        }).catch(console.error);

        return res.status(200).json({ success: true, supplier });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── DELETE /suppliers/:id ────────────────────────────────────────────────────

export async function deleteSupplierHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        await deleteSupplier(id, orgId);
        return res.status(200).json({ success: true, message: "Supplier deleted" });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
