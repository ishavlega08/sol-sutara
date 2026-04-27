import { prisma } from "../lib/prisma";
import { buildMetadata } from "./metadata.service";
import { uploadMetadata } from "./storage.service";
import { createComponentOnChain, linkComponentsOnChain } from "./web3.service";

// ─── create_component ─────────────────────────────────────────────────────────

export interface CreateComponentInput {
    name:      string;
    type:      string;
    supplier?: string;
    metadata?: Record<string, unknown>;
    org_id?:   string;
}

export async function getComponents(orgId?: string) {
    return prisma.component.findMany({
        where:   orgId ? { org_id: orgId } : undefined,
        orderBy: { created_at: "desc" },
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

export async function linkComponents(parentDbId: string, childDbId: string) {
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
        data: { parent_id: parentDbId, child_id: childDbId, tx_hash: txHash },
    });
}

// ─── get parents ─────────────────────────────────────────────────────────────

export async function getComponentParents(componentDbId: string) {
    const component = await prisma.component.findUnique({ where: { id: componentDbId } });
    if (!component) throw new Error(`Component not found: ${componentDbId}`);

    return prisma.componentLink.findMany({
        where:   { child_id: componentDbId },
        include: { parent: true },
    });
}
