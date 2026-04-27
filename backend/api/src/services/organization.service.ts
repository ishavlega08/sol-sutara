import { prisma } from "../lib/prisma";

export interface CreateOrgInput {
    name: string;
    slug: string;
}

export async function createOrg(input: CreateOrgInput) {
    return prisma.organization.create({
        data: { name: input.name, slug: input.slug },
    });
}

export async function getOrg(orgId: string) {
    return prisma.organization.findUnique({ where: { id: orgId } });
}

export async function getOrgBySlug(slug: string) {
    return prisma.organization.findUnique({ where: { slug } });
}

export async function getOrgComponents(orgId: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return null;

    return prisma.component.findMany({
        where:   { org_id: orgId },
        orderBy: { created_at: "desc" },
    });
}
