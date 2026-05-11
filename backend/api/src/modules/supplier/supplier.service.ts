import { prisma } from "../../lib/prisma";
import type { SupplierStatus, SupplierRisk } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateSupplierInput {
    company_name:   string;
    legal_name?:    string;
    contact_email?: string;
    contact_phone?: string;
    country?:       string;
    address?:       string;
    certifications?: string[];
    notes?:         string;
}

export interface UpdateSupplierInput {
    company_name?:   string;
    legal_name?:     string;
    contact_email?:  string;
    contact_phone?:  string;
    country?:        string;
    address?:        string;
    certifications?: string[];
    notes?:          string;
    risk_level?:     SupplierRisk;
}

export interface SupplierFilters {
    search?:    string;
    status?:    SupplierStatus;
    risk_level?: SupplierRisk;
    page?:      number;
    limit?:     number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSupplierCode(): string {
    return `SUP-${Date.now().toString(36).toUpperCase()}`;
}

// ─── create supplier ──────────────────────────────────────────────────────────

export async function createSupplier(
    input:     CreateSupplierInput,
    orgId:     string,
    userId:    string,
) {
    const supplier_code = generateSupplierCode();

    return prisma.supplier.create({
        data: {
            org_id:         orgId,
            supplier_code,
            company_name:   input.company_name,
            legal_name:     input.legal_name,
            contact_email:  input.contact_email,
            contact_phone:  input.contact_phone,
            country:        input.country,
            address:        input.address,
            certifications: input.certifications ?? [],
            notes:          input.notes,
            created_by:     userId,
        },
        include: { creator: { select: { email: true } } },
    });
}

// ─── get suppliers (paginated + filtered) ─────────────────────────────────────

export async function getSuppliers(orgId: string, filters: SupplierFilters = {}) {
    const { search, status, risk_level, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
        org_id: orgId,
        ...(status     ? { status }              : {}),
        ...(risk_level ? { risk_level }           : {}),
        ...(search     ? {
            OR: [
                { company_name:  { contains: search, mode: "insensitive" as const } },
                { supplier_code: { contains: search, mode: "insensitive" as const } },
                { contact_email: { contains: search, mode: "insensitive" as const } },
                { country:       { contains: search, mode: "insensitive" as const } },
            ],
        } : {}),
    };

    const [total, suppliers] = await Promise.all([
        prisma.supplier.count({ where }),
        prisma.supplier.findMany({
            where,
            orderBy: { created_at: "desc" },
            skip,
            take:    limit,
            include: {
                creator:  { select: { email: true } },
                _count:   { select: { shipments: true, components: true, documents: true } },
            },
        }),
    ]);

    return { suppliers, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── get supplier by id ───────────────────────────────────────────────────────

export async function getSupplierById(id: string, orgId: string) {
    const supplier = await prisma.supplier.findFirst({
        where:   { id, org_id: orgId },
        include: {
            creator:   { select: { email: true } },
            shipments: {
                orderBy: { created_at: "desc" },
                take:    5,
                select: {
                    id: true, shipment_number: true, status: true,
                    origin: true, destination: true, created_at: true,
                },
            },
            documents: {
                orderBy: { created_at: "desc" },
                take:    10,
                select: {
                    id: true, name: true, type: true,
                    file_url: true, created_at: true,
                },
            },
            components: {
                orderBy: { created_at: "desc" },
                take:    20,
                select: {
                    id: true, name: true, type: true, supplier: true,
                    status: true, batch_number: true, created_at: true,
                },
            },
            _count: { select: { shipments: true, components: true, documents: true } },
        },
    });
    if (!supplier) throw new Error(`Supplier not found: ${id}`);
    return supplier;
}

// ─── update supplier ──────────────────────────────────────────────────────────

export async function updateSupplier(
    id:     string,
    input:  UpdateSupplierInput,
    orgId:  string,
) {
    const existing = await prisma.supplier.findFirst({ where: { id, org_id: orgId } });
    if (!existing) throw new Error(`Supplier not found: ${id}`);

    return prisma.supplier.update({
        where: { id },
        data:  {
            ...(input.company_name   !== undefined ? { company_name:   input.company_name   } : {}),
            ...(input.legal_name     !== undefined ? { legal_name:     input.legal_name     } : {}),
            ...(input.contact_email  !== undefined ? { contact_email:  input.contact_email  } : {}),
            ...(input.contact_phone  !== undefined ? { contact_phone:  input.contact_phone  } : {}),
            ...(input.country        !== undefined ? { country:        input.country        } : {}),
            ...(input.address        !== undefined ? { address:        input.address        } : {}),
            ...(input.certifications !== undefined ? { certifications: input.certifications } : {}),
            ...(input.notes          !== undefined ? { notes:          input.notes          } : {}),
            ...(input.risk_level     !== undefined ? { risk_level:     input.risk_level     } : {}),
        },
        include: { creator: { select: { email: true } } },
    });
}

// ─── update supplier status ───────────────────────────────────────────────────

export async function updateSupplierStatus(
    id:     string,
    status: SupplierStatus,
    orgId:  string,
) {
    const existing = await prisma.supplier.findFirst({ where: { id, org_id: orgId } });
    if (!existing) throw new Error(`Supplier not found: ${id}`);

    return prisma.supplier.update({
        where: { id },
        data:  { status },
    });
}

// ─── delete supplier ──────────────────────────────────────────────────────────

export async function deleteSupplier(id: string, orgId: string) {
    const existing = await prisma.supplier.findFirst({ where: { id, org_id: orgId } });
    if (!existing) throw new Error(`Supplier not found: ${id}`);

    await prisma.supplier.delete({ where: { id } });
}
