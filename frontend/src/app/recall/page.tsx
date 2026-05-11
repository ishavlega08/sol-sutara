"use client";

import { useState, useCallback } from "react";
import { RefreshCw, ChevronDown, AlertTriangle } from "lucide-react";
import SupplyChainGraph, { type SupplyNode, type SupplyEdge } from "@/components/graph/SupplyChainGraph";
import { StatusBadge } from "@/components/ui/Badge";
import ActionButton from "@/components/ui/ActionButton";
import { getComponents, getComponentAffected, createRecall } from "@/lib/api";
import type { ComponentListItem, AffectedComponent } from "@/types/component";

const LEGEND = [
  { color: "#ef4444", label: "Affected (root)" },
  { color: "#f59e0b", label: "Propagating" },
  { color: "#9ca3af", label: "Unaffected" },
];

const TYPE_TIER: Record<string, 1 | 2 | 3 | 4> = {
  RAW_MATERIAL: 1, COMPONENT: 2, ASSEMBLY: 3, FINISHED_GOOD: 4,
};
function tierForType(type: string): 1 | 2 | 3 | 4 {
  return TYPE_TIER[type.toUpperCase().replace(/\s+/g, "_")] ?? 2;
}

function buildGraph(
  root: { id: string; name: string; type: string },
  affected: AffectedComponent[]
): { nodes: SupplyNode[]; edges: SupplyEdge[] } {
  const nodes: SupplyNode[] = [
    {
      id:       root.id,
      label:    root.name.slice(0, 12),
      sublabel: root.type,
      tier:     tierForType(root.type),
      state:    "affected",
    },
  ];
  const edges: SupplyEdge[] = [];

  // Group by depth so we can wire parent→child edges
  const byDepth = new Map<number, AffectedComponent[]>();
  for (const a of affected) {
    if (!byDepth.has(a.depth)) byDepth.set(a.depth, []);
    byDepth.get(a.depth)!.push(a);
  }

  for (const a of affected) {
    nodes.push({
      id:       a.id,
      label:    a.name.slice(0, 12),
      sublabel: a.type,
      tier:     Math.min(tierForType(a.type), 4) as 1 | 2 | 3 | 4,
      state:    "propagating",
    });
  }

  // Edges: root → depth-1 items; depth-1 → depth-2 etc.
  // Since we don't have exact parent info per affected node here, we wire
  // root → all depth-1, and each depth-n item → all depth-(n+1) items (approximation).
  const depth1 = byDepth.get(1) ?? [];
  for (const a of depth1) {
    edges.push({ from: root.id, to: a.id, highlighted: true });
  }
  const maxDepth = Math.max(...Array.from(byDepth.keys()), 1);
  for (let d = 1; d < maxDepth; d++) {
    const parents = byDepth.get(d) ?? [];
    const children = byDepth.get(d + 1) ?? [];
    for (const p of parents) {
      for (const c of children) {
        edges.push({ from: p.id, to: c.id, highlighted: true });
      }
    }
  }

  return { nodes, edges };
}

export default function RecallPage() {
  const [query, setQuery]   = useState("");
  const [scope, setScope]   = useState("Entire batch");
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [nodes, setNodes]   = useState<SupplyNode[]>([]);
  const [edges, setEdges]   = useState<SupplyEdge[]>([]);
  const [total, setTotal]   = useState(0);
  const [rootName, setRootName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Recall issuance
  const [recallReason, setRecallReason] = useState("");
  const [recalling, setRecalling]       = useState(false);
  const [recallDone, setRecallDone]     = useState(false);
  const [recallError, setRecallError]   = useState<string | null>(null);

  // autocomplete
  const [suggestions, setSuggestions]     = useState<ComponentListItem[]>([]);
  const [showSugg, setShowSugg]           = useState(false);
  const [allComponents, setAllComponents] = useState<ComponentListItem[]>([]);
  const [loadedList, setLoadedList]       = useState(false);

  const loadList = useCallback(async () => {
    if (loadedList) return;
    try {
      const res = await getComponents();
      setAllComponents(res.components);
      setLoadedList(true);
    } catch { /* silent */ }
  }, [loadedList]);

  const onQueryChange = (val: string) => {
    setQuery(val);
    if (val.length < 2) { setSuggestions([]); setShowSugg(false); return; }
    const q = val.toLowerCase();
    setSuggestions(allComponents.filter((c) => c.name.toLowerCase().includes(q) || c.id.includes(q)).slice(0, 6));
    setShowSugg(true);
  };

  const pickSuggestion = (c: ComponentListItem) => {
    setQuery(c.name);
    setSelectedId(c.id);
    setSuggestions([]);
    setShowSugg(false);
    triggerRecall(c.id, c.name);
  };

  const triggerRecall = useCallback(async (compId?: string, compName?: string) => {
    let id = compId;
    if (!id) {
      const match = allComponents.find(
        (c) => c.name.toLowerCase() === query.toLowerCase() || c.id === query
      );
      if (!match) { setError("Component not found. Select from the dropdown."); return; }
      id = match.id;
      compName = match.name;
    }

    setLoading(true);
    setError(null);
    setActive(false);

    try {
      const res = await getComponentAffected(id);
      const { nodes: n, edges: e } = buildGraph(res.root, res.affected);
      setNodes(n);
      setEdges(e);
      setTotal(res.total);
      setRootName(compName ?? res.root.name);
      setActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recall failed");
    } finally {
      setLoading(false);
    }
  }, [allComponents, query]);

  const reset = () => {
    setActive(false);
    setNodes([]);
    setEdges([]);
    setTotal(0);
    setQuery("");
    setError(null);
    setSelectedId(null);
    setRecallReason("");
    setRecallDone(false);
    setRecallError(null);
  };

  const handleIssueRecall = async () => {
    if (!selectedId || !recallReason.trim()) return;
    setRecalling(true);
    setRecallError(null);
    try {
      await createRecall({ componentId: selectedId, reason: recallReason.trim(), scope });
      setRecallDone(true);
    } catch (err) {
      setRecallError(err instanceof Error ? err.message : "Failed to issue recall");
    } finally {
      setRecalling(false);
    }
  };

  const onNodeClick = useCallback(() => {}, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-950 lg:flex-row">

      {/* Graph area */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recall simulation</h1>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Flag a defective component. See the blast radius before you lift the phone.</p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <ActionButton variant="ghost" onClick={reset}>
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </ActionButton>
              <ActionButton
                variant="danger"
                onClick={() => triggerRecall()}
                disabled={loading || !query}
                className="border-red-300 bg-red-500 text-white hover:bg-red-600"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {loading ? "Running…" : "Trigger recall"}
              </ActionButton>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <div className="flex items-center gap-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
                <input
                  type="text"
                  value={query}
                  onFocus={loadList}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Search defective component…"
                  className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400"
                />
              </div>
              {showSugg && suggestions.length > 0 && (
                <div className="absolute top-full z-20 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                  {suggestions.map((c) => (
                    <button key={c.id} onMouseDown={() => pickSuggestion(c)}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span className="text-gray-800 dark:text-gray-200">{c.name}</span>
                      <span className="text-xs text-gray-400">{c.type}</span>
                    </button>
                  ))}
                </div>
              )}
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

          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        {/* Graph */}
        <div className="relative flex-1 bg-white dark:bg-gray-950">
          {!active && !loading && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Search a component and click &quot;Trigger recall&quot; to see its blast radius.</p>
            </div>
          )}
          {loading && (
            <div className="flex h-full items-center justify-center">
              <p className="animate-pulse text-sm text-gray-400 dark:text-gray-500">Computing blast radius…</p>
            </div>
          )}
          {active && !loading && (
            <SupplyChainGraph nodes={nodes} edges={edges} variant="recall" onNodeClick={onNodeClick} legend={LEGEND} />
          )}
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

          {active ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Affected root</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{rootName}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-3">Downstream components affected</p>
              <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
              <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-700 pt-4 text-sm">
                {[
                  { label: "Downstream components", value: String(total) },
                  { label: "Nodes in graph",        value: String(nodes.length) },
                  { label: "Edges in graph",        value: String(edges.length) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-200">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {loading ? "Computing…" : "No recall active. Trigger one to see impact."}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto border-t border-gray-100 dark:border-gray-800 p-4">
          {recallDone ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Recall issued and recorded on-chain.
            </div>
          ) : (
            <>
              {active && (
                <textarea
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                  placeholder="Reason for recall (required)…"
                  rows={2}
                  className="mb-3 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-violet-400 placeholder:text-gray-400 resize-none"
                />
              )}
              {recallError && <p className="mb-2 text-xs text-red-500">{recallError}</p>}
              <button
                onClick={handleIssueRecall}
                disabled={!active || recalling || !recallReason.trim()}
                className="w-full rounded-md py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c3aed, #10b981)" }}
              >
                {recalling ? "Issuing recall…" : "Issue targeted recall →"}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
