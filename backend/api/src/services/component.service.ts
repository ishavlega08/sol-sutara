import { prisma } from "../lib/prisma";
import { buildMetadata } from "./metadata.service";
import { uploadMetadata } from "./storage.service";
import { createComponentOnChain, linkComponentsOnChain } from "./web3.service";

// ─── create_component ─────────────────────────────────────────────────────────

export interface CreateComponentInput {
    name:         string;
    type:         string;
    supplier?:    string;
    metadata?:    Record<string, unknown>;
    org_id?:      string;
    batch_number?: string;
    lot_number?:   string;
    quantity?:     number;
    unit?:         string;
    expiry_date?:  string; // ISO date string
}

export async function getComponents(orgId?: string) {
    if (!orgId) return [];
    return prisma.component.findMany({
        where:   { org_id: orgId },
        orderBy: { created_at: "desc" },
    });
}

export async function getComponentById(id: string) {
    const component = await prisma.component.findUnique({ where: { id } });
    if (!component) throw new Error(`Component not found: ${id}`);
    return component;
}

export async function getComponentChildren(componentDbId: string) {
    const component = await prisma.component.findUnique({ where: { id: componentDbId } });
    if (!component) throw new Error(`Component not found: ${componentDbId}`);

    return prisma.componentLink.findMany({
        where:   { parent_id: componentDbId },
        include: { child: true },
    });
}

export async function createComponent(input: CreateComponentInput) {
    const component = await prisma.component.create({
        data: {
            name:         input.name,
            type:         input.type,
            supplier:     input.supplier,
            metadata_uri: "",
            org_id:       input.org_id,
            batch_number: input.batch_number,
            lot_number:   input.lot_number,
            quantity:     input.quantity,
            unit:         input.unit,
            expiry_date:  input.expiry_date ? new Date(input.expiry_date) : undefined,
        },
    });

    const metadata    = buildMetadata(input.name, input.type, input.supplier, input.metadata ?? {});
    const metadataUri = await uploadMetadata(component.id, metadata);
    const { txHash, componentAddress, componentId } = await createComponentOnChain(component.id, metadataUri);

    return prisma.component.update({
        where: { id: component.id },
        data: {
            metadata_uri:     metadataUri,
            on_chain_address: componentAddress,
            on_chain_id:      componentId,
            tx_hash:          txHash,
        },
    });
}

// ─── link_components ──────────────────────────────────────────────────────────

export async function linkComponents(parentDbId: string, childDbId: string, quantity?: number, unit?: string) {
    const [parent, child] = await Promise.all([
        prisma.component.findUnique({ where: { id: parentDbId } }),
        prisma.component.findUnique({ where: { id: childDbId  } }),
    ]);

    if (!parent) throw new Error(`Parent component not found: ${parentDbId}`);
    if (!child)  throw new Error(`Child component not found: ${childDbId}`);

    if (!parent.on_chain_address || parent.on_chain_id == null) {
        throw new Error("Parent component is not yet confirmed on-chain");
    }
    if (!child.on_chain_address || child.on_chain_id == null) {
        throw new Error("Child component is not yet confirmed on-chain");
    }

    const existing = await prisma.componentLink.findUnique({
        where: { parent_id_child_id: { parent_id: parentDbId, child_id: childDbId } },
    });
    if (existing) throw new Error("This parent-child relationship already exists");

    const { txHash } = await linkComponentsOnChain(
        parent.on_chain_address,
        child.on_chain_address,
        parent.on_chain_id,
        child.on_chain_id
    );

    return prisma.componentLink.create({
        data: { parent_id: parentDbId, child_id: childDbId, tx_hash: txHash, quantity, unit },
    });
}

// ─── get parents (1-level) ────────────────────────────────────────────────────

export async function getComponentParents(componentDbId: string) {
    const component = await prisma.component.findUnique({ where: { id: componentDbId } });
    if (!component) throw new Error(`Component not found: ${componentDbId}`);

    return prisma.componentLink.findMany({
        where:   { child_id: componentDbId },
        include: { parent: true },
    });
}

// ─── recall engine (BFS downstream traversal) ────────────────────────────────

export interface AffectedComponent {
    id:           string;
    name:         string;
    type:         string;
    supplier:     string | null;
    on_chain_id:  string | null;
    tx_hash:      string | null;
    depth:        number;       // hops from the defective root
    parentId:     string;       // direct parent in the BFS traversal
}

export async function recallComponent(rootId: string): Promise<{
    root:     { id: string; name: string; type: string };
    affected: AffectedComponent[];
    total:    number;
}> {
    const root = await prisma.component.findUnique({ where: { id: rootId } });
    if (!root) throw new Error(`Component not found: ${rootId}`);

    const affected: AffectedComponent[] = [];
    const visited  = new Set<string>([rootId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];

    while (queue.length > 0) {
        const { id: currentId, depth } = queue.shift()!;

        const childLinks = await prisma.componentLink.findMany({
            where:   { parent_id: currentId },
            include: { child: true },
        });

        for (const link of childLinks) {
            if (visited.has(link.child_id)) continue;
            visited.add(link.child_id);

            affected.push({
                id:          link.child.id,
                name:        link.child.name,
                type:        link.child.type,
                supplier:    link.child.supplier,
                on_chain_id: link.child.on_chain_id?.toString() ?? null,
                tx_hash:     link.child.tx_hash,
                depth:       depth + 1,
                parentId:    currentId,
            });

            queue.push({ id: link.child_id, depth: depth + 1 });
        }
    }

    return {
        root:     { id: root.id, name: root.name, type: root.type },
        affected,
        total:    affected.length,
    };
}

// ─── trace engine (recursive upstream DFS) ───────────────────────────────────

export interface TraceNode {
    id:             string;
    name:           string;
    type:           string;
    supplier:       string | null;
    on_chain_id:    string | null;
    metadata_uri:   string;
    tx_hash:        string | null;
    created_at:     Date;
    parents:        TraceNode[];
}

export async function traceComponent(
    componentDbId: string,
    visited     = new Set<string>(),
    maxDepth    = 10,
    currentDepth = 0,
): Promise<TraceNode> {
    if (visited.has(componentDbId)) {
        throw new Error(`Cycle detected at component: ${componentDbId}`);
    }
    visited.add(componentDbId);

    const component = await prisma.component.findUnique({ where: { id: componentDbId } });
    if (!component) throw new Error(`Component not found: ${componentDbId}`);

    // Stop recursing at max depth — return node with no parents shown
    if (currentDepth >= maxDepth) {
        return {
            id:           component.id,
            name:         component.name,
            type:         component.type,
            supplier:     component.supplier,
            on_chain_id:  component.on_chain_id?.toString() ?? null,
            metadata_uri: component.metadata_uri,
            tx_hash:      component.tx_hash,
            created_at:   component.created_at,
            parents:      [],
        };
    }

    const parentLinks = await prisma.componentLink.findMany({
        where:   { child_id: componentDbId },
        include: { parent: true },
    });

    const parents = await Promise.all(
        parentLinks.map((link) => traceComponent(link.parent_id, new Set(visited), maxDepth, currentDepth + 1))
    );

    return {
        id:           component.id,
        name:         component.name,
        type:         component.type,
        supplier:     component.supplier,
        on_chain_id:  component.on_chain_id?.toString() ?? null,
        metadata_uri: component.metadata_uri,
        tx_hash:      component.tx_hash,
        created_at:   component.created_at,
        parents,
    };
}
