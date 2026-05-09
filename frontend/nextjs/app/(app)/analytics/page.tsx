import { Card, CardHead, CardTitle, CardBody, Stat } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GROWTH } from "@/lib/mock/data";

export default function AnalyticsPage() {
  const max = Math.max(...GROWTH);
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">Graph-wide intelligence. Powered by the indexer.</p>
        </div>
        <Button>↓ Export</Button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Total components" value="4,218" delta="+ 482 (30d)" accentIdx={0} />
        <Stat label="Total links" value="9,844" delta="+ 1,204" accentIdx={1} />
        <Stat label="Avg graph depth" value="4.2" delta="+ 0.3" accentIdx={2} />
        <Stat label="Recall impact (avg)" value="812" unit="units" delta="+ 12%" accentIdx={3} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHead><CardTitle>Growth · components created</CardTitle></CardHead>
          <CardBody>
            <div className="flex items-end gap-1 h-36">
              {GROWTH.map((v, i) => (
                <div key={i} className="flex-1 rounded-t-[3px] bg-gradient-to-b from-accent-2 to-accent" style={{ height: `${(v / max) * 100}%` }} />
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHead><CardTitle>Most reused components</CardTitle></CardHead>
          <table className="w-full text-sm">
            <tbody>
              {[["SP-02","Cobalt · DRC","1,842"],["SP-01","Lithium · Chile","1,612"],["CM-31","Cell · NMC-811","984"],["SP-04","Graphite · CN","722"],["CM-18","Cathode B-18","418"]].map(([id, name, count]) => (
                <tr key={id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-mono">{id}</td>
                  <td className="px-4 py-2.5">{name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-fg-muted">reused in {count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
