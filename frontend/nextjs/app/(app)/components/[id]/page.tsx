import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHead, CardTitle, CardBody, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COMPONENTS, type Risk } from "@/lib/mock/data";

const toneFor: Record<Risk, "accent" | "warn" | "danger"> = { low: "accent", medium: "warn", high: "danger" };

export default function ComponentDetail({ params }: { params: { id: string } }) {
  const c = COMPONENTS.find((x) => x.id === params.id);
  if (!c) notFound();

  const ring = 314, offset = ring - (ring * c.riskScore) / 100;
  const ringColor = c.risk === "high" ? "hsl(var(--danger))" : c.risk === "medium" ? "hsl(var(--warn))" : "hsl(var(--accent))";

  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <Link href="/components" className="text-fg-muted text-xs mb-2 inline-block">← Components</Link>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            <span className="font-mono text-accent-2">{c.id}</span> · {c.name}
          </h1>
          <p className="text-fg-muted text-[13.5px] mt-1">
            {c.type} · <Badge tone={toneFor[c.risk]}>{c.risk.toUpperCase()} risk</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/recall"><Button>🚨 Simulate recall</Button></Link>
          <Link href="/trace"><Button variant="primary">View trace →</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <Card>
          <CardHead><CardTitle>Metadata</CardTitle></CardHead>
          <CardBody>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Component ID", c.id],
                  ["Type", c.type],
                  ["Owner org", c.org],
                  ["Metadata URI", c.metadataUri],
                  ["Metadata hash", c.metadataHash],
                  ["Compressed NFT", c.cnft],
                  ["Created", c.createdAt],
                  ["Tx signature", c.txSig],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-border last:border-0">
                    <td className="py-2.5 text-fg-muted w-40">{k}</td>
                    <td className="py-2.5 font-mono text-[12px]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <div>
          <Card>
            <CardHead><CardTitle>Risk score</CardTitle></CardHead>
            <CardBody className="flex flex-col items-center gap-4 py-6">
              <div className="relative w-[120px] h-[120px]">
                <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" stroke="hsl(var(--bg-elev-2))" />
                  <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" stroke={ringColor} strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={offset} />
                </svg>
                <div className="absolute inset-0 grid place-items-center font-display text-[28px] font-semibold" style={{ color: ringColor }}>{c.riskScore}</div>
              </div>
              <div className="font-mono text-[10px] tracking-widest text-fg-dim">{c.risk.toUpperCase()}</div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
