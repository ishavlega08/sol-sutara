import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import type { DocumentType } from "@prisma/client";
import { dispatch } from "../webhook/webhook.dispatcher";

// ─── Upload to Pinata (reuses existing credentials) ──────────────────────────

async function uploadFileToPinata(
    fileBase64: string,
    filename:   string,
    mimeType:   string,
    apiKey:     string,
    secretKey:  string,
): Promise<string> {
    const buffer = Buffer.from(fileBase64, "base64");
    const blob   = new Blob([buffer], { type: mimeType });

    const form = new FormData();
    form.append("file", blob, filename);
    form.append("pinataMetadata", JSON.stringify({ name: filename }));
    form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method:  "POST",
        headers: {
            pinata_api_key:        apiKey,
            pinata_secret_api_key: secretKey,
        },
        body: form,
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Pinata upload failed (${response.status}): ${body}`);
    }

    const result = (await response.json()) as { IpfsHash: string };
    return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
}

// ─── Upload to storage ────────────────────────────────────────────────────────

async function uploadFileToStorage(
    fileBase64: string,
    filename:   string,
    mimeType:   string,
): Promise<string> {
    const apiKey    = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY;

    if (apiKey && secretKey) {
        return uploadFileToPinata(fileBase64, filename, mimeType, apiKey, secretKey);
    }

    // Development fallback
    console.warn("[document] PINATA credentials not set — using mock storage URL");
    const hash = crypto.createHash("sha256").update(fileBase64).digest("hex").slice(0, 16);
    return `https://mock-storage.solsutara.dev/documents/${hash}/${filename}`;
}

// ─── Create document (upload + register) ─────────────────────────────────────

export interface CreateDocumentInput {
    name:        string;
    type:        DocumentType;
    fileBase64:  string;
    mimeType:    string;
    shipmentId?: string;
    supplierId?: string;
}

export async function createDocument(
    input:  CreateDocumentInput,
    orgId:  string,
    userId: string,
) {
    // Validate parent entity belongs to org
    if (input.shipmentId) {
        const shipment = await prisma.shipment.findFirst({ where: { id: input.shipmentId, org_id: orgId } });
        if (!shipment) throw new Error(`Shipment not found: ${input.shipmentId}`);
    }
    if (input.supplierId) {
        const supplier = await prisma.supplier.findFirst({ where: { id: input.supplierId, org_id: orgId } });
        if (!supplier) throw new Error(`Supplier not found: ${input.supplierId}`);
    }

    // Compute checksum from base64 before uploading
    const buffer   = Buffer.from(input.fileBase64, "base64");
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    const fileSize = buffer.byteLength;

    // Upload to storage
    const fileUrl = await uploadFileToStorage(input.fileBase64, input.name, input.mimeType);

    const document = await prisma.document.create({
        data: {
            org_id:      orgId,
            name:        input.name,
            type:        input.type,
            file_url:    fileUrl,
            file_size:   fileSize,
            mime_type:   input.mimeType,
            checksum,
            shipment_id: input.shipmentId ?? null,
            supplier_id: input.supplierId ?? null,
            uploaded_by: userId,
        },
        include: { uploader: { select: { email: true } } },
    });

    // Dispatch webhook (fire-and-forget)
    dispatch(orgId, "document.uploaded", {
        documentId:  document.id,
        name:        document.name,
        type:        document.type,
        shipmentId:  document.shipment_id,
        supplierId:  document.supplier_id,
    }).catch((err) => console.error("[document] webhook dispatch error:", err));

    return document;
}

// ─── Get documents ────────────────────────────────────────────────────────────

export async function getDocuments(orgId: string, filters: {
    shipmentId?: string;
    supplierId?: string;
    type?:       DocumentType;
    page?:       number;
    limit?:      number;
} = {}) {
    const { shipmentId, supplierId, type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
        org_id: orgId,
        ...(shipmentId ? { shipment_id: shipmentId } : {}),
        ...(supplierId ? { supplier_id: supplierId } : {}),
        ...(type       ? { type }                    : {}),
    };

    const [total, documents] = await Promise.all([
        prisma.document.count({ where }),
        prisma.document.findMany({
            where,
            orderBy: { created_at: "desc" },
            skip,
            take:    limit,
            include: { uploader: { select: { email: true } } },
        }),
    ]);

    return { documents, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Get document by id ───────────────────────────────────────────────────────

export async function getDocumentById(id: string, orgId: string) {
    const doc = await prisma.document.findFirst({
        where:   { id, org_id: orgId },
        include: { uploader: { select: { email: true } } },
    });
    if (!doc) throw new Error(`Document not found: ${id}`);
    return doc;
}

// ─── Delete document ──────────────────────────────────────────────────────────

export async function deleteDocument(id: string, orgId: string) {
    const doc = await prisma.document.findFirst({ where: { id, org_id: orgId } });
    if (!doc) throw new Error(`Document not found: ${id}`);

    await prisma.document.delete({ where: { id } });
}
