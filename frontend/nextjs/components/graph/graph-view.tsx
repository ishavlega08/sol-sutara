"use client";
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge, MarkerType } from "reactflow";
import "reactflow/dist/style.css";

export type GraphNode = { id: string; label: string; sub?: string; risk?: "low" | "medium" | "high"; selected?: boolean; tier: number };
export type GraphEdge = { source: string; target: string; active?: boolean; recall?: boolean };

const riskColor = { low: "hsl(var(--accent))", medium: "hsl(var(--warn))", high: "hsl(var(--danger))" } as const;

function CustomNode({ data }: { data: GraphNode }) {
  const color = data.risk ? riskColor[data.risk] : "hsl(var(--fg-muted))";
  const selected = data.selected;
  return (
    <div
      className="rounded-md border bg-bg-elev px-3 py-2 min-w-[140px]"
      style={{
        borderColor: selected ? "hsl(var(--accent-2))" : color,
        borderWidth: selected ? 2 : 1,
        boxShadow: selected ? "0 0 10px hsl(var(--accent-2) / 0.45)" : data.risk === "high" ? `0 0 6px ${color}55` : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="font-mono text-[10px] text-fg">{data.label}</span>
      </div>
      {data.sub && <div className="font-mono text-[9px] text-fg-dim mt-0.5">{data.sub}</div>}
    </div>
  );
}

export default function GraphView({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const flowNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    type: "custom",
    data: n,
    position: { x: n.tier * 200, y: (nodes.filter(m => m.tier === n.tier).indexOf(n)) * 90 + 30 },
  }));
  const flowEdges: Edge[] = edges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    className: e.recall ? "recall" : e.active ? "animated" : "",
    animated: e.active || e.recall,
    markerEnd: { type: MarkerType.ArrowClosed, color: e.recall ? "hsl(var(--danger))" : e.active ? "hsl(var(--accent))" : "hsl(var(--border-strong))" },
    style: { stroke: e.recall ? "hsl(var(--danger))" : e.active ? "hsl(var(--accent))" : "hsl(var(--border-strong))" },
  }));

  return (
    <div className="h-[560px] bg-bg border border-border rounded-lg">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={{ custom: CustomNode }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--border))" gap={22} />
        <Controls />
        <MiniMap nodeColor={() => "hsl(var(--accent-2))"} maskColor="hsl(var(--bg) / 0.6)" />
      </ReactFlow>
    </div>
  );
}
