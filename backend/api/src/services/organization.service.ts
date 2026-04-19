import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma   = new PrismaClient({ adapter });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateOrgInput {
    name: string;
    slug: string;  // URL-safe identifier: lowercase letters, numbers, hyphens
}

// ─── createOrg ────────────────────────────────────────────────────────────────

export async function createOrg(input: CreateOrgInput) {
    return prisma.organization.create({
        data: { name: input.name, slug: input.slug },
    });
}

// ─── getOrg ───────────────────────────────────────────────────────────────────

export async function getOrg(orgId: string) {
    return prisma.organization.findUnique({
        where: { id: orgId },
    });
}

// ─── getOrgBySlug ─────────────────────────────────────────────────────────────

export async function getOrgBySlug(slug: string) {
    return prisma.organization.findUnique({
        where: { slug },
    });
}

// ─── getOrgComponents ─────────────────────────────────────────────────────────
// All components owned by this organization, newest first.
// Returns null if the org does not exist.

export async function getOrgComponents(orgId: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return null;

    return prisma.component.findMany({
        where:   { org_id: orgId },
        orderBy: { created_at: "desc" },
    });
}
