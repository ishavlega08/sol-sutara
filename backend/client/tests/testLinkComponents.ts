/**
 * Feature #3 — Component Linking (Graph Formation)
 *
 * Creates three components and links them into a supply-chain graph:
 *
 *   Raw Material (ID 0)  ──►  Part (ID 1)  ──►  Product (ID 2)
 *
 * Run:
 *   cd backend && npx ts-node client/tests/testLinkComponents.ts
 */

import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Wallet, Program, BN } from "@coral-xyz/anchor";
import { createComponent, initializeCounter, linkComponents } from "../src";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const RPC_URL = process.env.RPC_URL ?? clusterApiUrl("devnet");

async function main() {
  // ── Provider setup ─────────────────────────────────────────────────────────
  const connection = new Connection(RPC_URL, "confirmed");

  const keypairPath =
    process.env.KEYPAIR_PATH ?? path.join(os.homedir(), ".config/solana/id.json");
  const secretKey = Uint8Array.from(
    JSON.parse(fs.readFileSync(keypairPath, "utf-8"))
  );
  const payer = Keypair.fromSecretKey(secretKey);
  const wallet = new Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });

  console.log("Wallet:", payer.publicKey.toBase58());
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Balance: ${(balance / 1e9).toFixed(4)} SOL\n`);

  // ── Initialize counter (skip if already done) ───────────────────────────────
  try {
    const initTx = await initializeCounter(provider);
    console.log("Counter initialized. tx:", initTx, "\n");
  } catch (err: any) {
    // AlreadyInUse / custom error means counter already exists — safe to continue
    console.log("Counter already initialized, skipping.\n");
  }

  // ── Create components ───────────────────────────────────────────────────────
  const definitions = [
    { label: "Raw Material", uri: "https://arweave.net/raw-material-metadata.json" },
    { label: "Part",         uri: "https://arweave.net/part-metadata.json" },
    { label: "Product",      uri: "https://arweave.net/product-metadata.json" },
  ];

  const created: { label: string; componentId: number; pda: string }[] = [];

  console.log("── Creating components ──────────────────────────────────────────");
  for (const def of definitions) {
    const result = await createComponent(provider, def.uri);
    created.push({ label: def.label, componentId: Number(result.componentId), pda: result.componentPDA });
    console.log(`[${def.label}]`);
    console.log(`  ID:  ${result.componentId}`);
    console.log(`  PDA: ${result.componentPDA}`);
    console.log(`  Tx:  ${result.txSignature}`);
    console.log();
  }

  // ── Link components: Raw Material → Part → Product ──────────────────────────
  console.log("── Linking components ───────────────────────────────────────────");

  const rawMaterial = created[0];
  const part        = created[1];
  const product     = created[2];

  // Link 1: Raw Material → Part
  console.log(`Linking [${rawMaterial.label}] (ID ${rawMaterial.componentId}) → [${part.label}] (ID ${part.componentId})`);
  const link1 = await linkComponents(provider, rawMaterial.componentId, part.componentId);
  console.log(`  Tx: ${link1.txSignature}\n`);

  // Link 2: Part → Product
  console.log(`Linking [${part.label}] (ID ${part.componentId}) → [${product.label}] (ID ${product.componentId})`);
  const link2 = await linkComponents(provider, part.componentId, product.componentId);
  console.log(`  Tx: ${link2.txSignature}\n`);

  // ── Verify on-chain state ───────────────────────────────────────────────────
  console.log("── Verifying on-chain parent relationships ──────────────────────");

  const idl = require("../../target/idl/solsutara.json");
  const program = new Program(idl, provider);

  for (const c of created) {
    const account = await (program.account as any).component.fetch(c.pda);
    const parentIds: number[] = (account.parents as BN[]).map((p: BN) => p.toNumber());
    console.log(`[${c.label}] (ID ${c.componentId})`);
    console.log(`  parents: [${parentIds.length > 0 ? parentIds.join(", ") : "none"}]`);
  }

  console.log("\nGraph:");
  console.log(
    `  ${rawMaterial.label} (${rawMaterial.componentId}) ──► ${part.label} (${part.componentId}) ──► ${product.label} (${product.componentId})`
  );

  // ── Duplicate link guard check ──────────────────────────────────────────────
  console.log("\n── Testing duplicate-link rejection ─────────────────────────────");
  try {
    await linkComponents(provider, rawMaterial.componentId, part.componentId);
    console.log("ERROR: duplicate link was not rejected!");
    process.exit(1);
  } catch {
    console.log("Duplicate link correctly rejected.");
  }

  // ── Self-link guard check ───────────────────────────────────────────────────
  console.log("\n── Testing self-link rejection ──────────────────────────────────");
  try {
    await linkComponents(provider, rawMaterial.componentId, rawMaterial.componentId);
    console.log("ERROR: self-link was not rejected!");
    process.exit(1);
  } catch {
    console.log("Self-link correctly rejected.");
  }

  console.log("\nAll checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
