import { prisma } from "../lib/prisma";

// ─── create recall ────────────────────────────────────────────────────────────

export async function createRecall(input: {
    componentId: string;
    reason:      string;
    scope:       string;
    issuedBy:    string;
    orgId?:      string;
}) {
    const component = await prisma.component.findUnique({ where: { id: input.componentId } });
    if (!component) throw new Error(`Component not found: ${input.componentId}`);

    // Mark the component status as RECALLED
    await prisma.component.update({
        where: { id: input.componentId },
        data:  { status: "RECALLED" },
    });

    // Create an event for the status change
    await prisma.componentEvent.create({
        data: {
            component_id: input.componentId,
            from_status:  component.status,
            to_status:    "RECALLED",
            changed_by:   input.issuedBy,
            notes:        `Recall issued: ${input.reason}`,
        },
    });

    return prisma.recall.create({
        data: {
            component_id: input.componentId,
            reason:       input.reason,
            scope:        input.scope,
            issued_by:    input.issuedBy,
            org_id:       input.orgId,
        },
        include: {
            component: { select: { id: true, name: true, type: true } },
            issuer:    { select: { email: true } },
        },
    });
}

// ─── get active recalls ───────────────────────────────────────────────────────

export async function getActiveRecalls(orgId?: string) {
    return prisma.recall.findMany({
        where: {
            status: "ACTIVE",
            ...(orgId ? { org_id: orgId } : {}),
        },
        include: {
            component: { select: { id: true, name: true, type: true } },
            issuer:    { select: { email: true } },
        },
        orderBy: { issued_at: "desc" },
    });
}

// ─── resolve recall ───────────────────────────────────────────────────────────

export async function resolveRecall(recallId: string, orgId?: string) {
    const recall = await prisma.recall.findUnique({ where: { id: recallId } });
    if (!recall) throw new Error(`Recall not found: ${recallId}`);
    if (orgId && recall.org_id !== orgId) throw new Error("Recall not found in your organization");

    return prisma.recall.update({
        where: { id: recallId },
        data:  { status: "RESOLVED", resolved_at: new Date() },
        include: {
            component: { select: { id: true, name: true, type: true } },
        },
    });
}
