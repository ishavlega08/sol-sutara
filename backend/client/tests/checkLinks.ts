/**
 * checkLinks.ts — Fetch a component account and print its parents array.
 *
 * Usage:
 *   COMPONENT_ID=1 npx ts-node client/tests/checkLinks.ts
 *
 * Or check multiple IDs at once:
 *   COMPONENT_IDS=0,1,2 npx ts-node client/tests/checkLinks.ts
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Wallet, Program, BN, Idl } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const RPC_URL     = process.env.RPC_URL     ?? clusterApiUrl("devnet");
const KEYPAIR_PATH = process.env.KEYPAIR_PATH ?? path.join(os.homedir(), ".config/solana/id.json");

const COMPONENT_SEED = Buffer.from("component");

function getComponentPDA(creator: PublicKey, componentId: number, programId: PublicKey): PublicKey {
  const idBytes = Buffer.alloc(8);
  idBytes.writeBigUInt64LE(BigInt(componentId));
  const [pda] = PublicKey.findProgramAddressSync(
    [COMPONENT_SEED, creator.toBuffer(), idBytes],
    programId
  );
  return pda;
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const secretKey  = Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf-8")));
  const payer      = Keypair.fromSecretKey(secretKey);
  const provider   = new AnchorProvider(connection, new Wallet(payer), { commitment: "confirmed" });

  const idl: Idl   = require("../../target/idl/solsutara.json");
  const programId  = new PublicKey((idl as any).address);
  const program    = new Program(idl, provider);

  // Resolve which IDs to check
  const rawIds = process.env.COMPONENT_IDS ?? process.env.COMPONENT_ID ?? "0,1,2";
  const ids    = rawIds.split(",").map((s) => parseInt(s.trim(), 10));

  console.log(`Checking components [${ids.join(", ")}] for wallet ${payer.publicKey.toBase58()}\n`);
  console.log("─".repeat(60));

  for (const id of ids) {
    const pda = getComponentPDA(payer.publicKey, id, programId);
    try {
      const acc = await (program.account as any).component.fetch(pda);
      const parents: number[] = (acc.parents as BN[]).map((p: BN) => p.toNumber());

      console.log(`Component ID : ${acc.componentId.toString()}`);
      console.log(`PDA          : ${pda.toBase58()}`);
      console.log(`Metadata URI : ${acc.metadataUri}`);
      console.log(`Creator      : ${acc.creator.toBase58()}`);
      console.log(`Parents      : [${parents.length ? parents.join(", ") : "none"}]`);
      console.log("─".repeat(60));
    } catch {
      console.log(`Component ID ${id} — account not found at ${pda.toBase58()}`);
      console.log("─".repeat(60));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
