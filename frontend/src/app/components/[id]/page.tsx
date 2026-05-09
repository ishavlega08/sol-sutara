"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, AlertTriangle, ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
import { RiskBadge, StatusBadge, type RiskLevel } from "@/components/ui/Badge";
import SectionCard from "@/components/ui/SectionCard";
import ActionButton from "@/components/ui/ActionButton";
import StatusChanger from "@/components/ui/StatusChanger";
import StatusTimeline from "@/components/ui/StatusTimeline";
import OnChainBadge from "@/components/ui/OnChainBadge";
import { getComponentById, getComponentChildren, getComponentParents, getComponentRisk, getComponentEvents } from "@/lib/api";
import type { ComponentListItem, ChildLink, RiskScore, ComponentEvent, ComponentStatus } from "@/types/component";

// ── types ─────────────────────────────────────────────────────────────────────

interface ParentLink {
  linkId: string;
  txHash: string;
  createdAt: string;
  parent: { id: string; name: string; onChainId: string | null; onChainAddress: string | null };
}

type RelItem = { id: string; label: string; risk: RiskLevel | null };

// ── helpers ───────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444" };

function RiskGauge({ score, level }: { score: number; level: string }) {
  const key   = level.toUpperCase() as "LOW" | "MEDIUM" | "HIGH";
  const color = RISK_COLOR[key] ?? "#6b7280";
  const r = 52; const cx = 64; const cy = 64;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const fill = arc * (score / 100);
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
    <div className={`grid grid-cols-[120px_1fr] gap-4 px-5 py-3 text-sm sm:grid-cols-[160px_1fr] ${highlight ? "bg-gray-50 dark:bg-gray-800/50" : ""}`}>
      <span className="text-gray-400 dark:text-gray-500">{label}</span>
      <span className="min-w-0 break-words text-gray-900 dark:text-gray-300">{children}</span>
    </div>
  );
}

function SkeletonBlock({ h = "h-40" }: { h?: string }) {
  return <div className={`${h} animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800`} />;
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function ComponentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [component, setComponent] = useState<ComponentListItem | null>(null);
  const [parents, setParents]     = useState<ParentLink[]>([]);
  const [children, setChildren]   = useState<ChildLink[]>([]);
  const [risk, setRisk]           = useState<RiskScore | null>(null);
  const [events, setEvents]       = useState<ComponentEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.allSettled([
      getComponentById(id),
      getComponentParents(id),
      getComponentChildren(id),
      getComponentRisk(id),
      getComponentEvents(id),
    ]).then(([compRes, parentsRes, childrenRes, riskRes, eventsRes]) => {
      if (compRes.status === "fulfilled")    setComponent(compRes.value.component);
      else setError("Component not found.");

      if (parentsRes.status === "fulfilled")  setParents(parentsRes.value.parents as ParentLink[]);
      if (childrenRes.status === "fulfilled") setChildren(childrenRes.value.children);
      if (riskRes.status === "fulfilled")     setRisk(riskRes.value.risk);
      if (eventsRes.status === "fulfilled")   setEvents(eventsRes.value.events);
    }).finally(() => setLoading(false));
  }, [id]);

  const parentItems: RelItem[] = parents.map((p) => ({
    id:    p.parent.id,
    label: p.parent.id.slice(0, 8) + "…",
    risk:  null,
  }));
  const childItems: RelItem[] = children.map((c) => ({
    id:    c.child.id,
    label: c.child.name,
    risk:  null,
  }));

  const riskKey = risk?.level ?? "LOW";
  const riskVariant = riskKey === "HIGH" ? "error" : riskKey === "MEDIUM" ? "warning" : "success";

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
          <SkeletonBlock h="h-10" />
          <SkeletonBlock h="h-16" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              <SkeletonBlock h="h-32" />
              <SkeletonBlock h="h-48" />
              <SkeletonBlock h="h-40" />
            </div>
            <div className="space-y-5">
              <SkeletonBlock h="h-48" />
              <SkeletonBlock h="h-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">{error ?? "Component not found."}</p>
          <Link href="/components" className="mt-3 inline-block text-sm text-violet-600 hover:underline">
            ← Back to components
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Back + actions */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/components" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft className="h-3.5 w-3.5" /> Components
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="ghost">
              <Download className="h-3.5 w-3.5" /> Export lineage
            </ActionButton>
            <ActionButton variant="danger">
              <Link href={`/recall?id=${id}`} className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Simulate recall
              </Link>
            </ActionButton>
            <ActionButton variant="gradient">
              <Link href={`/trace?id=${id}`}>View trace →</Link>
            </ActionButton>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="flex flex-wrap items-baseline gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <span className="font-mono text-violet-600 text-lg">{id.slice(0, 8)}…</span>
            <span>· {component.name}</span>
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{component.type}</span>
            {component.supplier && <><span className="text-gray-300">·</span><span>{component.supplier}</span></>}
            <span className="text-gray-300">·</span>
            <StatusBadge label={`${riskKey} RISK`} variant={riskVariant} />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">

          {/* Left */}
          <div className="flex flex-col gap-5">

            {/* Lineage preview */}
            <SectionCard
              title="Lineage preview"
              action={<Link href={`/trace`} className="text-xs font-medium text-teal-600 hover:text-teal-700">Open in Trace →</Link>}
            >
              <div className="flex flex-wrap items-center justify-center gap-2 py-4">
                {parentItems.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {parentItems.map((p) => (
                      <Link key={p.id} href={`/components/${p.id}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm hover:border-gray-300 dark:hover:border-gray-600">
                        <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{p.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {parentItems.length > 0 && (
                  <svg width="50" height="60" className="flex-shrink-0 overflow-visible">
                    {parentItems.map((_, i) => {
                      const total = parentItems.length;
                      const y = total === 1 ? 30 : (i / (total - 1)) * 50 + 5;
                      return <path key={i} d={`M 0 ${y} C 25 ${y}, 25 30, 50 30`} fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeDasharray="4 3" />;
                    })}
                  </svg>
                )}
                <div className="flex items-center gap-2 rounded-lg border-2 border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/30 px-3 py-2 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{id.slice(0, 8)}…</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{component.name}</span>
                  </div>
                </div>
                {childItems.length > 0 && (
                  <svg width="50" height="60" className="flex-shrink-0 overflow-visible">
                    {childItems.map((_, i) => {
                      const total = childItems.length;
                      const y = total === 1 ? 30 : (i / (total - 1)) * 50 + 5;
                      return <path key={i} d={`M 0 30 C 25 30, 25 ${y}, 50 ${y}`} fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeDasharray="4 3" />;
                    })}
                  </svg>
                )}
                {childItems.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {childItems.map((c) => (
                      <Link key={c.id} href={`/components/${c.id}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm hover:border-gray-300 dark:hover:border-gray-600">
                        <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {parentItems.length === 0 && childItems.length === 0 && (
                  <p className="text-xs text-gray-400">No relationships yet — link this component to others.</p>
                )}
              </div>
            </SectionCard>

            {/* Metadata */}
            <SectionCard title="Metadata" noPadding>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                <MetaRow label="Component ID"><span className="font-mono text-sm">{id}</span></MetaRow>
                <MetaRow label="Type">{component.type}</MetaRow>
                {component.supplier && <MetaRow label="Supplier">{component.supplier}</MetaRow>}
                <MetaRow label="Status" highlight>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    component.status === "RECALLED" ? "bg-red-100 text-red-700" :
                    component.status === "IN_TRANSIT" ? "bg-blue-100 text-blue-700" :
                    component.status === "INSPECTED" ? "bg-violet-100 text-violet-700" :
                    component.status === "RECEIVED" ? "bg-cyan-100 text-cyan-700" :
                    component.status === "ARCHIVED" ? "bg-gray-200 text-gray-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>{component.status ?? "CREATED"}</span>
                </MetaRow>
                {component.batch_number && <MetaRow label="Batch number"><span className="font-mono text-xs">{component.batch_number}</span></MetaRow>}
                {component.lot_number && <MetaRow label="Lot number"><span className="font-mono text-xs">{component.lot_number}</span></MetaRow>}
                {component.quantity != null && (
                  <MetaRow label="Quantity">{component.quantity} {component.unit ?? ""}</MetaRow>
                )}
                {component.expiry_date && (
                  <MetaRow label="Expiry date">
                    {new Date(component.expiry_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </MetaRow>
                )}
                <MetaRow label="Org ID">
                  <span className="font-mono text-xs text-violet-600">{component.org_id ?? "—"}</span>
                </MetaRow>
                <MetaRow label="Metadata URI">
                  <span className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                    {component.metadata_uri || "—"}
                  </span>
                </MetaRow>
                <MetaRow label="On-chain address">
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">{component.on_chain_address ?? "—"}</span>
                </MetaRow>
                <MetaRow label="On-chain ID">
                  <span className="font-mono text-sm">{component.on_chain_id ?? "—"}</span>
                </MetaRow>
                <MetaRow label="Created">
                  <span className="text-sm text-gray-700 dark:text-gray-400">
                    {new Date(component.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </MetaRow>
                {component.tx_hash && (
                  <MetaRow label="Tx signature">
                    <a href={`https://explorer.solana.com/tx/${component.tx_hash}?cluster=devnet`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-xs text-teal-600 hover:text-teal-800 break-all">
                      {component.tx_hash} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </MetaRow>
                )}
              </div>
            </SectionCard>

            {/* Status lifecycle */}
            <SectionCard title="Status lifecycle">
              <StatusTimeline events={events} />
            </SectionCard>

            {/* Relationships */}
            <SectionCard title="Relationships" noPadding>
              <div className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-gray-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {([
                  { label: "Parents", items: parentItems, icon: ArrowUp },
                  { label: "Children", items: childItems, icon: ArrowDown },
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
                          className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <span className="text-sm text-gray-800 dark:text-gray-300 truncate">{item.label}</span>
                          {item.risk && <RiskBadge level={item.risk} short />}
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

            {/* On-chain verification */}
            <SectionCard title="On-chain verification">
              <OnChainBadge componentId={id} />
            </SectionCard>

            {/* Status changer */}
            <SectionCard title="Update status">
              <StatusChanger
                componentId={id}
                currentStatus={(component.status ?? "CREATED") as ComponentStatus}
                onStatusChange={(newStatus) => {
                  setComponent((prev) => prev ? { ...prev, status: newStatus } : prev);
                  getComponentEvents(id).then((r) => setEvents(r.events)).catch(() => {});
                }}
              />
            </SectionCard>

            <SectionCard title="Risk score">
              {risk ? (
                <>
                  <RiskGauge score={risk.score} level={risk.level} />
                  <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-700 pt-4 text-sm">
                    {[
                      { label: "Parent count",       value: String(risk.factors.parentCount) },
                      { label: "Child count",        value: String(risk.factors.childCount) },
                      { label: "Upstream depth",     value: String(risk.factors.upstreamDepth) },
                      { label: "Downstream depth",   value: String(risk.factors.downstreamDepth) },
                      { label: "Reuse frequency",    value: `${risk.factors.reuseFrequency}x` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{label}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-300">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="py-4 text-center text-sm text-gray-400">Risk data unavailable.</p>
              )}
            </SectionCard>

            {risk && risk.explanation.length > 0 && (
              <SectionCard title="Risk factors">
                <div className="flex flex-col gap-2">
                  {risk.explanation.map((line, i) => (
                    <div key={i} className="rounded-md border border-amber-100 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      {line}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
