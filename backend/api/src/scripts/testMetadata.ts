/**
 * Test script for Feature #2: Metadata Handling (Off-chain + Hash)
 *
 * Run with:
 *   cd backend/api
 *   npx ts-node-dev src/scripts/testMetadata.ts
 *   -- or --
 *   npx ts-node src/scripts/testMetadata.ts
 */
import "dotenv/config";
import { uploadComponentMetadata } from "../services/metadata.service";

const samples = [
    {
        name: "Engine Block",
        type: "Part",
        supplier: "ABC Industries",
        batchId: "BATCH-001",
        manufactureDate: "2026-04-18",
    },
    {
        name: "Brake Caliper",
        type: "Assembly",
        supplier: "XYZ Components",
        batchId: "BATCH-042",
        manufactureDate: "2026-03-10",
        toleranceMm: 0.05,
    },
    {
        name: "Fuel Injector",
        type: "Part",
        batchId: "BATCH-007",
        manufactureDate: "2026-04-01",
        pressureBarMax: 200,
        certified: true,
    },
];

async function run(): Promise<void> {
    console.log("=".repeat(60));
    console.log("Sol Sutara — Metadata Upload Test");
    console.log("=".repeat(60));

    for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        console.log(`\n[${i + 1}/${samples.length}] Uploading: ${sample.name}`);
        console.log("  Input:", JSON.stringify(sample));

        try {
            const result = await uploadComponentMetadata(sample);
            console.log("  metadataURI :", result.metadataURI);
            console.log("  metadataHash:", result.metadataHash);
        } catch (err) {
            console.error("  ERROR:", (err as Error).message);
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Done.");
}

run().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
