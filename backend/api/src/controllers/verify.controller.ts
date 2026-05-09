import { Request, Response } from "express";
import { verifyOnChain } from "../services/verify.service";

// ─── GET /components/:id/verify ───────────────────────────────────────────────

export async function verifyComponentHandler(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    try {
        const result = await verifyOnChain(id);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
