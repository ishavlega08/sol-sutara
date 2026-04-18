import {
  Connection,
  Keypair,
  clusterApiUrl,
} from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { createComponent, initializeCounter } from "../src";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const RPC_URL = process.env.RPC_URL ?? clusterApiUrl("devnet");

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  const keypairPath = process.env.KEYPAIR_PATH ?? path.join(os.homedir(), ".config/solana/id.json");
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));
  const payer = Keypair.fromSecretKey(secretKey);

  console.log("Payer:", payer.publicKey.toBase58());

  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Balance: ${balance / 1e9} SOL\n`);

  const wallet = new Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  console.log("Initializing counter...");
  const initTx = await initializeCounter(provider);
  console.log("Counter initialized. tx:", initTx, "\n");

  const components = [
    "https://arweave.net/component-alpha-metadata.json",
    "https://arweave.net/component-beta-metadata.json",
    "https://arweave.net/component-gamma-metadata.json",
  ];

  for (const uri of components) {
    const result = await createComponent(provider, uri);
    console.log(`Component created:`);
    console.log(`  ID:        ${result.componentId}`);
    console.log(`  PDA:       ${result.componentPDA}`);
    console.log(`  Tx:        ${result.txSignature}`);
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
