"use client";

// Shared React Flow supply chain graph — used by Trace + Recall pages.
// variant="trace"  → nodes colored by risk level, selected node highlighted violet
// variant="recall" → nodes colored by state (affected/propagating/unaffected)

import { useCallback } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { useTheme } from "@/context/ThemeContext";

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

// ── Color maps — light + dark ──────────────────────────────────────────────────

const RISK_BORDER: Record<RiskLevel, string>       = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };
const RISK_BG_LIGHT: Record<RiskLevel, string>     = { low: "#f0fdf4", medium: "#fffbeb", high: "#fef2f2" };
const RISK_BG_DARK:  Record<RiskLevel, string>     = { low: "#052e16", medium: "#1c1100", high: "#1c0505" };
const STATE_BORDER: Record<NodeState, string>      = { affected: "#ef4444", propagating: "#f59e0b", unaffected: "#4b5563" };
const STATE_BG_LIGHT: Record<NodeState, string>    = { affected: "#fef2f2", propagating: "#fffbeb", unaffected: "#f9fafb" };
const STATE_BG_DARK:  Record<NodeState, string>    = { affected: "#1c0505", propagating: "#1c1100", unaffected: "#1f2937" };
const STATE_DOT: Record<NodeState, string>         = { affected: "#ef4444", propagating: "#f59e0b", unaffected: "#6b7280" };

const TIER_X: Record<number, number> = { 1: 60, 2: 310, 3: 560, 4: 810 };

// ── Custom node ────────────────────────────────────────────────────────────────

type NodeData = {
  label: string;
  sublabel: string;
  risk?: RiskLevel;
  state?: NodeState;
  selected?: boolean;
  variant: "trace" | "recall";
  isDark: boolean;
};

function SupplyNode({ data }: { data: NodeData }) {
  let border: string, bg: string, dot: string;
  const textColor    = data.isDark ? "#e5e7eb" : "#111827";
  const subtextColor = data.isDark ? "#6b7280" : "#9ca3af";
  const handleColor  = data.isDark ? "#4b5563" : "#d1d5db";

  if (data.variant === "recall" && data.state) {
    border = STATE_BORDER[data.state];
    bg     = data.isDark ? STATE_BG_DARK[data.state] : STATE_BG_LIGHT[data.state];
    dot    = STATE_DOT[data.state];
  } else {
    if (data.selected) {
      border = "#7c3aed";
      bg     = data.isDark ? "#1e1035" : "#f5f3ff";
      dot    = "#7c3aed";
    } else {
      const r = data.risk ?? "low";
      border = RISK_BORDER[r];
      bg     = data.isDark ? RISK_BG_DARK[r] : RISK_BG_LIGHT[r];
      dot    = RISK_BORDER[r];
    }
  }

  return (
    <div style={{ border: `2px solid ${border}`, background: bg, borderRadius: 8, padding: "8px 14px", minWidth: 140, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
      <Handle type="target" position={Position.Left}  style={{ background: handleColor, width: 7, height: 7, border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: textColor, fontFamily: "monospace", letterSpacing: "-0.02em" }}>{data.label}</span>
      </div>
      <div style={{ fontSize: 10, color: subtextColor, marginTop: 3, paddingLeft: 13, fontWeight: 500 }}>{data.sublabel}</div>
      <Handle type="source" position={Position.Right} style={{ background: handleColor, width: 7, height: 7, border: "none" }} />
    </div>
  );
}

const NODE_TYPES = { supplyNode: SupplyNode };

// ── Layout builder — adaptive vertical spacing for dense graphs ────────────────

const NODE_GAP = 80;  // px between nodes in the same tier

function buildFlowNodes(
  nodes: SupplyNode[],
  selectedId: string | null | undefined,
  variant: "trace" | "recall",
  isDark: boolean,
): Node[] {
  const groups: Record<number, SupplyNode[]> = { 1: [], 2: [], 3: [], 4: [] };
  nodes.forEach((n) => groups[n.tier]?.push(n));

  // Find the tallest tier to centre all columns on the same midpoint
  const maxCount = Math.max(...Object.values(groups).map((g) => g.length), 1);
  const totalHeight = (maxCount - 1) * NODE_GAP;

  return nodes.map((n) => {
    const group = groups[n.tier];
    const idx   = group.findIndex((g) => g.id === n.id);
    const count = group.length;
    // Centre this tier's column relative to the tallest tier
    const tierHeight = (count - 1) * NODE_GAP;
    const yOffset    = (totalHeight - tierHeight) / 2;
    const y          = yOffset + idx * NODE_GAP + 60;

    return {
      id: n.id,
      position: { x: TIER_X[n.tier] ?? 60, y },
      data: { label: n.label, sublabel: n.sublabel, risk: n.risk, state: n.state, selected: n.id === selectedId, variant, isDark },
      type: "supplyNode",
    };
  });
}

function buildFlowEdges(edges: SupplyEdge[], variant: "trace" | "recall", isDark: boolean): Edge[] {
  return edges.map(({ from, to, highlighted }, i) => {
    const color = variant === "recall"
      ? (highlighted ? "#ef4444" : (isDark ? "#4b5563" : "#d1d5db"))
      : (isDark ? "#34d399" : "#6ee7b7");
    return {
      id: `e${i}`,
      source: from,
      target: to,
      type: "smoothstep",
      style: {
        stroke: color,
        strokeWidth: highlighted ? 2 : 1.5,
        strokeDasharray: (variant === "recall" && highlighted) || variant === "trace" ? "5 4" : undefined,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 10, height: 10 },
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export const TIER_LABELS = [
  { label: "SUPPLIER",  x: 60 },
  { label: "COMPONENT", x: 310 },
  { label: "ASSEMBLY",  x: 560 },
  { label: "PRODUCT",   x: 810 },
];

export default function SupplyChainGraph({
  nodes,
  edges,
  variant,
  selectedId,
  onNodeClick,
  legend,
}: SupplyChainGraphProps) {
  const { theme } = useTheme();
  const isDark    = theme === "dark";

  const flowNodes = buildFlowNodes(nodes, selectedId, variant, isDark);
  const flowEdges = buildFlowEdges(edges, variant, isDark);

  const handleNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    onNodeClick?.(node.id);
  }, [onNodeClick]);

  const bgColor   = isDark ? "#030712" : "#f9fafb";
  const dotColor  = isDark ? "#1f2937" : "#e5e7eb";

  return (
    <div className="relative h-full w-full" style={{ background: bgColor }}>
      {/* Tier column headers */}
      <div className="pointer-events-none absolute top-3 z-10 w-full">
        {TIER_LABELS.map(({ label, x }) => (
          <span
            key={label}
            className="absolute text-[10px] font-semibold uppercase tracking-widest"
            style={{ left: x + 8, color: isDark ? "#374151" : "#d1d5db" }}
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
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color={dotColor} gap={24} size={1.5} />
        <Controls
          showInteractive={false}
          className={isDark ? "!border-gray-700 !bg-gray-800 [&_button]:!text-gray-300 [&_button]:hover:!bg-gray-700" : ""}
        />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as NodeData;
            if (d.selected) return "#7c3aed";
            if (d.state)    return STATE_DOT[d.state];
            return RISK_BORDER[d.risk ?? "low"];
          }}
          maskColor={isDark ? "rgba(3,7,18,0.7)" : "rgba(249,250,251,0.7)"}
          style={{ background: isDark ? "#111827" : "#ffffff", border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}` }}
        />
      </ReactFlow>

      {/* Legend */}
      {legend && (
        <div className="pointer-events-none absolute bottom-16 left-4 flex flex-col gap-1.5 rounded-lg border px-3 py-2.5 shadow-sm"
          style={{ background: isDark ? "#111827" : "#ffffff", borderColor: isDark ? "#374151" : "#e5e7eb" }}>
          {legend.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px]" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
