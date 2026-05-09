"use client";
import { Card, CardHead, CardTitle, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { COMPONENTS, type Risk } from "@/lib/mock/data";
import Link from "next/link";
import { Search } from "lucide-react";

const toneFor: Record<Risk, "accent" | "warn" | "danger"> = { low: "accent", medium: "warn", high: "danger" };
const label: Record<Risk, string> = { low: "Low", medium: "Medium", high: "High" };

export default function ComponentsPage() {
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Components</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">4,218 components across 3 industries · <span className="font-mono text-[11.5px] px-1.5 py-0.5 bg-bg-elev-2 border border-border rounded">org:meridian</span></p>
        </div>
        <div className="flex gap-2">
          <Button>↓ Export CSV</Button>
          <Button variant="primary">+ New component</Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 gap-2">
        <div className="flex gap-2 flex-1">
          <div className="flex items-center gap-2 px-2.5 py-1.5 border border-border rounded-md bg-bg-elev text-xs text-fg-muted min-w-[320px]">
            <Search className="w-3.5 h-3.5" /> Search by ID, name, or org…
          </div>
          <Select className="w-auto"><option>All industries</option><option>Automotive</option><option>Pharma</option><option>Food</option></Select>
          <Select className="w-auto"><option>All risk levels</option><option>High</option><option>Medium</option><option>Low</option></Select>
        </div>
      </div>

      <Card>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-bg-elev-2/50">
              {["ID", "Name", "Type", "Org", "Risk", "Parents", "Children", "Created", ""].map(h =>
                <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-wider text-fg-dim font-medium border-b border-border">{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {COMPONENTS.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg-elev-2 cursor-pointer">
                <td className="px-3.5 py-3 font-mono text-accent-2"><Link href={`/components/${c.id}`}>{c.id}</Link></td>
                <td className="px-3.5 py-3">{c.name}</td>
                <td className="px-3.5 py-3 text-fg-muted">{c.type}</td>
                <td className="px-3.5 py-3 font-mono text-fg-muted text-[11.5px]">{c.org}</td>
                <td className="px-3.5 py-3"><Badge tone={toneFor[c.risk]}>{label[c.risk]}</Badge></td>
                <td className="px-3.5 py-3 font-mono text-fg-muted">{c.parents.length}</td>
                <td className="px-3.5 py-3 font-mono text-fg-muted">{c.children.length}</td>
                <td className="px-3.5 py-3 text-fg-dim font-mono text-[11px]">{c.createdAt}</td>
                <td className="px-3.5 py-3 text-right"><Button size="sm">···</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
