"use client";

import Link from "next/link";
import { ArrowLeft, Download, AlertTriangle, ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
import { RiskBadge, StatusBadge, type RiskLevel } from "@/components/ui/Badge";
import SectionCard from "@/components/ui/SectionCard";
import ActionButton from "@/components/ui/ActionButton";

type RelItem = { id: string; label: string; risk: RiskLevel };

interface ComponentDetail {
  id: string; name: string; subtitle: string;
  risk: RiskLevel; riskScore: number;
  metadata: {
    componentId: string; type: string; ownerOrg: string; ownerOrgHash: string;
    metadataUri: string; metadataHash: string; compressedNft: string;
    created: string; txSignature: string;
  };
  lineage: {
    parents: { id: string; label: string }[];
    self:    { id: string; label: string };
    children:{ id: string; label: string }[];
  };
  riskDetails: { dependencies: string; graphDepth: string; reuseFactor: string; singleSource: string; geoRisk: string };
  suggestedActions: string[];
  parents:  RelItem[];
  children: RelItem[];
}

const COMPONENTS: Record<string, ComponentDetail> = {
  "CM-18": {
    id: "CM-18", name: "Cathode B-18", subtitle: "Lithium cobalt oxide cathode, batch 881",
    risk: "MEDIUM", riskScore: 65,
    metadata: { componentId: "CM-18·batch-881", type: "Cathode (NMC)", ownerOrg: "org:kaldera", ownerOrgHash: "4Jk8…p9Qp", metadataUri: "shdw://cathode-b18-881.json", metadataHash: "0x4a8b…c2f1", compressedNft: "cNFT · 9Q2p…mFfE", created: "Apr 14, 2026 · 09:14 UTC", txSignature: "2pF9…mN3h" },
    lineage: { parents: [{ id: "SP-02", label: "Cobalt · DRC" }, { id: "SP-01", label: "Lithium · Chile" }], self: { id: "CM-18", label: "Cathode · B-18" }, children: [{ id: "AS-07", label: "Module · M-7" }] },
    riskDetails: { dependencies: "2 upstream", graphDepth: "tier 3 of 7", reuseFactor: "1 downstream", singleSource: "Yes (SP-02)", geoRisk: "High (DRC)" },
    suggestedActions: ["Add secondary cobalt supplier", "Run batch audit", "Flag for recall drill"],
    parents:  [{ id: "SP-02", label: "SP-02 Cobalt · DRC", risk: "HIGH" }, { id: "SP-01", label: "SP-01 Lithium · Chile", risk: "LOW" }],
    children: [{ id: "AS-07", label: "AS-07 Module · M-7", risk: "MEDIUM" }],
  },
  "SP-01": {
    id: "SP-01", name: "Lithium · Chile salar", subtitle: "Spodumene concentrate, salar batch 2025",
    risk: "LOW", riskScore: 18,
    metadata: { componentId: "SP-01·batch-chile", type: "Raw Material", ownerOrg: "org:aster", ownerOrgHash: "8Ab1…q7Rp", metadataUri: "shdw://lithium-sp01.json", metadataHash: "0x1b2c…a8d4", compressedNft: "cNFT · 3Px1…nQ9k", created: "Jan 12, 2025 · 07:00 UTC", txSignature: "5aR1…kP2m" },
    lineage: { parents: [], self: { id: "SP-01", label: "Lithium · Chile" }, children: [{ id: "CM-18", label: "Cathode · B-18" }, { id: "CM-24", label: "Anode · A-24" }] },
    riskDetails: { dependencies: "0 upstream", graphDepth: "tier 1 of 7", reuseFactor: "3 downstream", singleSource: "No", geoRisk: "Low (Chile)" },
    suggestedActions: ["Review supplier certification", "Schedule next audit"],
    parents:  [],
    children: [{ id: "CM-18", label: "CM-18 Cathode · B-18", risk: "MEDIUM" }, { id: "CM-24", label: "CM-24 Anode · A-24", risk: "LOW" }],
  },
  "SP-02": {
    id: "SP-02", name: "Cobalt · DRC b-881", subtitle: "Refined cobalt sulfate, DRC batch 881",
    risk: "HIGH", riskScore: 88,
    metadata: { componentId: "SP-02·batch-881", type: "Raw Material", ownerOrg: "org:aster", ownerOrgHash: "8Ab1…q7Rp", metadataUri: "shdw://cobalt-sp02-881.json", metadataHash: "0x9c3e…b1f7", compressedNft: "cNFT · 7Lm3…pR4q", created: "Jan 14, 2025 · 11:30 UTC", txSignature: "8bQ4…yT3n" },
    lineage: { parents: [], self: { id: "SP-02", label: "Cobalt · DRC" }, children: [{ id: "CM-18", label: "Cathode · B-18" }, { id: "CM-31", label: "NMC-811" }] },
    riskDetails: { dependencies: "0 upstream", graphDepth: "tier 1 of 7", reuseFactor: "2 downstream", singleSource: "Yes", geoRisk: "High (DRC)" },
    suggestedActions: ["Source alternative supplier", "Escalate geo risk review", "Flag for recall drill"],
    parents:  [],
    children: [{ id: "CM-18", label: "CM-18 Cathode · B-18", risk: "MEDIUM" }, { id: "CM-31", label: "CM-31 NMC-811", risk: "HIGH" }],
  },
};

const RISK_COLOR: Record<string, string> = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444" };

function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const key   = level.toUpperCase() as "LOW" | "MEDIUM" | "HIGH";
  const color = RISK_COLOR[key];
  const r = 52; const cx = 64; const cy = 64;
  const circ  = 2 * Math.PI * r;
  const arc   = circ * 0.75;
  const fill  = arc * (score / 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="128" height="112" viewBox="0 0 128 120">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="10"
            strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: 4 }}>
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-400">{key}</span>
    </div>
  );
}

function MetaRow({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`grid grid-cols-[120px_1fr] gap-4 px-5 py-3 text-sm sm:grid-cols-[160px_1fr] ${highlight ? "bg-gray-50" : ""}`}>
      <span className="text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-gray-900">{children}</span>
    </div>
  );
}

export default function ComponentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const comp: ComponentDetail = COMPONENTS[id] ?? { ...COMPONENTS["CM-18"], id, name: id, subtitle: "Supply chain component" };
  const riskKey = comp.risk.toUpperCase() as "LOW" | "MEDIUM" | "HIGH";

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Back + actions */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/components" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Components
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="ghost">
              <Download className="h-3.5 w-3.5" /> Export lineage
            </ActionButton>
            <ActionButton variant="danger">
              <AlertTriangle className="h-3.5 w-3.5" /> Simulate recall
            </ActionButton>
            <ActionButton variant="gradient">
              <Link href="/trace">View trace →</Link>
            </ActionButton>
          </div>
        </div>

        {/* Component heading */}
        <div className="mb-6">
          <h1 className="flex flex-wrap items-baseline gap-2 text-2xl font-bold text-gray-900">
            <span className="text-violet-600">{comp.id}</span>
            <span>· {comp.name}</span>
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>{comp.subtitle}</span>
            <span className="text-gray-300">·</span>
            <StatusBadge label={`${riskKey} RISK`} variant={riskKey === "HIGH" ? "error" : riskKey === "MEDIUM" ? "warning" : "success"} />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">

          {/* Left */}
          <div className="flex flex-col gap-5">

            {/* Lineage preview */}
            <SectionCard
              title="Lineage preview"
              action={<Link href="/trace" className="text-xs font-medium text-teal-600 hover:text-teal-700">Open in Trace →</Link>}
            >
              <div className="flex flex-wrap items-center justify-center gap-2 py-4">
                {comp.lineage.parents.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {comp.lineage.parents.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs font-semibold text-gray-800">{p.id}</span>
                          <span className="text-[10px] text-gray-400">{p.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {comp.lineage.parents.length > 0 && (
                  <svg width="50" height="60" className="flex-shrink-0 overflow-visible">
                    {comp.lineage.parents.map((_, i) => {
                      const total = comp.lineage.parents.length;
                      const y = total === 1 ? 30 : (i / (total - 1)) * 50 + 5;
                      return <path key={i} d={`M 0 ${y} C 25 ${y}, 25 30, 50 30`} fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeDasharray="4 3" />;
                    })}
                  </svg>
                )}
                <div className="flex items-center gap-2 rounded-lg border-2 border-violet-400 bg-violet-50 px-3 py-2 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold text-gray-800">{comp.lineage.self.id}</span>
                    <span className="text-[10px] text-gray-400">{comp.lineage.self.label}</span>
                  </div>
                </div>
                {comp.lineage.children.length > 0 && (
                  <svg width="50" height="60" className="flex-shrink-0 overflow-visible">
                    {comp.lineage.children.map((_, i) => {
                      const total = comp.lineage.children.length;
                      const y = total === 1 ? 30 : (i / (total - 1)) * 50 + 5;
                      return <path key={i} d={`M 0 30 C 25 30, 25 ${y}, 50 ${y}`} fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeDasharray="4 3" />;
                    })}
                  </svg>
                )}
                {comp.lineage.children.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {comp.lineage.children.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-gray-300 flex-shrink-0" />
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs font-semibold text-gray-800">{c.id}</span>
                          <span className="text-[10px] text-gray-400">{c.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Metadata */}
            <SectionCard title="Metadata" noPadding>
              <div className="divide-y divide-gray-50">
                <MetaRow label="Component ID"><span className="font-mono text-sm">{comp.metadata.componentId}</span></MetaRow>
                <MetaRow label="Type">{comp.metadata.type}</MetaRow>
                <MetaRow label="Owner org" highlight>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {comp.metadata.ownerOrg}
                    <span className="text-gray-400">·</span>
                    <span className="font-mono text-xs text-violet-600">{comp.metadata.ownerOrgHash}</span>
                  </span>
                </MetaRow>
                <MetaRow label="Metadata URI">
                  <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">{comp.metadata.metadataUri}</span>
                </MetaRow>
                <MetaRow label="Metadata hash"><span className="font-mono text-sm text-gray-700">{comp.metadata.metadataHash}</span></MetaRow>
                <MetaRow label="Compressed NFT">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-gray-700">{comp.metadata.compressedNft}</span>
                    <StatusBadge label="MINTED" variant="success" />
                  </span>
                </MetaRow>
                <MetaRow label="Created"><span className="text-sm text-gray-700">{comp.metadata.created}</span></MetaRow>
                <MetaRow label="Tx signature">
                  <a href={`https://explorer.solana.com/tx/${comp.metadata.txSignature}?cluster=devnet`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-xs text-teal-600 hover:text-teal-800">
                    {comp.metadata.txSignature} <ExternalLink className="h-3 w-3" />
                  </a>
                </MetaRow>
              </div>
            </SectionCard>

            {/* Relationships */}
            <SectionCard title="Relationships" noPadding>
              <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {([
                  { label: "Parents", items: comp.parents,  icon: ArrowUp },
                  { label: "Children", items: comp.children, icon: ArrowDown },
                ] as { label: string; items: RelItem[]; icon: React.ElementType }[]).map(({ label, items, icon: Icon }) => (
                  <div key={label} className="p-4">
                    <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      <Icon className="h-3 w-3" /> {label} ({items.length})
                    </p>
                    <div className="flex flex-col gap-2">
                      {items.length === 0 && (
                        <p className="text-xs text-gray-400">{label === "Parents" ? "Root component." : "Leaf component."}</p>
                      )}
                      {items.map((item) => (
                        <Link key={item.id} href={`/components/${item.id}`}
                          className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 hover:border-gray-300 hover:bg-gray-50">
                          <span className="text-sm text-gray-800">{item.label}</span>
                          <RiskBadge level={item.risk} short />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

          </div>

          {/* Right */}
          <div className="flex flex-col gap-5">
            <SectionCard title="Risk score">
              <RiskGauge score={comp.riskScore} level={comp.risk} />
              <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 text-sm">
                {[
                  { label: "Dependencies",  value: comp.riskDetails.dependencies },
                  { label: "Graph depth",   value: comp.riskDetails.graphDepth },
                  { label: "Reuse factor",  value: comp.riskDetails.reuseFactor },
                  { label: "Single-source", value: comp.riskDetails.singleSource, accent: comp.riskDetails.singleSource.startsWith("Yes") },
                  { label: "Geo risk",      value: comp.riskDetails.geoRisk,      accent: comp.riskDetails.geoRisk.startsWith("High") },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-medium ${accent ? "text-amber-500" : "text-gray-900"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Suggested actions">
              <div className="flex flex-col gap-2">
                {comp.suggestedActions.map((action, i) => (
                  <button key={i} className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-left text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50">
                    → {action}
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>

        </div>
      </div>
    </div>
  );
}
