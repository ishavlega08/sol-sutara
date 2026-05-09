"use client";

import { useEffect, useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
  NodeTypes,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import Link from "next/link";
import {
  RefreshCw,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Loader2,
  ArrowDown,
} from "lucide-react";
import { getComponents, getComponentParents } from "@/lib/api";
import type { ComponentListItem } from "@/types/component";
import ComponentNode from "@/components/graph/ComponentNode";
import LaneLabelNode from "@/components/graph/LaneLabelNode";
import LaneDividerNode from "@/components/graph/LaneDividerNode";

// ── Type hierarchy ─────────────────────────────────────────────────────────────
// Top = finished output, Bottom = raw input. Y increases downward in ReactFlow.

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

const LANE_HEIGHT = 230;   // vertical space per type level
const NODE_Y_OFFSET = 72;  // top-of-lane → top-of-node (centers node in lane)
const NODE_W = 220;
const H_GAP = 90;

// ── Layout computation ────────────────────────────────────────────────────────

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
        position: {
          x: -330,
          y: lvl * LANE_HEIGHT + NODE_Y_OFFSET + 30, // vertically centred with nodes
        },
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

// ── ReactFlow node types ──────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  componentNode: ComponentNode,
  laneLabelNode: LaneLabelNode,
  laneDividerNode: LaneDividerNode,
};

// ── Page component ────────────────────────────────────────────────────────────

export default function GraphPage() {
  const [allComponents, setAllComponents] = useState<ComponentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [edgeCount, setEdgeCount] = useState(0);
  const [selected, setSelected] = useState<ComponentListItem | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelected(null);

    try {
      const compRes = await getComponents();
      const comps = compRes.components;
      setAllComponents(comps);

      const parentResults = await Promise.all(
        comps.map((c) =>
          getComponentParents(c.id)
            .then((r) => ({ id: c.id, parents: r.parents }))
            .catch(() => ({ id: c.id, parents: [] }))
        )
      );

      const edgeList = parentResults.flatMap(({ id: childId, parents }) =>
        parents.map((p) => ({ source: p.parent.id, target: childId, txHash: p.txHash }))
      );

      setEdgeCount(edgeList.length);

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

      const rfEdges: Edge[] = edgeList.map(({ source, target, txHash }) => ({
        id: `${source}-${target}`,
        source,
        target,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: "#94a3b8",
        },
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
        data: { txHash },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => { load(); }, [load]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "componentNode") {
      setSelected(node.data as ComponentListItem);
    }
  }, []);

  const handlePaneClick = useCallback(() => setSelected(null), []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3.5">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Supply Chain Graph</h1>
          <p className="text-xs text-gray-500">
            {loading
              ? "Building graph…"
              : error
              ? "Failed to load"
              : `${allComponents.length} components · ${edgeCount} link${edgeCount !== 1 ? "s" : ""} · type-based hierarchy`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Canvas */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Building graph…</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">{error}</p>
              <button
                onClick={load}
                className="text-sm font-medium text-gray-500 underline underline-offset-2 hover:text-gray-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && allComponents.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                <GitBranch className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No components yet</p>
              <Link
                href="/components/create"
                className="text-sm font-medium text-gray-500 underline underline-offset-2 hover:text-gray-800"
              >
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
          className="bg-gray-50"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#d1d5db"
          />

          <Controls
            className="!border-gray-200 !bg-white !shadow-sm"
            showInteractive={false}
          />

          <MiniMap
            nodeColor={(node) => {
              if (node.type !== "componentNode") return "transparent";
              const comp = node.data as ComponentListItem;
              return TYPE_STYLE[comp?.type]?.mm ?? DEFAULT_STYLE.mm;
            }}
            className="!border-gray-200 !bg-white"
            maskColor="rgba(249,250,251,0.6)"
          />

          {/* Hierarchy panel — always visible, top-right */}
          <Panel position="top-right">
            <div className="rounded-lg border border-gray-200 bg-white/95 px-3.5 py-3 shadow-sm backdrop-blur-sm">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Hierarchy
              </p>
              <div className="flex flex-col">
                {TYPE_ORDER.map((type, i) => {
                  const s = TYPE_STYLE[type];
                  return (
                    <div key={type} className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: s.dot }}
                        />
                        <span className="text-xs text-gray-600 whitespace-nowrap">{type}</span>
                      </div>
                      {i < TYPE_ORDER.length - 1 && (
                        <div className="ml-[3px] flex flex-col items-center">
                          <div className="h-2.5 w-px bg-gray-200" />
                          <ArrowDown className="h-2.5 w-2.5 text-gray-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        </ReactFlow>

        {selected && (
          <DetailPanel component={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  component,
  onClose,
}: {
  component: ComponentListItem;
  onClose: () => void;
}) {
  function truncate(str: string, start = 8, end = 6) {
    if (!str || str.length <= start + end + 3) return str;
    return `${str.slice(0, start)}…${str.slice(-end)}`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const s = TYPE_STYLE[component.type] ?? DEFAULT_STYLE;

  return (
    <div className="absolute right-0 top-0 z-10 flex h-full w-72 flex-col border-l border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Component Details
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <span
          className="inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold"
          style={{ color: s.dot, backgroundColor: s.bg, borderColor: s.border }}
        >
          {component.type}
        </span>
        <h2 className="mt-2 text-base font-semibold leading-snug text-gray-900">
          {component.name}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">{component.supplier}</p>

        <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-4">
          <Field label="On-Chain Address" value={truncate(component.on_chain_address ?? "")} full={component.on_chain_address ?? ""} mono />
          <Field label="Tx Hash" value={truncate(component.tx_hash ?? "")} full={component.tx_hash ?? ""} mono />
          <Field label="Metadata URI" value={truncate(component.metadata_uri, 20, 8)} full={component.metadata_uri} mono />
          <Field label="Created" value={formatDate(component.created_at)} />
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4">
          <a
            href={`https://explorer.solana.com/tx/${component.tx_hash}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on Solana Explorer
          </a>
          <Link
            href={`/components/${component.id}/parents?name=${encodeURIComponent(component.name)}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800"
          >
            <GitBranch className="h-3.5 w-3.5" />
            View parent components
            <ChevronRight className="ml-auto h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  full,
  mono,
}: {
  label: string;
  value: string;
  full?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span
        className={`break-all text-sm text-gray-700 ${mono ? "font-mono text-xs" : ""}`}
        title={full}
      >
        {value}
      </span>
    </div>
  );
}
