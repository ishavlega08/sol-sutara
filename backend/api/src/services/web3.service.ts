import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, BN, Idl } from "@coral-xyz/anchor";

export interface OnChainResult {
    txHash: string;
    componentAddress: string;
}

function loadIdl(): Idl {
    try {
        return require("../../../target/idl/solsutara.json") as Idl;
    } catch {
        throw new Error("IDL not found. Run `anchor build` from backend/ first.");
    }
}

function buildProvider(): AnchorProvider {
    const rpcUrl = process.env.RPC_URL ?? clusterApiUrl("devnet");
    const rawKey = process.env.SERVER_KEYPAIR;
    if (!rawKey) throw new Error("SERVER_KEYPAIR env var is not set");

    const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(rawKey)));
    const connection = new Connection(rpcUrl, "confirmed");
    return new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });
}

function getCounterPDA(programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from("counter")], programId);
}

function getComponentPDA(creator: PublicKey, componentId: BN, programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("component"), creator.toBuffer(), componentId.toArrayLike(Buffer, "le", 8)],
        programId
    );
}

let _counterReady = false;

async function ensureCounter(program: Program, provider: AnchorProvider, programId: PublicKey): Promise<void> {
    if (_counterReady) return;
    const [counterPDA] = getCounterPDA(programId);
    const info = await provider.connection.getAccountInfo(counterPDA);
    if (!info) {
        const tx = await (program.methods as any)
            .initializeCounter()
            .accounts({ counter: counterPDA, payer: provider.wallet.publicKey })
            .rpc();
        await provider.connection.confirmTransaction(tx, "confirmed");
    }
    _counterReady = true;
}

export async function createComponentOnChain(
    _componentId: string,
    metadataUri: string
): Promise<OnChainResult> {
    const idl = loadIdl();
    const provider = buildProvider();
    const programId = new PublicKey((idl as any).address);
    const program = new Program(idl, provider);

    await ensureCounter(program, provider, programId);

    const creator = provider.wallet.publicKey;
    const [counterPDA] = getCounterPDA(programId);

    const counter = await (program.account as any).globalCounter.fetch(counterPDA);
    const nextId: BN = counter.totalComponents as BN;
    const [componentPDA] = getComponentPDA(creator, nextId, programId);

    const tx = await (program.methods as any)
        .createComponent(metadataUri)
        .accounts({ component: componentPDA, counter: counterPDA, creator })
        .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    return {
        txHash: tx,
        componentAddress: componentPDA.toBase58(),
    };
}
