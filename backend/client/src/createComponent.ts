import { AnchorProvider, Program, BN, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const COUNTER_SEED = Buffer.from("counter");
const COMPONENT_SEED = Buffer.from("component");

function loadIdl(): Idl {
  try {
    return require("../../target/idl/solsutara.json") as Idl;
  } catch {
    throw new Error(
      "IDL not found. Run `anchor build` from the backend/ directory first."
    );
  }
}

function getProgramId(): PublicKey {
  const idl = loadIdl() as any;
  return new PublicKey(idl.address);
}

function getCounterPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([COUNTER_SEED], programId);
}

function getComponentPDA(
  creator: PublicKey,
  componentId: BN,
  programId: PublicKey
): [PublicKey, number] {
  const idBytes = componentId.toArrayLike(Buffer, "le", 8);
  return PublicKey.findProgramAddressSync(
    [COMPONENT_SEED, creator.toBuffer(), idBytes],
    programId
  );
}

export async function initializeCounter(provider: AnchorProvider): Promise<string> {
  const idl = loadIdl();
  const programId = getProgramId();
  const program = new Program(idl, provider);
  const [counterPDA] = getCounterPDA(programId);

  const tx = await (program.methods as any)
    .initializeCounter()
    .accounts({ counter: counterPDA, payer: provider.wallet.publicKey })
    .rpc();

  await provider.connection.confirmTransaction(tx, "confirmed");
  return tx;
}

export interface CreateComponentResult {
  componentId: string;
  txSignature: string;
  componentPDA: string;
}

export async function createComponent(
  provider: AnchorProvider,
  metadataUri: string
): Promise<CreateComponentResult> {
  if (!metadataUri || metadataUri.trim() === "") {
    throw new Error("metadataUri cannot be empty");
  }
  if (metadataUri.length > 200) {
    throw new Error("metadataUri exceeds 200 characters");
  }

  const idl = loadIdl();
  const programId = getProgramId();
  const program = new Program(idl, provider);
  const creator = provider.wallet.publicKey;
  const [counterPDA] = getCounterPDA(programId);

  const counterAccount = await (program.account as any).globalCounter.fetch(counterPDA);
  const nextId: BN = counterAccount.totalComponents as BN;
  const [componentPDA] = getComponentPDA(creator, nextId, programId);

  const tx = await (program.methods as any)
    .createComponent(metadataUri)
    .accounts({ component: componentPDA, counter: counterPDA, creator })
    .rpc();

  await provider.connection.confirmTransaction(tx, "confirmed");

  return {
    componentId: nextId.toString(),
    txSignature: tx,
    componentPDA: componentPDA.toBase58(),
  };
}
