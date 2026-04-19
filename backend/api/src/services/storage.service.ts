import { ComponentMetadata } from "./metadata.service";

// ---------------------------------------------------------------------------
// Storage providers
// ---------------------------------------------------------------------------

/**
 * Uploads raw string content to IPFS via the Pinata REST API.
 * Uses pinFileToIPFS so the exact bytes are stored — ensuring the
 * SHA-256 hash computed before upload always matches the stored content.
 *
 * Requires env vars: PINATA_API_KEY, PINATA_SECRET_KEY
 */
async function uploadToPinata(
    content: string,
    filename: string,
    apiKey: string,
    secretKey: string
): Promise<string> {
    const blob = new Blob([content], { type: "application/json" });
    const form = new FormData();
    form.append("file", blob, `${filename}.json`);
    form.append("pinataMetadata", JSON.stringify({ name: `${filename}.json` }));
    form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
            pinata_api_key: apiKey,
            pinata_secret_api_key: secretKey,
        },
        body: form,
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Pinata upload failed (${response.status}): ${body}`);
    }

    const result = (await response.json()) as { IpfsHash: string };
    return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Uploads a serialized metadata string to the configured storage provider.
 *
 * @param content    The exact JSON string to store (already serialized + hashed by caller).
 * @param filename   A stable identifier used as the file name (typically the metadata hash).
 * @returns          The public URI where the content is accessible.
 *
 * Provider selection (via env):
 *   PINATA_API_KEY + PINATA_SECRET_KEY  → IPFS via Pinata
 *   (fallback)                          → mock URI for local development
 */
export async function uploadToStorage(content: string, filename: string): Promise<string> {
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY;

    if (apiKey && secretKey) {
        return uploadToPinata(content, filename, apiKey, secretKey);
    }

    // Local development fallback — no upload, returns a deterministic mock URI
    console.warn("[storage] PINATA_API_KEY / PINATA_SECRET_KEY not set — using mock URI");
    return `https://mock-storage.solsutara.dev/metadata/${filename}.json`;
}

/**
 * Existing helper called by component.service.ts.
 * Delegates to uploadToStorage under the hood.
 */
export async function uploadMetadata(
    componentId: string,
    metadata: ComponentMetadata
): Promise<string> {
    const content = JSON.stringify(metadata);
    return uploadToStorage(content, componentId);
}
