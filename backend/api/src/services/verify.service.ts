import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { prisma } from "../lib/prisma";

export interface VerifyResult {
    verified:       boolean;
    onChainAddress: string | null;
    slot:           number | null;
    lamports:       number | null;
    error:          string | null;
}

export async function verifyOnChain(componentId: string): Promise<VerifyResult> {
    const component = await prisma.component.findUnique({ where: { id: componentId } });
    if (!component) throw new Error(`Component not found: ${componentId}`);

    // Seed components have mock addresses that can't be verified on-chain
    if (!component.on_chain_address) {
        return { verified: false, onChainAddress: null, slot: null, lamports: null, error: "No on-chain address recorded" };
    }

    if (component.on_chain_address.startsWith("SEED_")) {
        return { verified: false, onChainAddress: component.on_chain_address, slot: null, lamports: null, error: "Mock address (seed data) — not verifiable on devnet" };
    }

    const rpcUrl = process.env["RPC_URL"] ?? clusterApiUrl("devnet");
    const connection = new Connection(rpcUrl, "confirmed");

    try {
        const pubkey = new PublicKey(component.on_chain_address);
        const info   = await connection.getAccountInfo(pubkey);

        if (!info) {
            return {
                verified:       false,
                onChainAddress: component.on_chain_address,
                slot:           null,
                lamports:       null,
                error:          "Account not found on devnet",
            };
        }

        const slot = await connection.getSlot("confirmed");
        return {
            verified:       true,
            onChainAddress: component.on_chain_address,
            slot,
            lamports:       info.lamports,
            error:          null,
        };
    } catch (e) {
        return {
            verified:       false,
            onChainAddress: component.on_chain_address,
            slot:           null,
            lamports:       null,
            error:          e instanceof Error ? e.message : "RPC error",
        };
    }
}
