import { createHash } from "crypto";

/**
 * Generates a SHA-256 hash of the given string.
 * Returns a lowercase hex string.
 *
 * This is deterministic: same input always produces the same hash.
 */
export function generateMetadataHash(data: string): string {
    return createHash("sha256").update(data, "utf8").digest("hex");
}
