"use client";
import { useState } from "react";
import { Card, CardHead, CardTitle, CardBody, Badge, Stat } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import GraphView, { type GraphNode, type GraphEdge } from "@/components/graph/graph-view";

const AFFECTED = new Set(["SP-02", "CM-18", "CM-31", "AS-07", "AS-09", "PR-A"]);

export default function RecallPage() {
  const [active, setActive] = useState(true);
  const nodes: GraphNode[] = [
    ["SP-01","Lithium", 0], ["SP-02","Cobalt · DRC", 0], ["SP-03","Nickel", 0], ["SP-04","Graphite", 0],
    ["CM-18","Cathode B-18", 1], ["CM-24","Anode A-24", 1], ["CM-31","Cell NMC-811", 1],
    ["AS-07","Module M-7", 2], ["AS-09","Pack P-9", 2],
    ["PR-A","EV Pack A", 3],
  ].map(([id, sub, tier]) => ({
    id: id as string, label: id as string, sub: sub as string, tier: tier as number,
    risk: active && AFFECTED.has(id as string) ? "high" : "low",
  }));
  const edgePairs: [string, string][] = [
    ["SP-01","CM-18"],["SP-02","CM-18"],["SP-02","CM-31"],["SP-03","CM-31"],
    ["SP-04","CM-24"],["SP-01","CM-24"],["CM-18","AS-07"],["CM-24","AS-07"],
    ["CM-31","AS-09"],["CM-24","AS-09"],["AS-07","PR-A"],["AS-09","PR-A"],
  ];
  const edges: GraphEdge[] = edgePairs.map(([s, t]) => ({
    source: s, target: t, recall: active && AFFECTED.has(s) && AFFECTED.has(t),
  }));

  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Recall simulation</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">Flag a defective component. See the blast radius before you lift the phone.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setActive(false)}>↺ Reset</Button>
          <Button variant="primary" onClick={() => setActive(true)}>🚨 Trigger recall</Button>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <GraphView nodes={nodes} edges={edges} />
        <div>
          <Card className="mb-4">
            <CardHead><CardTitle>Blast radius</CardTitle>{active ? <Badge tone="danger">Active</Badge> : <Badge tone="accent">Nominal</Badge>}</CardHead>
            <CardBody className="grid gap-3">
              <Stat label="Affected units" value="3,412" delta="across 4 DCs" accentIdx={3} />
              <div className="grid gap-2 text-[12.5px]">
                <div className="flex justify-between"><span className="text-fg-muted">Downstream components</span><span className="font-mono">18</span></div>
                <div className="flex justify-between"><span className="text-fg-muted">Finished products</span><span className="font-mono">1 SKU</span></div>
                <div className="flex justify-between"><span className="text-fg-muted">Distribution centers</span><span className="font-mono">4</span></div>
                <div className="flex justify-between"><span className="text-fg-muted">Est. financial impact</span><span className="font-mono text-danger">$2.8M</span></div>
              </div>
            </CardBody>
          </Card>
          <Button variant="primary" className="w-full">Issue targeted recall →</Button>
        </div>
      </div>
    </div>
  );
}
