import { Card, CardHead, CardTitle, CardBody, Badge, Stat } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ACTIVITY, STATS } from "@/lib/mock/data";
import Link from "next/link";

export default function DashboardPage() {
  const maxAct = Math.max(...ACTIVITY);
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Good morning, Ava.</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">Here&apos;s your supply-chain graph at a glance. <span className="font-mono text-[11.5px] px-1.5 py-0.5 bg-bg-elev-2 border border-border rounded text-fg-muted">devnet · last sync 14s ago</span></p>
        </div>
        <div className="flex gap-2">
          <Button>↓ Export</Button>
          <Link href="/components"><Button variant="primary">+ Create component</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Components" value={STATS.components.toLocaleString()} unit="total" delta="↑ 142 this week" accentIdx={0} />
        <Stat label="Links" value={STATS.links.toLocaleString()} delta="↑ 318 this week" accentIdx={1} />
        <Stat label="Graph depth" value={STATS.depth} unit="tiers" delta="+1 vs last month" accentIdx={2} />
        <Stat label="High-risk nodes" value={STATS.highRisk} delta={<span className="text-danger">↑ 3 this week</span>} accentIdx={3} />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-4">
        <Card>
          <CardHead><CardTitle>Activity · last 14 days</CardTitle></CardHead>
          <CardBody>
            <div className="flex items-end gap-1 h-36 py-2.5">
              {ACTIVITY.map((v, i) => (
                <div key={i} className="flex-1 rounded-t-[3px] bg-gradient-to-b from-accent-2 to-accent min-h-[4px]" style={{ height: `${(v / maxAct) * 100}%` }} />
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHead><CardTitle>Risk overview</CardTitle><Link href="/analytics" className="font-mono text-[11px] text-accent-4">View all →</Link></CardHead>
          <CardBody className="flex flex-col gap-3">
            {[
              ["High", "12 nodes", 18, "danger"],
              ["Medium", "84 nodes", 42, "warn"],
              ["Low", "4,122 nodes", 100, "accent"],
            ].map(([label, count, pct, tone]) => (
              <div key={label as string} className="flex items-center justify-between gap-3 text-[12px]">
                <Badge tone={tone as any}>{label as string}</Badge>
                <span className="font-mono text-fg-muted">{count}</span>
                <div className="flex-1 h-1 bg-bg-elev-2 rounded-sm overflow-hidden">
                  <div className={`h-full bg-${tone}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHead><CardTitle>Recent activity</CardTitle></CardHead>
          <div className="text-sm">
            {[
              ["CREATE", "accent", "CM-31·NMC-811 created by org:kaldera", "2m"],
              ["LINK", "purple", "SP-02 → CM-18 linked", "8m"],
              ["RECALL", "danger", "Recall simulated on SP-02·b-881", "1h"],
              ["TRACE", "teal", "Trace PR-A · depth=6", "2h"],
              ["RISK", "coral", "AS-09 flagged MEDIUM", "3h"],
            ].map(([tag, tone, msg, when], i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                <Badge tone={tone as any}>{tag as string}</Badge>
                <span className="flex-1 text-[12.5px]">{msg as string}</span>
                <span className="text-[11px] text-fg-dim font-mono">{when as string}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead><CardTitle>Quick actions</CardTitle></CardHead>
          <CardBody className="grid grid-cols-2 gap-2.5">
            {[
              ["+ New component", "Register on-chain", "/components"],
              ["📦 Load sample data", "EV + Pharma + Food", "#"],
              ["🚨 Run recall demo", "Simulate blast radius", "/recall"],
              ["🔑 Get API key", "Integrate your ERP", "/settings/api-keys"],
            ].map(([t, s, href]) => (
              <Link key={t} href={href!}>
                <Button variant="ghost" className="w-full justify-start py-3.5 h-auto">
                  <div className="text-left">
                    <div className="font-semibold">{t}</div>
                    <div className="text-fg-muted text-[11.5px] mt-0.5 font-normal">{s}</div>
                  </div>
                </Button>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
