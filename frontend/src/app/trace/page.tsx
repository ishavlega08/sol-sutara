"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Download, ChevronDown } from "lucide-react";
import SupplyChainGraph, { type SupplyNode, type SupplyEdge } from "@/components/graph/SupplyChainGraph";
import { RiskBadge, type RiskLevel } from "@/components/ui/Badge";
import ActionButton from "@/components/ui/ActionButton";
import { getComponents, getComponentTrace, getComponentAffected, getComponentRisk } from "@/lib/api";
import type { TraceNode, AffectedComponent, ComponentListItem } from "@/types/component";

type Direction = "Upstream" | "Downstream" | "Both";

const LEGEND = [
  { color: "#10b981", label: "Low risk" },
  { color: "#f59e0b", label: "Medium" },
  { color: "#ef4444", label: "High" },
  { color: "#7c3aed", label: "Selected" },
];

const DIR_BTNS: Direction[] = ["Upstream", "Downstream", "Both"];

// ── helpers ───────────────────────────────────────────────────────────────────

const TYPE_TIER: Record<string, 1 | 2 | 3 | 4> = {
  RAW_MATERIAL: 1, COMPONENT: 2, ASSEMBLY: 3, FINISHED_GOOD: 4,
};
function tierForType(type: string): 1 | 2 | 3 | 4 {
  return TYPE_TIER[type.toUpperCase().replace(/\s+/g, "_")] ?? 2;
}

/** Flatten a TraceNode tree into SupplyNode[] + SupplyEdge[] (upstream view). */
function flattenTrace(root: TraceNode): { nodes: SupplyNode[]; edges: SupplyEdge[]; count: number } {
  const nodesMap = new Map<string, SupplyNode>();
  const edges: SupplyEdge[] = [];

  function walk(node: TraceNode) {
    if (!nodesMap.has(node.id)) {
      nodesMap.set(node.id, {
        id:       node.id,
        label:    node.name.slice(0, 12),
        sublabel: node.type,
        tier:     tierForType(node.type),
      });
    }
    for (const parent of node.parents) {
      walk(parent);
      edges.push({ from: parent.id, to: node.id });
    }
  }

  walk(root);
  return { nodes: Array.from(nodesMap.values()), edges, count: nodesMap.size };
}

/** Flatten affected (downstream) into SupplyNode[] + SupplyEdge[]. */
function flattenAffected(
  root: { id: string; name: string; type: string },
  affected: AffectedComponent[]
): { nodes: SupplyNode[]; edges: SupplyEdge[] } {
  const nodes: SupplyNode[] = [
    { id: root.id, label: root.name.slice(0, 12), sublabel: root.type, tier: tierForType(root.type) },
  ];
  const edges: SupplyEdge[] = [];

  const byDepth = new Map<number, AffectedComponent[]>();
  for (const a of affected) {
    if (!byDepth.has(a.depth)) byDepth.set(a.depth, []);
    byDepth.get(a.depth)!.push(a);
    nodes.push({ id: a.id, label: a.name.slice(0, 12), sublabel: a.type, tier: Math.min(tierForType(a.type), 4) as 1|2|3|4 });
  }

  // root → depth-1, depth-n → depth-(n+1)
  for (const a of byDepth.get(1) ?? []) edges.push({ from: root.id, to: a.id });
  const maxDepth = Math.max(...Array.from(byDepth.keys()), 1);
  for (let d = 1; d < maxDepth; d++) {
    for (const p of byDepth.get(d) ?? [])
      for (const c of byDepth.get(d + 1) ?? [])
        edges.push({ from: p.id, to: c.id });
  }

  return { nodes, edges };
}

interface NodeInfo {
  name: string;
  type: string;
  parentCount: number;
  childCount: number;
  risk: RiskLevel | null;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function TracePage() {
  const [query, setQuery]             = useState("");
  const [depth, setDepth]             = useState(6);
  const [direction, setDirection]     = useState<Direction>("Upstream");
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [nodeInfo, setNodeInfo]       = useState<Record<string, NodeInfo>>({});

  const [nodes, setNodes]             = useState<SupplyNode[]>([]);
  const [edges, setEdges]             = useState<SupplyEdge[]>([]);
  const [traceRoot, setTraceRoot]     = useState<string | null>(null);
  const [nodesWalked, setNodesWalked] = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [ran, setRan]                 = useState(false);

  // autocomplete
  const [suggestions, setSuggestions]   = useState<ComponentListItem[]>([]);
  const [showSugg, setShowSugg]         = useState(false);
  const [allComponents, setAllComponents] = useState<ComponentListItem[]>([]);
  const [loadedList, setLoadedList]     = useState(false);

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
    setSuggestions([]);
    setShowSugg(false);
    runTrace(c.id, c.name);
  };

  const runTrace = useCallback(async (compId?: string, compName?: string) => {
    let id = compId;
    if (!id) {
      const match = allComponents.find(
        (c) => c.name.toLowerCase() === query.toLowerCase() || c.id === query
      );
      if (!match) { setError("Component not found. Select from suggestions."); return; }
      id = match.id;
      compName = match.name;
    }

    setLoading(true);
    setError(null);
    setRan(false);

    try {
      let n: SupplyNode[] = [];
      let e: SupplyEdge[] = [];
      let count = 0;

      if (direction === "Upstream") {
        const traceRes = await getComponentTrace(id);
        const flat = flattenTrace(traceRes.trace);
        n = flat.nodes; e = flat.edges; count = flat.count;

      } else if (direction === "Downstream") {
        const affRes = await getComponentAffected(id);
        const flat = flattenAffected(affRes.root, affRes.affected);
        n = flat.nodes; e = flat.edges; count = n.length;

      } else {
        // Both: run upstream + downstream in parallel, merge
        const [traceRes, affRes] = await Promise.all([
          getComponentTrace(id),
          getComponentAffected(id),
        ]);
        const upFlat   = flattenTrace(traceRes.trace);
        const downFlat = flattenAffected(affRes.root, affRes.affected);

        const nodeMap = new Map<string, SupplyNode>();
        [...upFlat.nodes, ...downFlat.nodes].forEach((nd) => nodeMap.set(nd.id, nd));
        const edgeSet = new Set<string>();
        const allEdges: SupplyEdge[] = [];
        [...upFlat.edges, ...downFlat.edges].forEach((ed) => {
          const key = `${ed.from}->${ed.to}`;
          if (!edgeSet.has(key)) { edgeSet.add(key); allEdges.push(ed); }
        });
        n = Array.from(nodeMap.values());
        e = allEdges;
        count = n.length;
      }

      // Fetch risk for all nodes
      const infoMap: Record<string, NodeInfo> = {};
      await Promise.allSettled(
        n.map(async (node) => {
          try {
            const riskRes = await getComponentRisk(node.id);
            const risk = riskRes.risk;
            infoMap[node.id] = {
              name:        node.id === id ? (compName ?? query) : node.label,
              type:        node.sublabel,
              parentCount: risk.factors.parentCount,
              childCount:  risk.factors.childCount,
              risk:        risk.level as RiskLevel,
            };
            node.risk = risk.level.toLowerCase() as "low" | "medium" | "high";
          } catch {
            infoMap[node.id] = { name: node.label, type: node.sublabel, parentCount: 0, childCount: 0, risk: null };
          }
        })
      );

      setNodes(n);
      setEdges(e);
      setNodesWalked(count);
      setNodeInfo(infoMap);
      setTraceRoot(compName ?? query);
      setSelectedId(null);
      setRan(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trace failed");
    } finally {
      setLoading(false);
    }
  }, [allComponents, query, direction]);

  const onNodeClick = useCallback((id: string) => setSelectedId(id), []);
  const selected = selectedId ? nodeInfo[selectedId] : null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-950 lg:flex-row">

      {/* Graph area */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 sm:px-6">
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
                  placeholder="Search component name or ID…"
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
            <div className="flex items-center gap-2">
              <div className="relative">
                <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}
                  className="appearance-none rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 bg-white py-2 pl-3 pr-7 text-sm text-gray-700 outline-none hover:bg-gray-50 dark:hover:bg-gray-700">
                  {[1,2,3,4,5,6,7].map((d) => <option key={d} value={d}>Depth: {d} tiers</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
              <ActionButton variant="gradient" className="flex-shrink-0" onClick={() => runTrace()} disabled={loading || !query}>
                {loading ? "Running…" : "Run trace"}
              </ActionButton>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-500">{error}</p>
          )}
        </div>

        {/* Graph */}
        <div className="relative flex-1 bg-white dark:bg-gray-950">
          {!ran && !loading && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Search a component and click &quot;Run trace&quot; to visualize its lineage.</p>
            </div>
          )}
          {loading && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Tracing lineage…</p>
            </div>
          )}
          {ran && !loading && (
            <SupplyChainGraph nodes={nodes} edges={edges} variant="trace" selectedId={selectedId} onNodeClick={onNodeClick} legend={LEGEND} />
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-shrink-0 flex-col divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto lg:w-80 lg:border-l lg:border-t-0">

        <div className="px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Trace result</h2>
            {ran && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                ● COMPLETE
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            {[
              { label: "Origin",        value: traceRoot ?? "—" },
              { label: "Direction",     value: direction },
              { label: "Nodes walked",  value: ran ? String(nodesWalked) : "—", bold: true },
              { label: "Edges walked",  value: ran ? String(edges.length) : "—", bold: true },
            ].map(({ label, value, bold }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className={bold ? "font-semibold text-gray-900 dark:text-gray-200" : "text-gray-700 dark:text-gray-400"}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Selected node</h2>
          {selected && selectedId ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-200">
                  <span className="text-violet-600">{selectedId.slice(0, 8)}…</span> · {selected.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{selected.type}</p>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Risk</span>
                  {selected.risk ? <RiskBadge level={selected.risk} /> : <span className="text-xs text-gray-400">—</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Parents</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{selected.parentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Children</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{selected.childCount}</span>
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
