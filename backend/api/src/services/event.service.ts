import { prisma } from "../lib/prisma";
import type { ComponentStatus } from "@prisma/client";

// ─── get component events ─────────────────────────────────────────────────────

export async function getComponentEvents(componentId: string) {
    const component = await prisma.component.findUnique({ where: { id: componentId } });
    if (!component) throw new Error(`Component not found: ${componentId}`);

    return prisma.componentEvent.findMany({
        where:   { component_id: componentId },
        include: { changer: { select: { email: true, wallet_address: true } } },
        orderBy: { created_at: "asc" },
    });
}

// ─── change component status ──────────────────────────────────────────────────

export async function changeComponentStatus(
    componentId: string,
    toStatus:    ComponentStatus,
    changedBy:   string,
    notes?:      string,
) {
    const component = await prisma.component.findUnique({ where: { id: componentId } });
    if (!component) throw new Error(`Component not found: ${componentId}`);

    const [event] = await prisma.$transaction([
        prisma.componentEvent.create({
            data: {
                component_id: componentId,
                from_status:  component.status,
                to_status:    toStatus,
                changed_by:   changedBy,
                notes,
            },
        }),
        prisma.component.update({
            where: { id: componentId },
            data:  { status: toStatus },
        }),
    ]);

    return { event, status: toStatus };
}
