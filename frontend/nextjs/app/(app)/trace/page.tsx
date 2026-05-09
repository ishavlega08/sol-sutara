"use client";
import { Card, CardHead, CardTitle, CardBody, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import GraphView, { type GraphNode, type GraphEdge } from "@/components/graph/graph-view";
import { useState } from "react";

const NODES: GraphNode[] = [
  { id: "SP-01", label: "SP-01", sub: "Lithium · Chile", risk: "low", tier: 0 },
  { id: "SP-02", label: "SP-02", sub: "Cobalt · DRC", risk: "high", tier: 0 },
  { id: "SP-03", label: "SP-03", sub: "Nickel · Indo", risk: "medium", tier: 0 },
  { id: "SP-04", label: "SP-04", sub: "Graphite · CN", risk: "low", tier: 0 },
  { id: "CM-18", label: "CM-18", sub: "Cathode · B-18", risk: "medium", tier: 1, selected: true },
  { id: "CM-24", label: "CM-24", sub: "Anode · A-24", risk: "low", tier: 1 },
  { id: "CM-31", label: "CM-31", sub: "Cell · NMC-811", risk: "low", tier: 1 },
  { id: "AS-07", label: "AS-07", sub: "Module · M-7", risk: "medium", tier: 2 },
  { id: "AS-09", label: "AS-09", sub: "Pack · P-9", risk: "medium", tier: 2 },
  { id: "PR-A", label: "PR-A", sub: "EV Pack · A", risk: "low", tier: 3 },
];
const EDGES: GraphEdge[] = [
  { source: "SP-01", target: "CM-18" }, { source: "SP-02", target: "CM-18", active: true },
  { source: "SP-02", target: "CM-31" }, { source: "SP-03", target: "CM-31" },
  { source: "SP-04", target: "CM-24" }, { source: "SP-01", target: "CM-24" },
  { source: "CM-18", target: "AS-07" }, { source: "CM-24", target: "AS-07" },
  { source: "CM-31", target: "AS-09" }, { source: "CM-24", target: "AS-09" },
  { source: "AS-07", target: "PR-A" }, { source: "AS-09", target: "PR-A" },
];

export default function TracePage() {
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Trace</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">Walk the lineage of any component, upstream or downstream.</p>
        </div>
        <div className="flex gap-2">
          <Button>↓ Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <GraphView nodes={NODES} edges={EDGES} />
        <div>
          <Card className="mb-4">
            <CardHead>
              <CardTitle>Trace result</CardTitle>
              <Badge tone="accent">Complete</Badge>
            </CardHead>
            <CardBody className="grid gap-2.5 text-[12.5px]">
              <div className="flex justify-between"><span className="text-fg-muted">Origin</span><span className="font-mono">PR-A</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">Direction</span><span>Upstream</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">Depth reached</span><span className="font-mono">7 tiers</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">Nodes walked</span><span className="font-mono">42</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">Organizations</span><span className="font-mono">4</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">Elapsed</span><span className="font-mono text-accent">&lt; 200ms</span></div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
