"use client";

// Shared React Flow supply chain graph — used by Trace + Recall pages.
// variant="trace"  → nodes colored by risk level, selected node highlighted violet
// variant="recall" → nodes colored by state (affected/propagating/unaffected)

import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeMouseHandler,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

// ── Types ──────────────────────────────────────────────────────────────────────

export type RiskLevel  = "low" | "medium" | "high";
export type NodeState  = "affected" | "propagating" | "unaffected";

export interface SupplyNode {
  id: string;
  label: string;
  sublabel: string;
  tier: 1 | 2 | 3 | 4;
  risk?: RiskLevel;
  state?: NodeState;
}

export interface SupplyEdge {
  from: string;
  to: string;
  highlighted?: boolean;
}

interface SupplyChainGraphProps {
  nodes: SupplyNode[];
  edges: SupplyEdge[];
  variant: "trace" | "recall";
  selectedId?: string | null;
  onNodeClick?: (id: string) => void;
  legend?: { color: string; label: string }[];
}

// ── Color maps ─────────────────────────────────────────────────────────────────

const RISK_BORDER: Record<RiskLevel, string>  = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };
const RISK_BG:     Record<RiskLevel, string>  = { low: "#f0fdf4", medium: "#fffbeb", high: "#fef2f2" };
const STATE_BORDER: Record<NodeState, string> = { affected: "#ef4444", propagating: "#f59e0b", unaffected: "#d1d5db" };
const STATE_BG:     Record<NodeState, string> = { affected: "#fef2f2", propagating: "#fffbeb", unaffected: "#ffffff" };
const STATE_DOT:    Record<NodeState, string> = { affected: "#ef4444", propagating: "#f59e0b", unaffected: "#9ca3af" };

const TIER_X: Record<number, number> = { 1: 60, 2: 280, 3: 500, 4: 720 };

// ── Custom node ────────────────────────────────────────────────────────────────

type NodeData = {
  label: string;
  sublabel: string;
  risk?: RiskLevel;
  state?: NodeState;
  selected?: boolean;
  variant: "trace" | "recall";
};

function SupplyNode({ data }: { data: NodeData }) {
  let border: string, bg: string, dot: string;

  if (data.variant === "recall" && data.state) {
    border = STATE_BORDER[data.state];
    bg     = STATE_BG[data.state];
    dot    = STATE_DOT[data.state];
  } else {
    // trace variant
    if (data.selected) {
      border = "#7c3aed"; bg = "#f5f3ff"; dot = "#7c3aed";
    } else {
      const r = data.risk ?? "low";
      border = RISK_BORDER[r]; bg = RISK_BG[r]; dot = RISK_BORDER[r];
    }
  }

  return (
    <div style={{ border: `2px solid ${border}`, background: bg, borderRadius: 8, padding: "8px 14px", minWidth: 130, cursor: "pointer" }}>
      <Handle type="target" position={Position.Left}  style={{ background: "#d1d5db", width: 6, height: 6 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>{data.label}</span>
      </div>
      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, paddingLeft: 11 }}>{data.sublabel}</div>
      <Handle type="source" position={Position.Right} style={{ background: "#d1d5db", width: 6, height: 6 }} />
    </div>
  );
}

const NODE_TYPES = { supplyNode: SupplyNode };

// ── Layout builder ────────────────────────────────────────────────────────────

function buildFlowNodes(nodes: SupplyNode[], selectedId: string | null | undefined, variant: "trace" | "recall"): Node[] {
  const groups: Record<number, SupplyNode[]> = { 1: [], 2: [], 3: [], 4: [] };
  nodes.forEach((n) => groups[n.tier]?.push(n));

  return nodes.map((n) => {
    const group = groups[n.tier];
    const idx   = group.findIndex((g) => g.id === n.id);
    const count = group.length;
    const y     = (idx - (count - 1) / 2) * 90 + 240;
    return {
      id: n.id,
      position: { x: TIER_X[n.tier] ?? 60, y },
      data: { label: n.label, sublabel: n.sublabel, risk: n.risk, state: n.state, selected: n.id === selectedId, variant },
      type: "supplyNode",
    };
  });
}

function buildFlowEdges(edges: SupplyEdge[], variant: "trace" | "recall"): Edge[] {
  return edges.map(({ from, to, highlighted }, i) => {
    const color = variant === "recall"
      ? (highlighted ? "#ef4444" : "#d1d5db")
      : "#6ee7b7";
    return {
      id: `e${i}`,
      source: from,
      target: to,
      type: "smoothstep",
      style: {
        stroke: color,
        strokeWidth: highlighted ? 1.5 : 1,
        strokeDasharray: (variant === "recall" && highlighted) || variant === "trace" ? "5 4" : undefined,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 10, height: 10 },
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export const TIER_LABELS = [
  { label: "SUPPLIER",  x: 60 },
  { label: "COMPONENT", x: 280 },
  { label: "ASSEMBLY",  x: 500 },
  { label: "PRODUCT",   x: 720 },
];

export default function SupplyChainGraph({
  nodes,
  edges,
  variant,
  selectedId,
  onNodeClick,
  legend,
}: SupplyChainGraphProps) {
  const flowNodes = buildFlowNodes(nodes, selectedId, variant);
  const flowEdges = buildFlowEdges(edges, variant);

  const handleNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    onNodeClick?.(node.id);
  }, [onNodeClick]);

  return (
    <div className="relative h-full w-full">
      {/* Tier column headers */}
      <div className="pointer-events-none absolute top-3 z-10 w-full">
        {TIER_LABELS.map(({ label, x }) => (
          <span
            key={label}
            className="absolute text-[10px] font-semibold uppercase tracking-widest text-gray-400"
            style={{ left: x + 8 }}
          >
            {label}
          </span>
        ))}
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={NODE_TYPES}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#f3f4f6" gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Legend */}
      {legend && (
        <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          {legend.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
