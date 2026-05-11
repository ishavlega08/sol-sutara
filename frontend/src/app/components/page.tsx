"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
  NodeTypes,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Download,
  PlusCircle,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table2,
  Loader2,
  GitBranch,
  X,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Layers,
} from "lucide-react";
import { getComponents, getBatchRisk, getAllLinks } from "@/lib/api";
import type { ComponentListItem, ComponentRiskSummary, OrgLink } from "@/types/component";
import { RiskBadge, TypeBadge, OrgChip, type RiskLevel } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import ActionButton from "@/components/ui/ActionButton";
import { useRole } from "@/hooks/useRole";
import ComponentNode from "@/components/graph/ComponentNode";
import LaneLabelNode from "@/components/graph/LaneLabelNode";
import LaneDividerNode from "@/components/graph/LaneDividerNode";

// ── Type hierarchy ─────────────────────────────────────────────────────────────

const TYPE_ORDER = [
  "Finished Good",
  "Assembly",
  "Sub-assembly",
  "Component",
  "Raw Material",
] as const;

const TYPE_LEVEL: Record<string, number> = Object.fromEntries(
  TYPE_ORDER.map((type, i) => [type, i])
);

const TYPE_STYLE: Record<string, { dot: string; bg: string; border: string; mm: string }> = {
  "Finished Good": { dot: "#059669", bg: "#ecfdf5", border: "#6ee7b7", mm: "#6ee7b7" },
  "Assembly":      { dot: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", mm: "#ddd6fe" },
  "Sub-assembly":  { dot: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", mm: "#a5f3fc" },
  "Component":     { dot: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", mm: "#bfdbfe" },
  "Raw Material":  { dot: "#d97706", bg: "#fefce8", border: "#fde68a", mm: "#fde68a" },
};

const DEFAULT_STYLE = { dot: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", mm: "#e5e7eb" };

// ── Layout constants ──────────────────────────────────────────────────────────

const LANE_HEIGHT = 230;
const NODE_Y_OFFSET = 72;
const NODE_W = 220;
const H_GAP = 90;

function computeLayout(
  components: ComponentListItem[]
): Record<string, { x: number; y: number }> {
  const byLevel = new Map<number, ComponentListItem[]>();
  components.forEach((c) => {
    const lvl = TYPE_LEVEL[c.type] ?? 2;
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(c);
  });

  const positions: Record<string, { x: number; y: number }> = {};
  byLevel.forEach((comps, lvl) => {
    const totalWidth = comps.length * NODE_W + (comps.length - 1) * H_GAP;
    comps.forEach((c, i) => {
      positions[c.id] = {
        x: i * (NODE_W + H_GAP) - totalWidth / 2,
        y: lvl * LANE_HEIGHT + NODE_Y_OFFSET,
      };
    });
  });

  return positions;
}

function buildLaneNodes(components: ComponentListItem[]): Node[] {
  const presentTypes = new Set(components.map((c) => c.type));
  const presentLevels = [...new Set(
    components.map((c) => TYPE_LEVEL[c.type] ?? 2)
  )].sort((a, b) => a - b);

  const labelNodes: Node[] = TYPE_ORDER
    .filter((type) => presentTypes.has(type))
    .map((type) => {
      const lvl = TYPE_LEVEL[type];
      const s = TYPE_STYLE[type] ?? DEFAULT_STYLE;
      return {
        id: `lane-label-${type}`,
        type: "laneLabelNode",
        position: { x: -330, y: lvl * LANE_HEIGHT + NODE_Y_OFFSET + 30 },
        data: { label: type, dotColor: s.dot, bgColor: s.bg, borderColor: s.border },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: 0,
      };
    });

  const dividerNodes: Node[] = [];
  for (let i = 0; i < presentLevels.length - 1; i++) {
    const upper = presentLevels[i];
    const divY = upper * LANE_HEIGHT + LANE_HEIGHT;
    dividerNodes.push({
      id: `divider-${i}`,
      type: "laneDividerNode",
      position: { x: -500, y: divY },
      data: {},
      selectable: false,
      draggable: false,
      focusable: false,
      zIndex: -1,
    });
  }

  return [...labelNodes, ...dividerNodes];
}

const nodeTypes: NodeTypes = {
  componentNode: ComponentNode,
  laneLabelNode: LaneLabelNode,
  laneDividerNode: LaneDividerNode,
};

// ── Table helpers ─────────────────────────────────────────────────────────────

interface DisplayRow {
  id: string;
  name: string;
  type: string;
  org: string;
  risk: RiskLevel;
  created: string;
  txHash?: string;
}


function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {[30, 45, 40, 35, 25, 35].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 animate-pulse rounded bg-gray-100 dark:bg-gray-700" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

const PER_PAGE = 12;

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComponentsPage() {
  const [apiComponents, setApiComponents] = useState<ComponentListItem[]>([]);
  const [riskMap, setRiskMap]             = useState<Record<string, ComponentRiskSummary>>({});
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [search, setSearch]               = useState("");
  const [riskFilter, setRiskFilter]       = useState("All risk levels");
  const [viewMode, setViewMode]           = useState<"table" | "graph">("table");
  const [page, setPage]                   = useState(1);

  // Graph state
  const [graphLoading, setGraphLoading]   = useState(false);
  const [graphError, setGraphError]       = useState("");
  const [orgLinks, setOrgLinks]           = useState<OrgLink[]>([]);
  const [graphLoaded, setGraphLoaded]     = useState(false);
  const [selected, setSelected]           = useState<ComponentListItem | null>(null);
  const [nodes, setNodes, onNodesChange]  = useNodesState([]);
  const [edges, setEdges, onEdgesChange]  = useEdgesState([]);

  const { canCreate } = useRole();

  // ── Load table data ───────────────────────────────────────────────────────

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [compRes, riskRes] = await Promise.allSettled([getComponents(), getBatchRisk()]);
      if (compRes.status === "fulfilled") setApiComponents(compRes.value.components);
      if (riskRes.status === "fulfilled") {
        const map: Record<string, ComponentRiskSummary> = {};
        riskRes.value.risks.forEach((r) => { map[r.id] = r; });
        setRiskMap(map);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setGraphLoaded(false); // reset graph so it rebuilds if components changed
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Build graph ───────────────────────────────────────────────────────────

  const buildGraph = useCallback(async (comps: ComponentListItem[]) => {
    setGraphLoading(true);
    setGraphError("");
    setSelected(null);
    try {
      const linksRes = await getAllLinks();
      const links = linksRes.links;
      setOrgLinks(links);

      const positions = computeLayout(comps);
      const laneNodes = buildLaneNodes(comps);

      const rfNodes: Node[] = [
        ...laneNodes,
        ...comps.map((c) => ({
          id: c.id,
          type: "componentNode",
          position: positions[c.id] ?? { x: 0, y: 0 },
          data: c,
        })),
      ];

      const rfEdges: Edge[] = links.map((l) => ({
        id: `${l.parentId}-${l.childId}`,
        source: l.parentId,
        target: l.childId,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: "#94a3b8",
        },
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
        data: { txHash: l.txHash },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
      setGraphLoaded(true);
    } catch (e) {
      setGraphError(e instanceof Error ? e.message : "Failed to load graph");
    } finally {
      setGraphLoading(false);
    }
  }, [setNodes, setEdges]);

  // Trigger graph build when switching to graph mode
  useEffect(() => {
    if (viewMode === "graph" && !graphLoaded && !graphLoading && apiComponents.length > 0) {
      buildGraph(apiComponents);
    }
  }, [viewMode, graphLoaded, graphLoading, apiComponents, buildGraph]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "componentNode") setSelected(node.data as ComponentListItem);
  }, []);

  const handlePaneClick = useCallback(() => setSelected(null), []);

  // ── Table rows ────────────────────────────────────────────────────────────

  const rows: DisplayRow[] = apiComponents.length > 0
    ? apiComponents.map((c) => ({
        id:      c.id,
        name:    c.name,
        type:    c.type,
        org:     c.supplier ?? "—",
        risk:    (riskMap[c.id]?.level ?? "LOW") as RiskLevel,
        created: c.created_at.slice(0, 10),
        txHash:  c.tx_hash ?? undefined,
      }))
    : [];

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.org.toLowerCase().includes(q);
    const matchRisk   = riskFilter === "All risk levels" || r.risk === riskFilter.toUpperCase();
    return matchSearch && matchRisk;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <PageHeader
          title="Components"
          subtitle={
            <span>
              {apiComponents.length > 0 ? `${apiComponents.length} components` : "Loading…"}
            </span>
          }
          actions={
            <>
              <ActionButton variant="ghost" onClick={() => load(true)} disabled={loading || refreshing}>
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </ActionButton>
              <ActionButton variant="ghost">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </ActionButton>
              {canCreate && (
                <ActionButton variant="gradient" className="hidden sm:inline-flex">
                  <Link href="/components/create" className="flex items-center gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" />
                    New component
                  </Link>
                </ActionButton>
              )}
            </>
          }
        />

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search components, orgs…"
            className="w-full sm:w-64"
          />

          <div className="relative">
            <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              className="appearance-none rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 bg-white py-1.5 pl-3 pr-7 text-xs text-gray-600 outline-none hover:bg-gray-50 dark:hover:bg-gray-700">
              <option>All risk levels</option>
              <option>HIGH</option>
              <option>MEDIUM</option>
              <option>LOW</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="ml-auto flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5">
            {(["table", "graph"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition ${viewMode === m ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                {m === "table" ? <Table2 className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline capitalize">{m}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary bar — shown when there are enough components to need a quick overview */}
        {!loading && apiComponents.length >= 10 && (() => {
          const typeCounts = apiComponents.reduce<Record<string, number>>((acc, c) => {
            acc[c.type] = (acc[c.type] ?? 0) + 1; return acc;
          }, {});
          const riskCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
          Object.values(riskMap).forEach((r) => {
            const lvl = r.level?.toUpperCase() as keyof typeof riskCounts;
            if (lvl in riskCounts) riskCounts[lvl]++;
          });
          const highRisk = riskCounts.HIGH;
          const recentCount = apiComponents.filter((c) => {
            const d = new Date(c.created_at);
            return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
          }).length;

          return (
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex flex-wrap items-stretch divide-x divide-gray-100 dark:divide-gray-800">

                {/* Type breakdown */}
                <div className="flex-1 min-w-[180px] px-4 py-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">By type</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPE_ORDER.filter((t) => typeCounts[t]).map((t) => {
                      const s = TYPE_STYLE[t] ?? DEFAULT_STYLE;
                      return (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{ color: s.dot, background: s.bg, border: `1px solid ${s.border}` }}>
                          {typeCounts[t]} {t}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Risk breakdown */}
                <div className="flex-shrink-0 px-4 py-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Risk</p>
                  </div>
                  <div className="flex items-end gap-3">
                    {[
                      { label: "High",   count: riskCounts.HIGH,   color: "text-red-600 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-950/40" },
                      { label: "Medium", count: riskCounts.MEDIUM, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
                      { label: "Low",    count: riskCounts.LOW,    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
                    ].map(({ label, count, color, bg }) => (
                      <div key={label} className={`flex flex-col items-center rounded-lg px-3 py-1.5 ${bg}`}>
                        <span className={`text-lg font-bold tabular-nums leading-none ${color}`}>{count}</span>
                        <span className="mt-0.5 text-[10px] text-gray-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity */}
                <div className="flex-shrink-0 px-4 py-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Activity</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{apiComponents.length}</span>
                      <span className="text-xs text-gray-400">total</span>
                    </div>
                    {recentCount > 0 && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        +{recentCount} this week
                      </span>
                    )}
                    {highRisk > 0 && (
                      <span className="text-[11px] text-red-500 font-medium">
                        {highRisk} high-risk
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Graph view */}
        {viewMode === "graph" && (
          <div className="relative h-[600px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {graphLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-500">Building graph…</p>
                </div>
              </div>
            )}

            {graphError && !graphLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="text-sm font-medium text-red-600">{graphError}</p>
                  <button onClick={() => buildGraph(apiComponents)}
                    className="text-sm font-medium text-gray-500 underline underline-offset-2 hover:text-gray-800">
                    Try again
                  </button>
                </div>
              </div>
            )}

            {!graphLoading && !graphError && apiComponents.length === 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <GitBranch className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No components yet</p>
                  <Link href="/components/create"
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:text-gray-800 dark:hover:text-gray-200">
                    Create your first component
                  </Link>
                </div>
              </div>
            )}

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.15}
              maxZoom={2}
              className="bg-gray-50 dark:bg-gray-900"
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d1d5db" />
              <Controls className="!border-gray-200 !bg-white !shadow-sm" showInteractive={false} />
              <MiniMap
                nodeColor={(node) => {
                  if (node.type !== "componentNode") return "transparent";
                  const comp = node.data as ComponentListItem;
                  return TYPE_STYLE[comp?.type]?.mm ?? DEFAULT_STYLE.mm;
                }}
                className="!border-gray-200 !bg-white"
                maskColor="rgba(249,250,251,0.6)"
              />
            </ReactFlow>

            {/* Info bar */}
            <div className="absolute bottom-3 left-3 z-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 shadow-sm backdrop-blur-sm">
              {apiComponents.length} components · {orgLinks.length} link{orgLinks.length !== 1 ? "s" : ""}
            </div>

            {/* Selected node detail panel */}
            {selected && (
              <div className="absolute right-0 top-0 z-10 flex h-full w-64 flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Details</span>
                  <button onClick={() => setSelected(null)}
                    className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {(() => {
                    const s = TYPE_STYLE[selected.type] ?? DEFAULT_STYLE;
                    return (
                      <>
                        <span className="inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                          style={{ color: s.dot, backgroundColor: s.bg, borderColor: s.border }}>
                          {selected.type}
                        </span>
                        <h2 className="mt-2 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">{selected.name}</h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{selected.supplier}</p>
                        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800 pt-4 text-xs">
                          {selected.on_chain_address && (
                            <div>
                              <p className="font-semibold uppercase tracking-wide text-gray-400">On-Chain</p>
                              <p className="mt-0.5 break-all font-mono text-gray-700 dark:text-gray-300">{selected.on_chain_address.slice(0, 12)}…</p>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-gray-400">Created</p>
                            <p className="mt-0.5 text-gray-700 dark:text-gray-300">{selected.created_at.slice(0, 10)}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                          <a href={`https://explorer.solana.com/tx/${selected.tx_hash}?cluster=devnet`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            <ExternalLink className="h-3 w-3" />
                            Solana Explorer
                          </a>
                          <Link href={`/components/${selected.id}`}
                            className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            <GitBranch className="h-3 w-3" />
                            View component details
                          </Link>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table view */}
        {viewMode === "table" && (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left">
                      {["ID", "Name", "Type", "Org", "Risk", "Created"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                    {!loading && pageRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                          No components match your filters.
                        </td>
                      </tr>
                    )}

                    {!loading && pageRows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => window.location.href = `/components/${row.id}`}
                        className="cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-violet-600">{row.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900 dark:text-gray-200">{row.name}</span>
                        </td>
                        <td className="px-4 py-3"><TypeBadge type={row.type} /></td>
                        <td className="px-4 py-3"><OrgChip org={row.org} /></td>
                        <td className="px-4 py-3"><RiskBadge level={row.risk} /></td>
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{row.created}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!loading && filtered.length > 0 && (
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
                    <ChevronLeft className="h-3 w-3" />Prev
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
                    Next<ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
