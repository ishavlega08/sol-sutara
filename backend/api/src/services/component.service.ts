import { PrismaClient } from "@prisma/client";
import { buildMetadata } from "./metadata.service";
import { uploadMetadata } from "./storage.service";
import { createComponentOnChain } from "./web3.service";

const prisma = new PrismaClient();

export interface CreateComponentInput {
    name: string;
    type: string;
    supplier?: string;
    metadata?: Record<string, unknown>;
}

export async function createComponent(input: CreateComponentInput) {
    const component = await prisma.component.create({
        data: {
            name: input.name,
            type: input.type,
            supplier: input.supplier,
            metadata_uri: "",
        },
    });

    const metadata = buildMetadata(
        input.name,
        input.type,
        input.supplier,
        input.metadata ?? {}
    );

    const metadataUri = await uploadMetadata(component.id, metadata);
    const { txHash, componentAddress } = await createComponentOnChain(component.id, metadataUri);

    return prisma.component.update({
        where: { id: component.id },
        data: {
            metadata_uri: metadataUri,
            on_chain_address: componentAddress,
            tx_hash: txHash,
        },
    });
}
