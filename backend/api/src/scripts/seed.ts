/**
 * Seed Script — Demo Supply Chain
 *
 * Creates a 3-organisation supply chain:
 *   Supplier A  →  Manufacturer B  →  Distributor C
 *
 * Run (creates 3 separate orgs):
 *   DATABASE_URL=<url> npm run seed
 *
 * Run (all components under YOUR org — recommended for testing the UI):
 *   DATABASE_URL=<url> ORG_ID=<your-org-uuid> npm run seed
 *
 * Safe to re-run: skips orgs/components that already exist.
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";

// ─── helpers ─────────────────────────────────────────────────────────────────

function mockTxHash(): string {
    return "SEED_" + randomUUID().replace(/-/g, "").toUpperCase();
}

function mockOnChainAddress(): string {
    return "SEED_ADDR_" + randomUUID().replace(/-/g, "").slice(0, 32).toUpperCase();
}

async function upsertOrg(name: string, slug: string) {
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
        console.log(`  [org] already exists: ${name}`);
        return existing;
    }
    const org = await prisma.organization.create({ data: { name, slug } });
    console.log(`  [org] created: ${name} (${org.id})`);
    return org;
}

async function upsertComponent(params: {
    name:      string;
    type:      string;
    supplier:  string;
    orgId:     string;
}) {
    const existing = await prisma.component.findFirst({
        where: { name: params.name, org_id: params.orgId },
    });
    if (existing) {
        console.log(`    [component] already exists: ${params.name}`);
        return existing;
    }

    const onChainId = BigInt(Math.floor(Math.random() * 1_000_000) + 1);

    const component = await prisma.component.create({
        data: {
            name:             params.name,
            type:             params.type,
            supplier:         params.supplier,
            metadata_uri:     `https://mock-storage.solsutara.dev/metadata/${randomUUID()}.json`,
            on_chain_address: mockOnChainAddress(),
            on_chain_id:      onChainId,
            tx_hash:          mockTxHash(),
            org_id:           params.orgId,
        },
    });
    console.log(`    [component] created: ${params.name} (${component.id})`);
    return component;
}

async function upsertLink(parentId: string, childId: string) {
    const existing = await prisma.componentLink.findUnique({
        where: { parent_id_child_id: { parent_id: parentId, child_id: childId } },
    });
    if (existing) {
        console.log(`    [link] already exists: ${parentId} → ${childId}`);
        return existing;
    }

    const link = await prisma.componentLink.create({
        data: { parent_id: parentId, child_id: childId, tx_hash: mockTxHash() },
    });
    console.log(`    [link] created: ${parentId} → ${childId}`);
    return link;
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log("\n=== SOL SUTARA — DEMO SEED ===\n");

    // ── 1. Organisations ─────────────────────────────────────────────────────
    // If ORG_ID is set, put all components in that single org (for UI testing).
    // Otherwise create 3 separate orgs.
    const forcedOrgId = process.env.ORG_ID ?? null;

    let supplierOrg, manufacturerOrg, distributorOrg;

    if (forcedOrgId) {
        const org = await prisma.organization.findUnique({ where: { id: forcedOrgId } });
        if (!org) throw new Error(`ORG_ID "${forcedOrgId}" not found in database.`);
        console.log(`  [org] using existing org: ${org.name} (${org.id})`);
        supplierOrg = manufacturerOrg = distributorOrg = org;
    } else {
        console.log("Creating organisations...");
        supplierOrg      = await upsertOrg("Supplier A",      "supplier-a");
        manufacturerOrg  = await upsertOrg("Manufacturer B",  "manufacturer-b");
        distributorOrg   = await upsertOrg("Distributor C",   "distributor-c");
    }

    // ── 2. Supplier A — raw materials ────────────────────────────────────────
    console.log("\nCreating Supplier A components...");
    const steel     = await upsertComponent({ name: "Steel Sheet",    type: "RAW_MATERIAL",  supplier: "Supplier A", orgId: supplierOrg.id });
    const copper    = await upsertComponent({ name: "Copper Wire",    type: "RAW_MATERIAL",  supplier: "Supplier A", orgId: supplierOrg.id });
    const plastic   = await upsertComponent({ name: "ABS Plastic",    type: "RAW_MATERIAL",  supplier: "Supplier A", orgId: supplierOrg.id });
    const silicon   = await upsertComponent({ name: "Silicon Wafer",  type: "RAW_MATERIAL",  supplier: "Supplier A", orgId: supplierOrg.id });

    // ── 3. Manufacturer B — sub-assemblies ───────────────────────────────────
    console.log("\nCreating Manufacturer B components...");
    const chassis   = await upsertComponent({ name: "Device Chassis",   type: "COMPONENT",    supplier: "Manufacturer B", orgId: manufacturerOrg.id });
    const pcb       = await upsertComponent({ name: "PCB Module",        type: "COMPONENT",    supplier: "Manufacturer B", orgId: manufacturerOrg.id });
    const housing   = await upsertComponent({ name: "Plastic Housing",   type: "COMPONENT",    supplier: "Manufacturer B", orgId: manufacturerOrg.id });
    const assembly  = await upsertComponent({ name: "Core Assembly",     type: "ASSEMBLY",     supplier: "Manufacturer B", orgId: manufacturerOrg.id });

    // ── 4. Distributor C — finished goods ────────────────────────────────────
    console.log("\nCreating Distributor C components...");
    const productA  = await upsertComponent({ name: "SmartSensor v1",   type: "FINISHED_GOOD", supplier: "Distributor C", orgId: distributorOrg.id });
    const productB  = await upsertComponent({ name: "SmartSensor v2",   type: "FINISHED_GOOD", supplier: "Distributor C", orgId: distributorOrg.id });

    // ── 5. Links — supply chain graph ────────────────────────────────────────
    //
    //   steel  ──┐
    //             ├──► chassis ──┐
    //   copper ──┘               │
    //                            ├──► assembly ──► SmartSensor v1
    //   silicon ──► pcb    ──────┘               ↗
    //                                            │
    //   plastic ──► housing ───────────────────────► SmartSensor v2

    console.log("\nCreating component links...");

    // raw → sub-assemblies
    await upsertLink(steel.id,   chassis.id);
    await upsertLink(copper.id,  chassis.id);
    await upsertLink(silicon.id, pcb.id);
    await upsertLink(plastic.id, housing.id);

    // sub-assemblies → core assembly
    await upsertLink(chassis.id, assembly.id);
    await upsertLink(pcb.id,     assembly.id);

    // core assembly + housing → finished goods
    await upsertLink(assembly.id, productA.id);
    await upsertLink(assembly.id, productB.id);
    await upsertLink(housing.id,  productA.id);
    await upsertLink(housing.id,  productB.id);

    // ── 6. Summary ───────────────────────────────────────────────────────────
    console.log("\n=== SEED COMPLETE ===");
    console.log(`  Organisations : 3`);
    console.log(`  Components    : 10`);
    console.log(`  Links         : 10`);
    console.log(`\nSupply chain graph:`);
    console.log(`  Steel Sheet  ──┐`);
    console.log(`                  ├──► Device Chassis ──┐`);
    console.log(`  Copper Wire  ──┘                      │`);
    console.log(`                                         ├──► Core Assembly ──► SmartSensor v1`);
    console.log(`  Silicon Wafer ──► PCB Module ──────────┘                  ──► SmartSensor v2`);
    console.log(`  ABS Plastic ──► Plastic Housing ───────────────────────────────────────────┘`);
    console.log(`\nTo run recall on 'Steel Sheet': GET /components/${steel.id}/affected`);
    console.log(`To trace 'SmartSensor v1':       GET /components/${productA.id}/trace`);
    console.log(`To get analytics:                GET /analytics`);
}

main()
    .catch((err) => {
        console.error("\n[seed] FAILED:", err);
        process.exit(1);
    })
    .finally(() => process.exit(0));
