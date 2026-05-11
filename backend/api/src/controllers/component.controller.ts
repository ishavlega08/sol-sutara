import { Request, Response } from "express";
import {
    createComponent,
    getComponents,
    getComponentById,
    getComponentChildren,
    linkComponents,
    getComponentParents,
    traceComponent,
    recallComponent,
} from "../services/component.service";
import { scoreComponent } from "../services/risk.service";
import { notifyOrgMembers } from "../modules/notification/notification.service";
import { prisma } from "../lib/prisma";

// ─── GET /components/:id ─────────────────────────────────────────────────────

export async function getComponentByIdHandler(req: Request, res: Response) {
    const id = req.params["id"] as string;
    try {
        const component = await getComponentById(id);
        return res.status(200).json({ success: true, component });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /components/:id/children ────────────────────────────────────────────

export async function getChildrenHandler(req: Request, res: Response) {
    const id = req.params["id"] as string;
    try {
        const links = await getComponentChildren(id);
        return res.status(200).json({
            success: true,
            children: links.map((l) => ({
                linkId:          l.id,
                txHash:          l.tx_hash,
                createdAt:       l.created_at,
                child: {
                    id:             l.child.id,
                    name:           l.child.name,
                    type:           l.child.type,
                    onChainId:      l.child.on_chain_id?.toString(),
                    onChainAddress: l.child.on_chain_address,
                },
            })),
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

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
    const { name, type, supplier, supplierId, metadata, batch_number, lot_number, quantity, unit, expiry_date } = req.body as {
        name?:         string;
        type?:         string;
        supplier?:     string;
        supplierId?:   string;
        metadata?:     Record<string, unknown>;
        batch_number?: string;
        lot_number?:   string;
        quantity?:     number;
        unit?:         string;
        expiry_date?:  string;
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
        const component = await createComponent({ name, type, supplier, supplier_id: supplierId, metadata, org_id, batch_number, lot_number, quantity, unit, expiry_date });

        // Notify all members that a new component was registered on-chain
        if (org_id) {
            notifyOrgMembers({
                orgId:    org_id,
                title:    `Component registered: ${component.name}`,
                body:     `${component.type}${supplier ? ` · ${supplier}` : ""} was registered on Solana.`,
                type:     "component_created",
                entityId: component.id,
                roles:    ["OWNER", "ADMIN", "MEMBER"],
            }).catch(console.error);
        }

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
    const { parentId, childId, quantity, unit } = req.body as { parentId?: string; childId?: string; quantity?: number; unit?: string };

    if (!parentId || !childId) {
        return res.status(400).json({ success: false, error: "parentId and childId are required" });
    }
    if (parentId === childId) {
        return res.status(400).json({ success: false, error: "A component cannot be linked to itself" });
    }

    try {
        const link = await linkComponents(parentId, childId, quantity, unit);
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

// ─── GET /components/:id/affected ────────────────────────────────────────────

export async function getRecallHandler(req: Request, res: Response) {
    const id = req.params["id"] as string;

    try {
        const result = await recallComponent(id);
        return res.status(200).json({ success: true, ...result });
    } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /components/:id/risk ────────────────────────────────────────────────

export async function getRiskHandler(req: Request, res: Response) {
    const id = req.params["id"] as string;

    try {
        const risk = await scoreComponent(id);
        return res.status(200).json({ success: true, risk });
    } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /components/:id/trace ───────────────────────────────────────────────

export async function getTraceHandler(req: Request, res: Response) {
    const id       = req.params["id"] as string;
    const userId   = req.user?.userId;
    const maxDepth = Math.min(Math.max(Number(req.query["depth"] ?? 10), 1), 15);

    try {
        const tree = await traceComponent(id, new Set(), maxDepth);

        // Log trace operation as a ComponentEvent so it counts toward
        // traces_this_month in the usage dashboard.
        if (userId) {
            prisma.componentEvent.create({
                data: {
                    component_id: id,
                    to_status:    "CREATED",  // no status change — just logging the read
                    changed_by:   userId,
                    notes:        "trace_run",
                },
            }).catch(() => { /* non-fatal */ });
        }

        return res.status(200).json({ success: true, trace: tree });
    } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        if (msg.includes("Cycle"))     return res.status(422).json({ success: false, error: msg });
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
