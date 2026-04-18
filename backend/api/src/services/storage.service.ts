import { ComponentMetadata } from "./metadata.service";

export async function uploadMetadata(
    componentId: string,
    metadata: ComponentMetadata
): Promise<string> {
    // Mock: replace with real Arweave/IPFS upload in production
    console.log(`[storage] Uploading metadata for component ${componentId}`);
    return `https://mock-storage.solsutara.dev/metadata/${componentId}.json`;
}
