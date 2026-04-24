"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Download, ChevronDown } from "lucide-react";
import SupplyChainGraph, { type SupplyNode, type SupplyEdge } from "@/components/graph/SupplyChainGraph";
import { RiskBadge, type RiskLevel } from "@/components/ui/Badge";
import ActionButton from "@/components/ui/ActionButton";

type Direction = "Upstream" | "Downstream" | "Both";

const NODES: SupplyNode[] = [
  { id: "SP-01", label: "SP-01", sublabel: "Lithium · Chile",  tier: 1, risk: "low" },
  { id: "SP-02", label: "SP-02", sublabel: "Cobalt · DRC",     tier: 1, risk: "high" },
  { id: "SP-03", label: "SP-03", sublabel: "Nickel · Indo",    tier: 1, risk: "medium" },
  { id: "SP-04", label: "SP-04", sublabel: "Graphite · CN",    tier: 1, risk: "low" },
  { id: "CM-18", label: "CM-18", sublabel: "Cathode · B-18",   tier: 2, risk: "medium" },
  { id: "CM-24", label: "CM-24", sublabel: "Anode · A-24",     tier: 2, risk: "low" },
  { id: "CM-31", label: "CM-31", sublabel: "Cell · NMC-811",   tier: 2, risk: "high" },
  { id: "AS-07", label: "AS-07", sublabel: "Module · M-7",     tier: 3, risk: "medium" },
  { id: "AS-09", label: "AS-09", sublabel: "Pack · P-9",       tier: 3, risk: "medium" },
  { id: "PR-A",  label: "PR-A",  sublabel: "EV Pack · A",      tier: 4, risk: "low" },
];

const EDGES: SupplyEdge[] = [
  { from: "SP-01", to: "CM-18" }, { from: "SP-01", to: "CM-24" },
  { from: "SP-02", to: "CM-18" }, { from: "SP-03", to: "CM-24" },
  { from: "SP-03", to: "CM-31" }, { from: "SP-04", to: "CM-31" },
  { from: "CM-18", to: "AS-07" }, { from: "CM-24", to: "AS-09" },
  { from: "CM-31", to: "AS-09" }, { from: "AS-07", to: "PR-A" },
  { from: "AS-09", to: "PR-A" },
];

const NODE_DETAIL: Record<string, { name: string; tier: string; org: string; risk: RiskLevel; parents: number; children: number }> = {
  "SP-01": { name: "Lithium · Chile",  tier: "Tier 1", org: "org:aster",    risk: "low",    parents: 0, children: 2 },
  "SP-02": { name: "Cobalt · DRC",     tier: "Tier 1", org: "org:aster",    risk: "high",   parents: 0, children: 1 },
  "SP-03": { name: "Nickel · Indo",    tier: "Tier 1", org: "org:aster",    risk: "medium", parents: 0, children: 2 },
  "SP-04": { name: "Graphite · CN",    tier: "Tier 1", org: "org:aster",    risk: "low",    parents: 0, children: 1 },
  "CM-18": { name: "Cathode B-18",     tier: "Tier 3", org: "org:kaldera",  risk: "medium", parents: 2, children: 1 },
  "CM-24": { name: "Anode A-24",       tier: "Tier 2", org: "org:meridian", risk: "low",    parents: 2, children: 1 },
  "CM-31": { name: "Cell NMC-811",     tier: "Tier 2", org: "org:kaldera",  risk: "high",   parents: 2, children: 1 },
  "AS-07": { name: "Module M-7",       tier: "Tier 3", org: "org:meridian", risk: "medium", parents: 1, children: 1 },
  "AS-09": { name: "Pack P-9",         tier: "Tier 3", org: "org:meridian", risk: "medium", parents: 2, children: 1 },
  "PR-A":  { name: "EV Pack A",        tier: "Tier 4", org: "org:meridian", risk: "low",    parents: 2, children: 0 },
};

const LEGEND = [
  { color: "#10b981", label: "Low risk" },
  { color: "#f59e0b", label: "Medium" },
  { color: "#ef4444", label: "High" },
  { color: "#7c3aed", label: "Selected" },
];

const DIR_BTNS: Direction[] = ["Upstream", "Downstream", "Both"];

export default function TracePage() {
  const [query, setQuery]           = useState("PR-A · EV Pack A");
  const [depth, setDepth]           = useState(6);
  const [direction, setDirection]   = useState<Direction>("Upstream");
  const [selectedId, setSelectedId] = useState<string | null>("CM-18");

  const onNodeClick = useCallback((id: string) => setSelectedId(id), []);
  const selected = selectedId ? NODE_DETAIL[selectedId] : null;

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">

      {/* Graph area */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 dark:border-gray-800 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Trace</h1>
              <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">Walk the lineage of any component, upstream or downstream.</p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <div className="flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5">
                {DIR_BTNS.map((d) => (
                  <button key={d} onClick={() => setDirection(d)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${direction === d ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
                  >
                    {d === "Upstream" ? "↑ " : d === "Downstream" ? "↓ " : ""}{d}
                  </button>
                ))}
              </div>
              <ActionButton variant="ghost">
                <Download className="h-3.5 w-3.5" />
                Export
              </ActionButton>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
              <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Component ID or name…"
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}
                  className="appearance-none rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 bg-white py-2 pl-3 pr-7 text-sm text-gray-700 outline-none hover:bg-gray-50 dark:hover:bg-gray-700">
                  {[1,2,3,4,5,6,7].map((d) => <option key={d} value={d}>Depth: {d} tiers</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
              <ActionButton variant="gradient" className="flex-shrink-0">Run trace</ActionButton>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="relative flex-1">
          <SupplyChainGraph nodes={NODES} edges={EDGES} variant="trace" selectedId={selectedId} onNodeClick={onNodeClick} legend={LEGEND} />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-shrink-0 flex-col divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto lg:w-80 lg:border-l lg:border-t-0">

        <div className="px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Trace result</h2>
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ● COMPLETE
            </span>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            {[
              { label: "Origin",        value: query.split("·")[0].trim() || "PR-A" },
              { label: "Direction",     value: direction },
              { label: "Depth reached", value: `${depth} tiers`, bold: true },
              { label: "Nodes walked",  value: "42", bold: true },
              { label: "Edges walked",  value: "58", bold: true },
              { label: "Organizations", value: "4",  bold: true },
            ].map(({ label, value, bold }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className={bold ? "font-semibold text-gray-900 dark:text-gray-200" : "text-gray-700 dark:text-gray-400"}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Elapsed</span>
              <span className="font-semibold text-emerald-600">{"< 200ms"} <span className="text-[10px] font-normal text-gray-400 dark:text-gray-600">★</span></span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600">★ devnet estimate</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Selected node</h2>
          {selected && selectedId ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-200">
                  <span className="text-violet-600">{selectedId}</span> · {selected.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{selected.tier} · {selected.org}</p>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Risk</span>
                  <RiskBadge level={selected.risk} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Parents</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{selected.parents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Children</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{selected.children}</span>
                </div>
              </div>
              <Link href={`/components/${selectedId}`}
                className="mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 py-2 text-center text-sm text-gray-700 dark:text-gray-300 transition hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                Open detail →
              </Link>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">Click a node to inspect it.</p>
          )}
        </div>

      </div>
    </div>
  );
}
