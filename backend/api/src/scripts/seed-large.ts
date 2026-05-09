/**
 * Large Seed Script — EV Battery Supply Chain (150+ components)
 *
 * Builds a full multi-tier EV battery supply chain:
 *   Raw Materials → Components → Assemblies → Finished Goods
 *
 * Run:
 *   DATABASE_URL="<url>" ORG_ID="224cd03e-32a8-4402-8021-8d20242569b0" npx ts-node -r tsconfig-paths/register src/scripts/seed-large.ts
 *
 * Safe to re-run: skips components/links that already exist.
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

async function upsertComponent(params: {
    name:     string;
    type:     string;
    supplier: string;
    orgId:    string;
}) {
    const existing = await prisma.component.findFirst({
        where: { name: params.name, org_id: params.orgId },
    });
    if (existing) {
        process.stdout.write(".");
        return existing;
    }
    const component = await prisma.component.create({
        data: {
            name:             params.name,
            type:             params.type,
            supplier:         params.supplier,
            metadata_uri:     `https://mock-storage.solsutara.dev/metadata/${randomUUID()}.json`,
            on_chain_address: mockOnChainAddress(),
            on_chain_id:      BigInt(Math.floor(Math.random() * 9_000_000) + 1_000_000),
            tx_hash:          mockTxHash(),
            org_id:           params.orgId,
        },
    });
    process.stdout.write("+");
    return component;
}

async function upsertLink(parentId: string, childId: string) {
    const existing = await prisma.componentLink.findUnique({
        where: { parent_id_child_id: { parent_id: parentId, child_id: childId } },
    });
    if (existing) return existing;
    const link = await prisma.componentLink.create({
        data: { parent_id: parentId, child_id: childId, tx_hash: mockTxHash() },
    });
    return link;
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log("\n=== SOL SUTARA — LARGE SEED (EV Battery Supply Chain) ===\n");

    const orgId = process.env.ORG_ID;
    if (!orgId) throw new Error("ORG_ID env var is required.");

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new Error(`ORG_ID "${orgId}" not found in database.`);
    console.log(`Using org: ${org.name} (${org.id})\n`);

    const c = (name: string, type: string, supplier: string) =>
        upsertComponent({ name, type, supplier, orgId });

    // ── TIER 0 — RAW MATERIALS (45) ──────────────────────────────────────────

    console.log("Creating Raw Materials...");

    // Mining & Extraction
    const litCarbonate     = await c("Lithium Carbonate (Li₂CO₃)",        "Raw Material", "SQM Chile");
    const litHydroxide     = await c("Lithium Hydroxide (LiOH)",           "Raw Material", "Albemarle Corp");
    const cobaltSulfate    = await c("Cobalt Sulfate (CoSO₄)",             "Raw Material", "Umicore Belgium");
    const cobaltOxide      = await c("Cobalt Oxide (Co₃O₄)",               "Raw Material", "Freeport Cobalt");
    const nickelSulfate    = await c("Nickel Sulfate (NiSO₄)",             "Raw Material", "Norilsk Nickel");
    const nickelOxide      = await c("Nickel Oxide (NiO)",                 "Raw Material", "Vale Indonesia");
    const manganeseSulfate = await c("Manganese Sulfate (MnSO₄)",          "Raw Material", "Tosoh Corp");
    const manganeseOxide   = await c("Manganese Dioxide (MnO₂)",           "Raw Material", "Mesa Labs");
    const ironPhosphate    = await c("Iron Phosphate (FePO₄)",             "Raw Material", "Guizhou Phosphate");
    const phosphoricAcid   = await c("Phosphoric Acid (H₃PO₄)",           "Raw Material", "ICL Group");
    const aluminumOxide    = await c("Aluminum Oxide (Al₂O₃)",            "Raw Material", "Sumitomo Chemical");
    const titaniumDioxide  = await c("Titanium Dioxide (TiO₂)",            "Raw Material", "Kronos Worldwide");

    // Electrode Foils
    const copperFoil6um    = await c("Copper Foil 6µm",                   "Raw Material", "Fukuda Metal Foil");
    const copperFoil8um    = await c("Copper Foil 8µm",                   "Raw Material", "Olin Brass");
    const aluminumFoil12um = await c("Aluminum Foil 12µm",                "Raw Material", "Novelis Inc");
    const aluminumFoil15um = await c("Aluminum Foil 15µm",                "Raw Material", "Constellium SE");

    // Carbon & Graphite
    const naturalGraphite  = await c("Natural Graphite (flake grade)",     "Raw Material", "Imerys Graphite");
    const syntheticGraphite= await c("Synthetic Graphite (high-purity)",   "Raw Material", "SGL Carbon");
    const carbonBlack      = await c("Carbon Black (Super P)",             "Raw Material", "Imerys C&A");
    const carbonNanotubes  = await c("Carbon Nanotubes (MWCNT)",           "Raw Material", "Nanocyl SA");
    const siliconPowder    = await c("Silicon Powder (99.99%)",            "Raw Material", "Elkem Solar");
    const siliconOxide     = await c("Silicon Monoxide (SiO)",             "Raw Material", "Shin-Etsu Chemical");

    // Binders & Solvents
    const pvdfBinder       = await c("PVDF Binder (Kynar 741)",           "Raw Material", "Arkema SA");
    const cmcBinder        = await c("CMC Binder (sodium salt)",          "Raw Material", "Ashland Global");
    const sbrLatex         = await c("SBR Latex Binder",                  "Raw Material", "Zeon Corp");
    const nmpSolvent       = await c("NMP Solvent (N-methylpyrrolidone)", "Raw Material", "BASF SE");
    const waterDeionized   = await c("Deionized Water (18 MΩ·cm)",        "Raw Material", "In-house plant");

    // Electrolyte Raw Materials
    const lipf6Salt        = await c("LiPF₆ Electrolyte Salt",           "Raw Material", "Stella Chemifa");
    const ecSolvent        = await c("Ethylene Carbonate (EC)",           "Raw Material", "BASF SE");
    const dmcSolvent       = await c("Dimethyl Carbonate (DMC)",          "Raw Material", "UBE Industries");
    const emcSolvent       = await c("Ethyl Methyl Carbonate (EMC)",      "Raw Material", "Huntsman Corp");
    const vcAdditive       = await c("Vinylene Carbonate (VC) additive",  "Raw Material", "Capchem Tech");
    const fecAdditive      = await c("FEC Electrolyte Additive",         "Raw Material", "Solvay SA");

    // Separator Raw Materials
    const ppFilm           = await c("Polypropylene (PP) Separator Film", "Raw Material", "Celgard LLC");
    const peFilm           = await c("Polyethylene (PE) Separator Film",  "Raw Material", "Asahi Kasei");
    const ceramicAlumina   = await c("Ceramic Alumina Coating (Al₂O₃)",  "Raw Material", "Evonik Industries");
    const boehmite         = await c("Boehmite (ceramic binder)",         "Raw Material", "Nabaltec AG");

    // Structural & Packaging
    const aluminumCasing   = await c("Aluminum Prismatic Case (147Ah)",   "Raw Material", "Shenzhen Kedali");
    const steelCanBody     = await c("Steel Can Body (21700)",            "Raw Material", "Nippon Steel");
    const pouchFilmAl      = await c("Aluminum-Laminated Pouch Film",     "Raw Material", "Dai Nippon Print");
    const capAssySteel     = await c("Steel Cap Assembly",                "Raw Material", "Shenzhen Kedali");
    const cellTabNickel    = await c("Nickel Cell Tab",                   "Raw Material", "Targray Technology");
    const cellTabAl        = await c("Aluminum Cell Tab",                 "Raw Material", "Targray Technology");
    const insulationTape   = await c("PET Insulation Tape",              "Raw Material", "Nitto Denko");
    console.log("\n  → 45 raw materials done");

    // ── TIER 1 — COMPONENTS (50) ─────────────────────────────────────────────

    console.log("\nCreating Components...");

    // Cathode Materials
    const nmc811Powder     = await c("NMC 811 Cathode Powder",            "Component", "Umicore CAM");
    const nmc622Powder     = await c("NMC 622 Cathode Powder",            "Component", "BASF Battery");
    const nmc532Powder     = await c("NMC 532 Cathode Powder",            "Component", "Sumitomo Metal");
    const lfpPowder        = await c("LFP Cathode Powder (nano-coated)",  "Component", "Aleees Taiwan");
    const nca91Powder      = await c("NCA 91 Cathode Powder",             "Component", "Toda Kogyo");

    // Anode Materials
    const graphiteAnodePowder  = await c("Graphite Anode Powder (coated)",  "Component", "BTR New Energy");
    const siliconCarbonAnode   = await c("Silicon-Carbon Anode Powder",     "Component", "Sila Nanotechnologies");
    const hardCarbonAnode      = await c("Hard Carbon Anode Powder",         "Component", "Kureha Corp");

    // Electrode Sheets
    const nmc811Cathode        = await c("NMC 811 Cathode Electrode (coated)", "Component", "Panasonic ENE");
    const nmc622Cathode        = await c("NMC 622 Cathode Electrode (coated)", "Component", "Samsung SDI");
    const lfpCathode           = await c("LFP Cathode Electrode (coated)",     "Component", "CATL Electrode");
    const ncaCathode           = await c("NCA Cathode Electrode (coated)",     "Component", "Panasonic ENE");
    const graphiteAnode        = await c("Graphite Anode Electrode",           "Component", "BTR New Energy");
    const siCarbonAnodeSheet   = await c("Si-Carbon Anode Electrode",          "Component", "Sila Nanotechnologies");

    // Electrolytes
    const lp30Electrolyte  = await c("LP30 Electrolyte (1M LiPF₆ in EC:DMC)", "Component", "Soulbrain Co");
    const lp40Electrolyte  = await c("LP40 Electrolyte (1M LiPF₆ in EC:EMC)", "Component", "Mitsubishi Chem");
    const gen2Electrolyte  = await c("Gen2 Electrolyte (with VC additive)",    "Component", "Capchem Tech");
    const fecElectrolyte   = await c("FEC-blended Electrolyte",               "Component", "Enchem Co");

    // Separators
    const celgard2325      = await c("Celgard 2325 Separator (PP/PE/PP)",   "Component", "Celgard LLC");
    const ceramicSep       = await c("Ceramic-coated Separator (Al₂O₃)",   "Component", "Evonik Litarion");
    const wetSep16um       = await c("Wet-process Separator 16µm",          "Component", "SK Innovation");
    const drySep20um       = await c("Dry-process Separator 20µm",          "Component", "Asahi Kasei");

    // BMS Components
    const bmsIc            = await c("BMS IC (analog front-end)",           "Component", "Texas Instruments");
    const cellBalancer     = await c("Passive Cell Balancer IC",            "Component", "Analog Devices");
    const microcontroller  = await c("STM32G4 Microcontroller",             "Component", "STMicroelectronics");
    const mosfetHigh       = await c("High-side MOSFET (60V 100A)",         "Component", "Infineon Tech");
    const mosfetLow        = await c("Low-side MOSFET (60V 100A)",          "Component", "ON Semiconductor");
    const currentSensor    = await c("Current Sensor (±500A, ±0.5%)",       "Component", "Allegro MicroSystems");
    const tempSensor       = await c("NTC Temperature Sensor (±0.5°C)",     "Component", "Murata Mfg");
    const voltSensor       = await c("Differential Voltage Sensor",         "Component", "Maxim Integrated");
    const canTransceiver   = await c("CAN FD Transceiver (ISO 11898)",      "Component", "NXP Semiconductors");
    const bmspcb           = await c("BMS PCB (4-layer, ENIG)",             "Component", "TTM Technologies");

    // Thermal Components
    const coolingPlate     = await c("Aluminum Cooling Plate (microchannel)","Component", "Dana Incorporated");
    const thermalPad       = await c("Thermal Interface Pad (5W/mK)",        "Component", "Bergquist Co");
    const heatPipe         = await c("Copper Heat Pipe (flat, 200mm)",       "Component", "Furukawa Electric");
    const coolantTube      = await c("Silicone Coolant Tube (ID 8mm)",       "Component", "Parker Hannifin");

    // Structural Components
    const cellHolder       = await c("Injection-molded Cell Holder (plastic)","Component", "Eastman Chemical");
    const moduleFrame      = await c("Module Frame (die-cast aluminum)",      "Component", "Nemak SA");
    const busbar25mm       = await c("Copper Busbar 25mm² (tin-plated)",      "Component", "Wieland Group");
    const busbar50mm       = await c("Copper Busbar 50mm² (tin-plated)",      "Component", "Wieland Group");
    const moduleConnector  = await c("High-voltage Connector (IP67)",         "Component", "TE Connectivity");
    const lvConnector      = await c("Low-voltage Signal Connector",          "Component", "Molex LLC");
    const cellFuse         = await c("Cell-level Fuse (30A, surface-mount)",  "Component", "Littelfuse Inc");
    const contactorMain    = await c("Main Pack Contactor (400A DC)",         "Component", "Tyco Electronics");
    const prechargeR       = await c("Pre-charge Resistor (100Ω 50W)",        "Component", "Ohmite Mfg");
    const manualServiceDisc= await c("Manual Service Disconnect (MSD)",       "Component", "Littelfuse Inc");
    const inertiaSwitch    = await c("Inertia (crash) Switch",               "Component", "BorgWarner Inc");

    console.log("\n  → 50 components done");

    // ── TIER 2 — ASSEMBLIES (36) ─────────────────────────────────────────────

    console.log("\nCreating Assemblies...");

    // Cells
    const nmcPouchCell     = await c("NMC 811 Pouch Cell (50Ah)",            "Assembly", "CATL");
    const nmcPrismaticCell = await c("NMC 622 Prismatic Cell (147Ah)",       "Assembly", "Samsung SDI");
    const lfpPrismaticCell = await c("LFP Prismatic Cell (280Ah)",           "Assembly", "Eve Energy");
    const ncaCylindrical   = await c("NCA Cylindrical Cell 21700 (5Ah)",     "Assembly", "Panasonic");
    const nmc532Cylindrical= await c("NMC 532 Cylindrical Cell 18650 (3Ah)", "Assembly", "LG Energy Solution");
    const siCPouchCell     = await c("Si-C Anode Pouch Cell (60Ah)",         "Assembly", "Sila Nanotechnologies");

    // BMS Assemblies
    const cellBmsAssy      = await c("Cell-level BMS Assembly (16S)",        "Assembly", "Delphi Technologies");
    const moduleBmsAssy    = await c("Module-level BMS Assembly",            "Assembly", "Continental AG");
    const packBmsAssy      = await c("Pack-level BMS Assembly (master)",     "Assembly", "Robert Bosch GmbH");

    // Thermal Management
    const liquidCooling    = await c("Liquid Cooling Plate Assembly",        "Assembly", "Modine Mfg");
    const thermalMgmtUnit  = await c("Thermal Management Unit (TMU)",        "Assembly", "Valeo SA");
    const phaseChangeMat   = await c("Phase-Change Material Module",         "Assembly", "PCM Products Ltd");

    // Battery Modules
    const module48v12s     = await c("48V Battery Module (12S4P, NMC811)",  "Assembly", "Internal Mfg");
    const module96v24s     = await c("96V Battery Module (24S2P, NMC622)",  "Assembly", "Internal Mfg");
    const module400v       = await c("400V Battery Module (100S1P, NMC811)","Assembly", "Internal Mfg");
    const moduleHighCap    = await c("High-Capacity Module (12S8P, LFP)",   "Assembly", "Internal Mfg");
    const moduleCylinder   = await c("Cylindrical Cell Module (21S5P)",     "Assembly", "Internal Mfg");
    const moduleSiC        = await c("Si-C High-Energy Module (10S3P)",     "Assembly", "Internal Mfg");

    // Busbar & Harness Assemblies
    const busbarHarness    = await c("Busbar Harness Assembly (welded)",     "Assembly", "Prettl Group");
    const hvCableAssy      = await c("HV Cable Assembly (orange, 50mm²)",   "Assembly", "Coroplast GmbH");
    const lvHarnessAssy    = await c("LV Signal Harness Assembly",          "Assembly", "Lear Corporation");
    const cellInterconnect = await c("Cell Interconnect Board (CIB)",        "Assembly", "Avery Dennison");

    // Enclosures
    const moduleEnclosure  = await c("Module Enclosure (IP65, aluminum)",    "Assembly", "Constellium SE");
    const packEnclosure    = await c("Battery Pack Enclosure (IP67)",        "Assembly", "Novelis Inc");
    const bottomPlate      = await c("Pack Bottom Plate (crash-optimized)",  "Assembly", "Gestamp SA");
    const topCover         = await c("Pack Top Cover (composite)",           "Assembly", "Solvay Composites");
    const coolantManifold  = await c("Coolant Manifold Assembly",            "Assembly", "Norma Group");

    // Safety & HV Systems
    const hvJunctionBox    = await c("HV Junction Box (with fuses)",         "Assembly", "Aptiv PLC");
    const mainContactorAssy= await c("Main Contactor Assembly (dual)",       "Assembly", "Sensata Tech");
    const pyroFuse         = await c("Pyrotechnic Fuse Assembly",            "Assembly", "Delphi Technologies");
    const batteryIsolator  = await c("Battery Isolation Monitor (BIM)",      "Assembly", "Bender GmbH");
    const groundFaultDetect= await c("Ground Fault Detection Module",        "Assembly", "Isometer GmbH");

    // Cooling Fluid & Final Sub-assemblies
    const cellStackAssy    = await c("Cell Stack Assembly (pressed, aligned)", "Assembly", "Internal Mfg");
    const moduleStackAssy  = await c("Module Stack Assembly (4 modules)",    "Assembly", "Internal Mfg");
    const batteryMgmtSys   = await c("Battery Management System (integrated)","Assembly", "Robert Bosch GmbH");

    console.log("\n  → 36 assemblies done");

    // ── TIER 3 — FINISHED GOODS (22) ─────────────────────────────────────────

    console.log("\nCreating Finished Goods...");

    const pack40kwh        = await c("EV Battery Pack 40kWh (NMC811)",      "Finished Good", "Sol Sutara OEM");
    const pack60kwh        = await c("EV Battery Pack 60kWh (NMC622)",      "Finished Good", "Sol Sutara OEM");
    const pack80kwh        = await c("EV Battery Pack 80kWh (NMC811)",      "Finished Good", "Sol Sutara OEM");
    const pack100kwh       = await c("EV Battery Pack 100kWh (NMC811)",     "Finished Good", "Sol Sutara OEM");
    const pack120kwh       = await c("EV Battery Pack 120kWh (Si-C)",       "Finished Good", "Sol Sutara OEM");
    const packLfp60kwh     = await c("EV Battery Pack 60kWh (LFP)",         "Finished Good", "Sol Sutara OEM");
    const packLfp100kwh    = await c("EV Battery Pack 100kWh (LFP)",        "Finished Good", "Sol Sutara OEM");
    const packCylinder50kwh= await c("EV Battery Pack 50kWh (Cylindrical)", "Finished Good", "Sol Sutara OEM");
    const ess10kwh         = await c("Residential ESS 10kWh (LFP)",        "Finished Good", "Sol Sutara Energy");
    const ess30kwh         = await c("Commercial ESS 30kWh (LFP)",         "Finished Good", "Sol Sutara Energy");
    const ess100kwh        = await c("Industrial ESS 100kWh (LFP)",        "Finished Good", "Sol Sutara Energy");
    const marinePackSmall  = await c("Marine Battery Pack 20kWh",          "Finished Good", "Sol Sutara Marine");
    const marinePackLarge  = await c("Marine Battery Pack 80kWh",          "Finished Good", "Sol Sutara Marine");
    const commercialPack   = await c("Commercial Vehicle Pack 150kWh",     "Finished Good", "Sol Sutara CV");
    const busPack          = await c("Electric Bus Pack 400kWh",           "Finished Good", "Sol Sutara CV");
    const motorsportPack   = await c("Motorsport Battery Pack 30kWh",      "Finished Good", "Sol Sutara Sport");
    const aeroPack         = await c("Aerospace UAV Pack 5kWh",            "Finished Good", "Sol Sutara Aero");
    const motorcyclePack   = await c("Electric Motorcycle Pack 8kWh",      "Finished Good", "Sol Sutara OEM");
    const microevPack      = await c("Micro-EV Pack 15kWh (LFP)",         "Finished Good", "Sol Sutara OEM");
    const truckPack        = await c("Heavy Truck Pack 600kWh",            "Finished Good", "Sol Sutara CV");
    const hypercarPack     = await c("Hypercar Dual-Stack Pack 100kWh",    "Finished Good", "Sol Sutara Sport");
    const swappablePack    = await c("Swappable Battery Module 20kWh",     "Finished Good", "Sol Sutara OEM");

    console.log("\n  → 22 finished goods done");

    // ── LINKS ─────────────────────────────────────────────────────────────────

    console.log("\nCreating supply chain links...");

    // ── Raw Materials → Cathode/Anode Powders ──────────────────────────────
    await upsertLink(litHydroxide.id,     nmc811Powder.id);
    await upsertLink(nickelSulfate.id,    nmc811Powder.id);
    await upsertLink(cobaltSulfate.id,    nmc811Powder.id);
    await upsertLink(manganeseSulfate.id, nmc811Powder.id);

    await upsertLink(litHydroxide.id,     nmc622Powder.id);
    await upsertLink(nickelSulfate.id,    nmc622Powder.id);
    await upsertLink(cobaltSulfate.id,    nmc622Powder.id);
    await upsertLink(manganeseSulfate.id, nmc622Powder.id);

    await upsertLink(litHydroxide.id,     nmc532Powder.id);
    await upsertLink(nickelSulfate.id,    nmc532Powder.id);
    await upsertLink(cobaltSulfate.id,    nmc532Powder.id);
    await upsertLink(manganeseSulfate.id, nmc532Powder.id);

    await upsertLink(litCarbonate.id,     lfpPowder.id);
    await upsertLink(ironPhosphate.id,    lfpPowder.id);
    await upsertLink(phosphoricAcid.id,   lfpPowder.id);

    await upsertLink(litHydroxide.id,     nca91Powder.id);
    await upsertLink(nickelSulfate.id,    nca91Powder.id);
    await upsertLink(cobaltOxide.id,      nca91Powder.id);
    await upsertLink(aluminumOxide.id,    nca91Powder.id);

    await upsertLink(naturalGraphite.id,  graphiteAnodePowder.id);
    await upsertLink(syntheticGraphite.id,graphiteAnodePowder.id);
    await upsertLink(carbonBlack.id,      graphiteAnodePowder.id);

    await upsertLink(siliconPowder.id,    siliconCarbonAnode.id);
    await upsertLink(siliconOxide.id,     siliconCarbonAnode.id);
    await upsertLink(syntheticGraphite.id,siliconCarbonAnode.id);
    await upsertLink(carbonNanotubes.id,  siliconCarbonAnode.id);

    await upsertLink(naturalGraphite.id,  hardCarbonAnode.id);
    await upsertLink(carbonBlack.id,      hardCarbonAnode.id);

    // ── Raw Materials → Electrode Sheets ───────────────────────────────────
    await upsertLink(nmc811Powder.id,     nmc811Cathode.id);
    await upsertLink(aluminumFoil12um.id, nmc811Cathode.id);
    await upsertLink(pvdfBinder.id,       nmc811Cathode.id);
    await upsertLink(carbonBlack.id,      nmc811Cathode.id);
    await upsertLink(nmpSolvent.id,       nmc811Cathode.id);

    await upsertLink(nmc622Powder.id,     nmc622Cathode.id);
    await upsertLink(aluminumFoil15um.id, nmc622Cathode.id);
    await upsertLink(pvdfBinder.id,       nmc622Cathode.id);
    await upsertLink(nmpSolvent.id,       nmc622Cathode.id);

    await upsertLink(lfpPowder.id,        lfpCathode.id);
    await upsertLink(aluminumFoil12um.id, lfpCathode.id);
    await upsertLink(pvdfBinder.id,       lfpCathode.id);
    await upsertLink(carbonBlack.id,      lfpCathode.id);

    await upsertLink(nca91Powder.id,      ncaCathode.id);
    await upsertLink(aluminumFoil12um.id, ncaCathode.id);
    await upsertLink(pvdfBinder.id,       ncaCathode.id);

    await upsertLink(graphiteAnodePowder.id, graphiteAnode.id);
    await upsertLink(copperFoil6um.id,    graphiteAnode.id);
    await upsertLink(cmcBinder.id,        graphiteAnode.id);
    await upsertLink(sbrLatex.id,         graphiteAnode.id);
    await upsertLink(waterDeionized.id,   graphiteAnode.id);

    await upsertLink(siliconCarbonAnode.id, siCarbonAnodeSheet.id);
    await upsertLink(copperFoil8um.id,    siCarbonAnodeSheet.id);
    await upsertLink(pvdfBinder.id,       siCarbonAnodeSheet.id);

    // ── Raw Materials → Electrolytes ────────────────────────────────────────
    await upsertLink(lipf6Salt.id,        lp30Electrolyte.id);
    await upsertLink(ecSolvent.id,        lp30Electrolyte.id);
    await upsertLink(dmcSolvent.id,       lp30Electrolyte.id);

    await upsertLink(lipf6Salt.id,        lp40Electrolyte.id);
    await upsertLink(ecSolvent.id,        lp40Electrolyte.id);
    await upsertLink(emcSolvent.id,       lp40Electrolyte.id);

    await upsertLink(lipf6Salt.id,        gen2Electrolyte.id);
    await upsertLink(ecSolvent.id,        gen2Electrolyte.id);
    await upsertLink(dmcSolvent.id,       gen2Electrolyte.id);
    await upsertLink(vcAdditive.id,       gen2Electrolyte.id);

    await upsertLink(lipf6Salt.id,        fecElectrolyte.id);
    await upsertLink(ecSolvent.id,        fecElectrolyte.id);
    await upsertLink(emcSolvent.id,       fecElectrolyte.id);
    await upsertLink(fecAdditive.id,      fecElectrolyte.id);

    // ── Raw Materials → Separators ──────────────────────────────────────────
    await upsertLink(ppFilm.id,           celgard2325.id);
    await upsertLink(peFilm.id,           celgard2325.id);

    await upsertLink(peFilm.id,           ceramicSep.id);
    await upsertLink(ceramicAlumina.id,   ceramicSep.id);
    await upsertLink(boehmite.id,         ceramicSep.id);

    await upsertLink(peFilm.id,           wetSep16um.id);
    await upsertLink(ppFilm.id,           drySep20um.id);

    // ── BMS Component Assembly ──────────────────────────────────────────────
    await upsertLink(bmsIc.id,            bmspcb.id);
    await upsertLink(cellBalancer.id,     bmspcb.id);
    await upsertLink(microcontroller.id,  bmspcb.id);
    await upsertLink(mosfetHigh.id,       bmspcb.id);
    await upsertLink(mosfetLow.id,        bmspcb.id);
    await upsertLink(currentSensor.id,    bmspcb.id);
    await upsertLink(tempSensor.id,       bmspcb.id);
    await upsertLink(voltSensor.id,       bmspcb.id);
    await upsertLink(canTransceiver.id,   bmspcb.id);

    // ── Thermal Components ──────────────────────────────────────────────────
    await upsertLink(coolingPlate.id,     liquidCooling.id);
    await upsertLink(thermalPad.id,       liquidCooling.id);
    await upsertLink(coolantTube.id,      liquidCooling.id);
    await upsertLink(heatPipe.id,         liquidCooling.id);

    await upsertLink(liquidCooling.id,    thermalMgmtUnit.id);
    await upsertLink(coolantManifold.id,  thermalMgmtUnit.id);

    // ── Cell Assemblies ─────────────────────────────────────────────────────
    // NMC 811 Pouch Cell
    await upsertLink(nmc811Cathode.id,    nmcPouchCell.id);
    await upsertLink(graphiteAnode.id,    nmcPouchCell.id);
    await upsertLink(gen2Electrolyte.id,  nmcPouchCell.id);
    await upsertLink(ceramicSep.id,       nmcPouchCell.id);
    await upsertLink(pouchFilmAl.id,      nmcPouchCell.id);
    await upsertLink(cellTabAl.id,        nmcPouchCell.id);
    await upsertLink(cellTabNickel.id,    nmcPouchCell.id);

    // NMC 622 Prismatic Cell
    await upsertLink(nmc622Cathode.id,    nmcPrismaticCell.id);
    await upsertLink(graphiteAnode.id,    nmcPrismaticCell.id);
    await upsertLink(lp40Electrolyte.id,  nmcPrismaticCell.id);
    await upsertLink(celgard2325.id,      nmcPrismaticCell.id);
    await upsertLink(aluminumCasing.id,   nmcPrismaticCell.id);
    await upsertLink(insulationTape.id,   nmcPrismaticCell.id);

    // LFP Prismatic Cell
    await upsertLink(lfpCathode.id,       lfpPrismaticCell.id);
    await upsertLink(graphiteAnode.id,    lfpPrismaticCell.id);
    await upsertLink(lp30Electrolyte.id,  lfpPrismaticCell.id);
    await upsertLink(wetSep16um.id,       lfpPrismaticCell.id);
    await upsertLink(aluminumCasing.id,   lfpPrismaticCell.id);

    // NCA Cylindrical Cell (21700)
    await upsertLink(ncaCathode.id,       ncaCylindrical.id);
    await upsertLink(graphiteAnode.id,    ncaCylindrical.id);
    await upsertLink(gen2Electrolyte.id,  ncaCylindrical.id);
    await upsertLink(celgard2325.id,      ncaCylindrical.id);
    await upsertLink(steelCanBody.id,     ncaCylindrical.id);
    await upsertLink(capAssySteel.id,     ncaCylindrical.id);

    // NMC 532 Cylindrical Cell (18650)
    await upsertLink(nmc532Powder.id,     nmc532Cylindrical.id);
    await upsertLink(graphiteAnode.id,    nmc532Cylindrical.id);
    await upsertLink(lp30Electrolyte.id,  nmc532Cylindrical.id);
    await upsertLink(drySep20um.id,       nmc532Cylindrical.id);
    await upsertLink(steelCanBody.id,     nmc532Cylindrical.id);
    await upsertLink(capAssySteel.id,     nmc532Cylindrical.id);
    await upsertLink(cellFuse.id,         nmc532Cylindrical.id);

    // Si-C Pouch Cell
    await upsertLink(nmc811Cathode.id,    siCPouchCell.id);
    await upsertLink(siCarbonAnodeSheet.id, siCPouchCell.id);
    await upsertLink(fecElectrolyte.id,   siCPouchCell.id);
    await upsertLink(ceramicSep.id,       siCPouchCell.id);
    await upsertLink(pouchFilmAl.id,      siCPouchCell.id);

    // ── BMS Assemblies ──────────────────────────────────────────────────────
    await upsertLink(bmspcb.id,           cellBmsAssy.id);
    await upsertLink(tempSensor.id,       cellBmsAssy.id);
    await upsertLink(lvConnector.id,      cellBmsAssy.id);

    await upsertLink(cellBmsAssy.id,      moduleBmsAssy.id);
    await upsertLink(canTransceiver.id,   moduleBmsAssy.id);
    await upsertLink(lvHarnessAssy.id,    moduleBmsAssy.id);

    await upsertLink(moduleBmsAssy.id,    packBmsAssy.id);
    await upsertLink(bmspcb.id,           packBmsAssy.id);

    await upsertLink(packBmsAssy.id,      batteryMgmtSys.id);
    await upsertLink(contactorMain.id,    batteryMgmtSys.id);
    await upsertLink(prechargeR.id,       batteryMgmtSys.id);
    await upsertLink(manualServiceDisc.id,batteryMgmtSys.id);
    await upsertLink(inertiaSwitch.id,    batteryMgmtSys.id);

    // ── Cell → Cell Stack ───────────────────────────────────────────────────
    await upsertLink(nmcPouchCell.id,     cellStackAssy.id);
    await upsertLink(cellHolder.id,       cellStackAssy.id);
    await upsertLink(insulationTape.id,   cellStackAssy.id);
    await upsertLink(thermalPad.id,       cellStackAssy.id);

    // ── Battery Module Assemblies ───────────────────────────────────────────
    // 48V NMC811 Module
    await upsertLink(nmcPouchCell.id,     module48v12s.id);
    await upsertLink(cellStackAssy.id,    module48v12s.id);
    await upsertLink(cellBmsAssy.id,      module48v12s.id);
    await upsertLink(busbar25mm.id,       module48v12s.id);
    await upsertLink(cellInterconnect.id, module48v12s.id);
    await upsertLink(moduleFrame.id,      module48v12s.id);
    await upsertLink(liquidCooling.id,    module48v12s.id);
    await upsertLink(moduleEnclosure.id,  module48v12s.id);

    // 96V NMC622 Module
    await upsertLink(nmcPrismaticCell.id, module96v24s.id);
    await upsertLink(cellBmsAssy.id,      module96v24s.id);
    await upsertLink(busbar50mm.id,       module96v24s.id);
    await upsertLink(busbarHarness.id,    module96v24s.id);
    await upsertLink(moduleFrame.id,      module96v24s.id);
    await upsertLink(liquidCooling.id,    module96v24s.id);
    await upsertLink(moduleEnclosure.id,  module96v24s.id);

    // 400V NMC811 Module
    await upsertLink(nmcPouchCell.id,     module400v.id);
    await upsertLink(cellStackAssy.id,    module400v.id);
    await upsertLink(cellBmsAssy.id,      module400v.id);
    await upsertLink(busbar50mm.id,       module400v.id);
    await upsertLink(busbarHarness.id,    module400v.id);
    await upsertLink(thermalMgmtUnit.id,  module400v.id);
    await upsertLink(moduleEnclosure.id,  module400v.id);

    // High-Capacity LFP Module
    await upsertLink(lfpPrismaticCell.id, moduleHighCap.id);
    await upsertLink(cellBmsAssy.id,      moduleHighCap.id);
    await upsertLink(busbar50mm.id,       moduleHighCap.id);
    await upsertLink(moduleFrame.id,      moduleHighCap.id);
    await upsertLink(liquidCooling.id,    moduleHighCap.id);
    await upsertLink(moduleEnclosure.id,  moduleHighCap.id);

    // Cylindrical Module
    await upsertLink(ncaCylindrical.id,   moduleCylinder.id);
    await upsertLink(nmc532Cylindrical.id,moduleCylinder.id);
    await upsertLink(cellHolder.id,       moduleCylinder.id);
    await upsertLink(cellBmsAssy.id,      moduleCylinder.id);
    await upsertLink(busbar25mm.id,       moduleCylinder.id);
    await upsertLink(liquidCooling.id,    moduleCylinder.id);

    // Si-C High-Energy Module
    await upsertLink(siCPouchCell.id,     moduleSiC.id);
    await upsertLink(cellBmsAssy.id,      moduleSiC.id);
    await upsertLink(busbar25mm.id,       moduleSiC.id);
    await upsertLink(thermalMgmtUnit.id,  moduleSiC.id);
    await upsertLink(moduleEnclosure.id,  moduleSiC.id);

    // ── Module Stack ────────────────────────────────────────────────────────
    await upsertLink(module400v.id,       moduleStackAssy.id);
    await upsertLink(module96v24s.id,     moduleStackAssy.id);
    await upsertLink(packEnclosure.id,    moduleStackAssy.id);
    await upsertLink(bottomPlate.id,      moduleStackAssy.id);
    await upsertLink(topCover.id,         moduleStackAssy.id);

    // ── HV System ───────────────────────────────────────────────────────────
    await upsertLink(contactorMain.id,    mainContactorAssy.id);
    await upsertLink(prechargeR.id,       mainContactorAssy.id);
    await upsertLink(hvCableAssy.id,      mainContactorAssy.id);

    await upsertLink(cellFuse.id,         hvJunctionBox.id);
    await upsertLink(mainContactorAssy.id,hvJunctionBox.id);
    await upsertLink(manualServiceDisc.id, hvJunctionBox.id);
    await upsertLink(moduleConnector.id,  hvJunctionBox.id);

    await upsertLink(hvJunctionBox.id,    pyroFuse.id);
    await upsertLink(batteryIsolator.id,  groundFaultDetect.id);

    // ── Finished Goods ──────────────────────────────────────────────────────

    // 40kWh NMC811 Pack
    await upsertLink(module48v12s.id,     pack40kwh.id);
    await upsertLink(batteryMgmtSys.id,   pack40kwh.id);
    await upsertLink(thermalMgmtUnit.id,  pack40kwh.id);
    await upsertLink(hvJunctionBox.id,    pack40kwh.id);
    await upsertLink(packEnclosure.id,    pack40kwh.id);
    await upsertLink(groundFaultDetect.id,pack40kwh.id);
    await upsertLink(lvHarnessAssy.id,    pack40kwh.id);

    // 60kWh NMC622 Pack
    await upsertLink(module96v24s.id,     pack60kwh.id);
    await upsertLink(batteryMgmtSys.id,   pack60kwh.id);
    await upsertLink(thermalMgmtUnit.id,  pack60kwh.id);
    await upsertLink(hvJunctionBox.id,    pack60kwh.id);
    await upsertLink(packEnclosure.id,    pack60kwh.id);
    await upsertLink(lvHarnessAssy.id,    pack60kwh.id);

    // 80kWh NMC811 Pack
    await upsertLink(module400v.id,       pack80kwh.id);
    await upsertLink(module48v12s.id,     pack80kwh.id);
    await upsertLink(batteryMgmtSys.id,   pack80kwh.id);
    await upsertLink(thermalMgmtUnit.id,  pack80kwh.id);
    await upsertLink(hvJunctionBox.id,    pack80kwh.id);
    await upsertLink(packEnclosure.id,    pack80kwh.id);
    await upsertLink(pyroFuse.id,         pack80kwh.id);
    await upsertLink(groundFaultDetect.id,pack80kwh.id);

    // 100kWh NMC811 Pack
    await upsertLink(module400v.id,       pack100kwh.id);
    await upsertLink(moduleStackAssy.id,  pack100kwh.id);
    await upsertLink(batteryMgmtSys.id,   pack100kwh.id);
    await upsertLink(thermalMgmtUnit.id,  pack100kwh.id);
    await upsertLink(hvJunctionBox.id,    pack100kwh.id);
    await upsertLink(packEnclosure.id,    pack100kwh.id);
    await upsertLink(pyroFuse.id,         pack100kwh.id);
    await upsertLink(groundFaultDetect.id,pack100kwh.id);
    await upsertLink(lvHarnessAssy.id,    pack100kwh.id);

    // 120kWh Si-C Pack
    await upsertLink(moduleSiC.id,        pack120kwh.id);
    await upsertLink(module400v.id,       pack120kwh.id);
    await upsertLink(batteryMgmtSys.id,   pack120kwh.id);
    await upsertLink(thermalMgmtUnit.id,  pack120kwh.id);
    await upsertLink(hvJunctionBox.id,    pack120kwh.id);
    await upsertLink(packEnclosure.id,    pack120kwh.id);
    await upsertLink(pyroFuse.id,         pack120kwh.id);

    // LFP Packs
    await upsertLink(moduleHighCap.id,    packLfp60kwh.id);
    await upsertLink(batteryMgmtSys.id,   packLfp60kwh.id);
    await upsertLink(thermalMgmtUnit.id,  packLfp60kwh.id);
    await upsertLink(hvJunctionBox.id,    packLfp60kwh.id);
    await upsertLink(packEnclosure.id,    packLfp60kwh.id);

    await upsertLink(moduleHighCap.id,    packLfp100kwh.id);
    await upsertLink(moduleStackAssy.id,  packLfp100kwh.id);
    await upsertLink(batteryMgmtSys.id,   packLfp100kwh.id);
    await upsertLink(thermalMgmtUnit.id,  packLfp100kwh.id);
    await upsertLink(hvJunctionBox.id,    packLfp100kwh.id);
    await upsertLink(packEnclosure.id,    packLfp100kwh.id);

    // Cylindrical Pack
    await upsertLink(moduleCylinder.id,   packCylinder50kwh.id);
    await upsertLink(batteryMgmtSys.id,   packCylinder50kwh.id);
    await upsertLink(thermalMgmtUnit.id,  packCylinder50kwh.id);
    await upsertLink(hvJunctionBox.id,    packCylinder50kwh.id);
    await upsertLink(packEnclosure.id,    packCylinder50kwh.id);

    // ESS Products
    await upsertLink(moduleHighCap.id,    ess10kwh.id);
    await upsertLink(batteryMgmtSys.id,   ess10kwh.id);
    await upsertLink(packEnclosure.id,    ess10kwh.id);
    await upsertLink(hvJunctionBox.id,    ess10kwh.id);

    await upsertLink(moduleHighCap.id,    ess30kwh.id);
    await upsertLink(moduleStackAssy.id,  ess30kwh.id);
    await upsertLink(batteryMgmtSys.id,   ess30kwh.id);
    await upsertLink(packEnclosure.id,    ess30kwh.id);
    await upsertLink(hvJunctionBox.id,    ess30kwh.id);

    await upsertLink(moduleHighCap.id,    ess100kwh.id);
    await upsertLink(moduleStackAssy.id,  ess100kwh.id);
    await upsertLink(batteryMgmtSys.id,   ess100kwh.id);
    await upsertLink(thermalMgmtUnit.id,  ess100kwh.id);
    await upsertLink(packEnclosure.id,    ess100kwh.id);
    await upsertLink(hvJunctionBox.id,    ess100kwh.id);
    await upsertLink(groundFaultDetect.id,ess100kwh.id);

    // Marine Packs
    await upsertLink(moduleHighCap.id,    marinePackSmall.id);
    await upsertLink(batteryMgmtSys.id,   marinePackSmall.id);
    await upsertLink(packEnclosure.id,    marinePackSmall.id);
    await upsertLink(hvJunctionBox.id,    marinePackSmall.id);

    await upsertLink(moduleHighCap.id,    marinePackLarge.id);
    await upsertLink(moduleStackAssy.id,  marinePackLarge.id);
    await upsertLink(batteryMgmtSys.id,   marinePackLarge.id);
    await upsertLink(thermalMgmtUnit.id,  marinePackLarge.id);
    await upsertLink(packEnclosure.id,    marinePackLarge.id);

    // Commercial Vehicle
    await upsertLink(module400v.id,       commercialPack.id);
    await upsertLink(moduleStackAssy.id,  commercialPack.id);
    await upsertLink(batteryMgmtSys.id,   commercialPack.id);
    await upsertLink(thermalMgmtUnit.id,  commercialPack.id);
    await upsertLink(hvJunctionBox.id,    commercialPack.id);
    await upsertLink(pyroFuse.id,         commercialPack.id);
    await upsertLink(packEnclosure.id,    commercialPack.id);
    await upsertLink(bottomPlate.id,      commercialPack.id);

    await upsertLink(module400v.id,       busPack.id);
    await upsertLink(moduleStackAssy.id,  busPack.id);
    await upsertLink(batteryMgmtSys.id,   busPack.id);
    await upsertLink(thermalMgmtUnit.id,  busPack.id);
    await upsertLink(hvJunctionBox.id,    busPack.id);
    await upsertLink(pyroFuse.id,         busPack.id);
    await upsertLink(packEnclosure.id,    busPack.id);
    await upsertLink(groundFaultDetect.id,busPack.id);
    await upsertLink(bottomPlate.id,      busPack.id);

    // Specialty
    await upsertLink(module48v12s.id,     motorsportPack.id);
    await upsertLink(moduleSiC.id,        motorsportPack.id);
    await upsertLink(batteryMgmtSys.id,   motorsportPack.id);
    await upsertLink(phaseChangeMat.id,   motorsportPack.id);
    await upsertLink(packEnclosure.id,    motorsportPack.id);

    await upsertLink(siCPouchCell.id,     aeroPack.id);
    await upsertLink(cellBmsAssy.id,      aeroPack.id);
    await upsertLink(packEnclosure.id,    aeroPack.id);

    await upsertLink(module48v12s.id,     motorcyclePack.id);
    await upsertLink(batteryMgmtSys.id,   motorcyclePack.id);
    await upsertLink(packEnclosure.id,    motorcyclePack.id);
    await upsertLink(hvJunctionBox.id,    motorcyclePack.id);

    await upsertLink(moduleHighCap.id,    microevPack.id);
    await upsertLink(batteryMgmtSys.id,   microevPack.id);
    await upsertLink(packEnclosure.id,    microevPack.id);

    await upsertLink(module400v.id,       truckPack.id);
    await upsertLink(moduleStackAssy.id,  truckPack.id);
    await upsertLink(moduleHighCap.id,    truckPack.id);
    await upsertLink(batteryMgmtSys.id,   truckPack.id);
    await upsertLink(thermalMgmtUnit.id,  truckPack.id);
    await upsertLink(hvJunctionBox.id,    truckPack.id);
    await upsertLink(pyroFuse.id,         truckPack.id);
    await upsertLink(packEnclosure.id,    truckPack.id);
    await upsertLink(groundFaultDetect.id,truckPack.id);
    await upsertLink(bottomPlate.id,      truckPack.id);

    await upsertLink(moduleSiC.id,        hypercarPack.id);
    await upsertLink(module400v.id,       hypercarPack.id);
    await upsertLink(batteryMgmtSys.id,   hypercarPack.id);
    await upsertLink(phaseChangeMat.id,   hypercarPack.id);
    await upsertLink(thermalMgmtUnit.id,  hypercarPack.id);
    await upsertLink(hvJunctionBox.id,    hypercarPack.id);
    await upsertLink(pyroFuse.id,         hypercarPack.id);
    await upsertLink(packEnclosure.id,    hypercarPack.id);

    await upsertLink(moduleHighCap.id,    swappablePack.id);
    await upsertLink(cellBmsAssy.id,      swappablePack.id);
    await upsertLink(packEnclosure.id,    swappablePack.id);
    await upsertLink(moduleConnector.id,  swappablePack.id);

    // ── Final count ──────────────────────────────────────────────────────────
    const totalComponents = await prisma.component.count({ where: { org_id: orgId } });
    const totalLinks = await prisma.componentLink.count({
        where: { parent: { org_id: orgId } },
    });

    console.log("\n\n=== SEED COMPLETE ===");
    console.log(`  Org               : ${org.name}`);
    console.log(`  Total components  : ${totalComponents}`);
    console.log(`  Total links       : ${totalLinks}`);
    console.log(`\nTiers:`);
    console.log(`  Raw Materials     : 45`);
    console.log(`  Components        : 50`);
    console.log(`  Assemblies        : 36`);
    console.log(`  Finished Goods    : 22`);
    console.log(`\nHighly connected nodes (high risk):`);
    console.log(`  - LiPF₆ Salt → 4 electrolytes → most cells → all packs`);
    console.log(`  - PVDF Binder → all cathodes → most cells → all packs`);
    console.log(`  - BMS PCB → 3 BMS assemblies → Battery Mgmt System → all packs`);
    console.log(`  - Graphite Anode → 3 cells → most modules → most packs`);
}

main()
    .catch((err) => {
        console.error("\n[seed] FAILED:", err);
        process.exit(1);
    })
    .finally(() => process.exit(0));
