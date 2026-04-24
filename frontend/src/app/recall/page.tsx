"use client";

import { useState, useCallback } from "react";
import { RefreshCw, ChevronDown, AlertTriangle } from "lucide-react";
import SupplyChainGraph, { type SupplyNode, type SupplyEdge } from "@/components/graph/SupplyChainGraph";
import { StatusBadge } from "@/components/ui/Badge";
import ActionButton from "@/components/ui/ActionButton";

const NODES: SupplyNode[] = [
  { id: "SP-01", label: "SP-01", sublabel: "Lithium",      tier: 1, state: "unaffected" },
  { id: "SP-02", label: "SP-02", sublabel: "Cobalt · DRC", tier: 1, state: "affected" },
  { id: "SP-03", label: "SP-03", sublabel: "Nickel",       tier: 1, state: "unaffected" },
  { id: "SP-04", label: "SP-04", sublabel: "Graphite",     tier: 1, state: "unaffected" },
  { id: "CM-18", label: "CM-18", sublabel: "Cathode B-18", tier: 2, state: "affected" },
  { id: "CM-24", label: "CM-24", sublabel: "Anode A-24",   tier: 2, state: "unaffected" },
  { id: "CM-31", label: "CM-31", sublabel: "Cell NMC-811", tier: 2, state: "affected" },
  { id: "AS-07", label: "AS-07", sublabel: "Module M-7",   tier: 3, state: "propagating" },
  { id: "AS-09", label: "AS-09", sublabel: "Pack P-9",     tier: 3, state: "propagating" },
  { id: "PR-A",  label: "PR-A",  sublabel: "EV Pack A",    tier: 4, state: "propagating" },
];

const EDGES: SupplyEdge[] = [
  { from: "SP-01", to: "CM-18", highlighted: false },
  { from: "SP-01", to: "CM-24", highlighted: false },
  { from: "SP-02", to: "CM-18", highlighted: true },
  { from: "SP-02", to: "CM-31", highlighted: true },
  { from: "SP-03", to: "CM-24", highlighted: false },
  { from: "SP-03", to: "CM-31", highlighted: false },
  { from: "SP-04", to: "CM-31", highlighted: false },
  { from: "CM-18", to: "AS-07", highlighted: true },
  { from: "CM-24", to: "AS-09", highlighted: false },
  { from: "CM-31", to: "AS-09", highlighted: true },
  { from: "AS-07", to: "PR-A",  highlighted: true },
  { from: "AS-09", to: "PR-A",  highlighted: true },
];

const LEGEND = [
  { color: "#ef4444", label: "Affected" },
  { color: "#9ca3af", label: "Unaffected" },
  { color: "#f59e0b", label: "Propagating" },
];

const DCS = [
  { id: "DC-01 Berlin",    units: 864 },
  { id: "DC-02 Tokyo",     units: 1142 },
  { id: "DC-03 Austin",    units: 906 },
  { id: "DC-04 Melbourne", units: 500 },
];

export default function RecallPage() {
  const [query, setQuery]   = useState("SP-02 · Cobalt DRC batch 881");
  const [scope, setScope]   = useState("Entire batch");
  const [active, setActive] = useState(true);

  const onNodeClick = useCallback(() => {}, []);

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">

      {/* Graph area */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 dark:border-gray-800 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recall simulation</h1>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Flag a defective component. See the blast radius before you lift the phone.</p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <ActionButton variant="ghost" onClick={() => setActive(false)}>
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </ActionButton>
              <ActionButton
                variant="danger"
                onClick={() => setActive(true)}
                className="border-red-300 bg-red-500 text-white hover:bg-red-600"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Trigger recall
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
            <div className="relative">
              <select value={scope} onChange={(e) => setScope(e.target.value)}
                className="appearance-none rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 bg-white py-2 pl-3 pr-7 text-sm text-gray-700 outline-none hover:bg-gray-50 dark:hover:bg-gray-700">
                <option>Entire batch</option>
                <option>Single unit</option>
                <option>Date range</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="relative flex-1">
          <SupplyChainGraph nodes={NODES} edges={EDGES} variant="recall" onNodeClick={onNodeClick} legend={LEGEND} />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-shrink-0 flex-col border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto lg:w-80 lg:border-l lg:border-t-0">

        {/* Blast radius */}
        <div className="px-5 py-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Blast radius</h2>
            {active && <StatusBadge label="ACTIVE" variant="error" />}
          </div>
          <div className="my-4 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: active ? "100%" : "0%" }} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Affected units</p>
          <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-100">3,412</p>
          <p className="mt-0.5 text-xs font-semibold text-teal-600">across 4 DCs</p>
          <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-700 pt-4 text-sm">
            {[
              { label: "Downstream components", value: "18" },
              { label: "Finished products",      value: "1 SKU" },
              { label: "Distribution centers",   value: "4" },
              { label: "Open shipments",         value: "12 in transit", color: "text-amber-500" },
              { label: "Est. financial impact",  value: "$2.8M",         color: "text-red-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className={`font-semibold ${color ?? "text-gray-900 dark:text-gray-200"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution centers */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Affected distribution centers</h3>
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-800">
            {DCS.map((dc) => (
              <div key={dc.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-700 dark:text-gray-300">{dc.id}</span>
                <span className="font-medium text-gray-500 dark:text-gray-400">{dc.units.toLocaleString()} units</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto border-t border-gray-100 dark:border-gray-800 p-4">
          <button
            className="w-full rounded-md py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c3aed, #10b981)" }}
          >
            Issue targeted recall →
          </button>
        </div>

      </div>
    </div>
  );
}
