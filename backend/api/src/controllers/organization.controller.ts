import { Request, Response } from "express";
import {
    createOrg,
    getOrg,
    getOrgComponents,
} from "../services/organization.service";

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

// ─── POST /organizations ──────────────────────────────────────────────────────

export async function createOrgHandler(req: Request, res: Response) {
    const { name, slug } = req.body;

    if (!name || !slug) {
        return res.status(400).json({ success: false, error: "name and slug are required" });
    }

    if (!SLUG_RE.test(slug)) {
        return res.status(400).json({
            success: false,
            error: "slug must use lowercase letters, numbers, and hyphens only, and cannot start or end with a hyphen",
        });
    }

    try {
        const org = await createOrg({ name, slug });
        return res.status(201).json({ success: true, org });
    } catch (err: any) {
        console.error(err);
        if (err.code === "P2002") {
            return res.status(409).json({ success: false, error: `Organization slug '${slug}' is already taken` });
        }
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /organizations/:id ───────────────────────────────────────────────────

export async function getOrgHandler(req: Request, res: Response) {
    const id = req.params["id"] as string;

    try {
        const org = await getOrg(id);
        if (!org) {
            return res.status(404).json({ success: false, error: `Organization not found: ${id}` });
        }
        return res.status(200).json({ success: true, org });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /organizations/:id/components ────────────────────────────────────────

export async function getOrgComponentsHandler(req: Request, res: Response) {
    const id = req.params["id"] as string;

    try {
        const components = await getOrgComponents(id);
        if (components === null) {
            return res.status(404).json({ success: false, error: `Organization not found: ${id}` });
        }
        const serialized = JSON.parse(
            JSON.stringify(components, (_key, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        );
        return res.status(200).json({ success: true, components: serialized });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
