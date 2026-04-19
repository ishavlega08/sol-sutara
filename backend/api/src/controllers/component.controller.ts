import { Request, Response } from "express";
import { createComponent, getComponents } from "../services/component.service";

export async function getComponentsHandler(_req: Request, res: Response) {
    try {
        const components = await getComponents();
        return res.status(200).json({ success: true, components });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

export async function createComponentHandler(req: Request, res: Response) {
    const { name, type, supplier, metadata } = req.body;

    if (!name || !type) {
        return res.status(400).json({ success: false, error: "name and type are required" });
    }

    if (metadata !== undefined && (typeof metadata !== "object" || Array.isArray(metadata))) {
        return res.status(400).json({ success: false, error: "metadata must be an object" });
    }

    try {
        const component = await createComponent({ name, type, supplier, metadata });

        return res.status(201).json({
            success: true,
            component: {
                id: component.id,
                name: component.name,
                metadataURI: component.metadata_uri,
                txHash: component.tx_hash,
                onChainAddress: component.on_chain_address,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
