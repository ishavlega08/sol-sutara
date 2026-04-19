import { generateMetadataHash } from "../utils/hash";
import { uploadToStorage } from "./storage.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComponentMetadata {
    name: string;
    type: string;
    supplier?: string;
    attributes: Record<string, unknown>;
    createdAt: string;
}

export interface MetadataUploadResult {
    metadataURI: string;
    metadataHash: string;
}

// ---------------------------------------------------------------------------
// Existing helper used by component.service.ts
// ---------------------------------------------------------------------------

export const buildMetadata = (
    name: string,
    type: string,
    supplier: string | undefined,
    attributes: Record<string, unknown>
): ComponentMetadata => {
    return {
        name,
        type,
        supplier,
        attributes,
        createdAt: new Date().toISOString(),
    };
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateMetadata(metadata: Record<string, unknown>): void {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        throw new Error("Metadata must be a non-null, non-array object");
    }
    if (!metadata["name"] || typeof metadata["name"] !== "string" || metadata["name"].trim() === "") {
        throw new Error("Metadata must include a non-empty 'name' string");
    }
    if (!metadata["type"] || typeof metadata["type"] !== "string" || metadata["type"].trim() === "") {
        throw new Error("Metadata must include a non-empty 'type' string");
    }
}

// ---------------------------------------------------------------------------
// Deterministic serialization
// Sorts keys recursively so the same object always produces the same string,
// regardless of insertion order or JavaScript engine.
// ---------------------------------------------------------------------------

function sortKeysRecursively(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortKeysRecursively);
    }
    if (value !== null && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => [k, sortKeysRecursively(v)])
        );
    }
    return value;
}

export function serializeMetadata(metadata: Record<string, unknown>): string {
    return JSON.stringify(sortKeysRecursively(metadata));
}

// ---------------------------------------------------------------------------
// Main entry point for Feature #2
// ---------------------------------------------------------------------------

/**
 * Validates, serializes, hashes, and uploads metadata off-chain.
 *
 * The hash is computed from the exact bytes that are uploaded, so
 * metadataHash always matches the content at metadataURI.
 */
export async function uploadComponentMetadata(
    metadata: Record<string, unknown>
): Promise<MetadataUploadResult> {
    // Step 1: Validate required fields
    validateMetadata(metadata);

    // Step 2: Produce a deterministic JSON string
    const serialized = serializeMetadata(metadata);

    // Step 3: Hash the exact string that will be uploaded
    const metadataHash = generateMetadataHash(serialized);

    // Step 4: Upload the exact same string to storage
    const metadataURI = await uploadToStorage(serialized, metadataHash);

    // Step 5: Return both URI and hash
    return { metadataURI, metadataHash };
}
