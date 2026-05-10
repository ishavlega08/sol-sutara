import { Request, Response } from "express";
import {
    createDocument,
    getDocuments,
    getDocumentById,
    deleteDocument,
} from "./document.service";
import type { DocumentType } from "@prisma/client";

const VALID_TYPES: DocumentType[] = [
    "INVOICE", "CERTIFICATION", "CUSTOMS", "INSPECTION_REPORT", "BILL_OF_LADING", "OTHER",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── POST /documents ──────────────────────────────────────────────────────────

export async function createDocumentHandler(req: Request, res: Response) {
    const orgId  = req.user!.orgId!;
    const userId = req.user!.userId;

    const { name, type, fileBase64, mimeType, shipmentId, supplierId } = req.body as {
        name?:        string;
        type?:        string;
        fileBase64?:  string;
        mimeType?:    string;
        shipmentId?:  string;
        supplierId?:  string;
    };

    if (!name?.trim())     return res.status(400).json({ success: false, error: "name is required" });
    if (!fileBase64)       return res.status(400).json({ success: false, error: "fileBase64 is required" });
    if (!mimeType?.trim()) return res.status(400).json({ success: false, error: "mimeType is required" });

    const docType = (type as DocumentType) ?? "OTHER";
    if (!VALID_TYPES.includes(docType)) {
        return res.status(400).json({
            success: false,
            error:   `type must be one of: ${VALID_TYPES.join(", ")}`,
        });
    }

    // Validate base64 size
    const fileSizeBytes = Math.ceil((fileBase64.length * 3) / 4);
    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
        return res.status(413).json({ success: false, error: "File exceeds 10 MB limit" });
    }

    try {
        const document = await createDocument(
            { name, type: docType, fileBase64, mimeType, shipmentId, supplierId },
            orgId,
            userId,
        );
        return res.status(201).json({ success: true, document });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /documents ───────────────────────────────────────────────────────────

export async function getDocumentsHandler(req: Request, res: Response) {
    const orgId = req.user!.orgId!;
    const { shipmentId, supplierId, type, page, limit } = req.query as Record<string, string>;

    try {
        const result = await getDocuments(orgId, {
            shipmentId,
            supplierId,
            type:  type  as DocumentType | undefined,
            page:  page  ? Number(page)  : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /documents/:id ───────────────────────────────────────────────────────

export async function getDocumentByIdHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        const document = await getDocumentById(id, orgId);
        return res.status(200).json({ success: true, document });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── DELETE /documents/:id ────────────────────────────────────────────────────

export async function deleteDocumentHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const orgId  = req.user!.orgId!;

    try {
        await deleteDocument(id, orgId);
        return res.status(200).json({ success: true, message: "Document deleted" });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
