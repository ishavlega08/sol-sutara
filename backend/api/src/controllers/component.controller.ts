import { Request, Response } from "express";
import {
    createComponent,
    getComponents,
    linkComponents,
    getComponentParents,
} from "../services/component.service";

// ─── GET /components ──────────────────────────────────────────────────────────

export async function getComponentsHandler(req: Request, res: Response) {
    try {
        const orgId      = req.user?.orgId;
        const components = await getComponents(orgId);
        return res.status(200).json({ success: true, components });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── POST /components ─────────────────────────────────────────────────────────

export async function createComponentHandler(req: Request, res: Response) {
    const { name, type, supplier, metadata } = req.body as {
        name?:     string;
        type?:     string;
        supplier?: string;
        metadata?: Record<string, unknown>;
    };

    // orgId comes from the authenticated JWT; body org_id is ignored
    const org_id = req.user?.orgId;

    if (!name || !type) {
        return res.status(400).json({ success: false, error: "name and type are required" });
    }
    if (metadata !== undefined && (typeof metadata !== "object" || Array.isArray(metadata))) {
        return res.status(400).json({ success: false, error: "metadata must be an object" });
    }

    try {
        const component = await createComponent({ name, type, supplier, metadata, org_id });
        return res.status(201).json({
            success: true,
            component: {
                id:             component.id,
                name:           component.name,
                onChainId:      component.on_chain_id?.toString(),
                metadataURI:    component.metadata_uri,
                txHash:         component.tx_hash,
                onChainAddress: component.on_chain_address,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── POST /components/link ────────────────────────────────────────────────────

export async function linkComponentsHandler(req: Request, res: Response) {
    const { parentId, childId } = req.body as { parentId?: string; childId?: string };

    if (!parentId || !childId) {
        return res.status(400).json({ success: false, error: "parentId and childId are required" });
    }
    if (parentId === childId) {
        return res.status(400).json({ success: false, error: "A component cannot be linked to itself" });
    }

    try {
        const link = await linkComponents(parentId, childId);
        return res.status(201).json({
            success: true,
            link: {
                parentId:  link.parent_id,
                childId:   link.child_id,
                txHash:    link.tx_hash,
                createdAt: link.created_at,
            },
        });
    } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found"))        return res.status(404).json({ success: false, error: msg });
        if (msg.includes("not yet confirmed")) return res.status(422).json({ success: false, error: msg });
        if (msg.includes("already exists"))   return res.status(409).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /components/:id/parents ─────────────────────────────────────────────

export async function getParentsHandler(req: Request, res: Response) {
    const id = req.params["id"] as string;

    try {
        const links = await getComponentParents(id);
        return res.status(200).json({
            success: true,
            parents: links.map((l) => ({
                linkId:          l.id,
                txHash:          l.tx_hash,
                createdAt:       l.created_at,
                parent: {
                    id:             l.parent.id,
                    name:           l.parent.name,
                    onChainId:      l.parent.on_chain_id?.toString(),
                    onChainAddress: l.parent.on_chain_address,
                },
            })),
        });
    } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
