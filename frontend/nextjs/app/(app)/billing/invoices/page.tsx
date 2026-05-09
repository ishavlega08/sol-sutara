import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { INVOICES } from "@/lib/mock/dodo";

export default function InvoicesPage() {
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">All billing history for org:meridian</p>
        </div>
        <Button>↓ Download all</Button>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-elev-2/50">
              {["Invoice","Period","Plan","Amount","Method","Status",""].map(h => (
                <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-wider text-fg-dim font-medium border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map(i => (
              <tr key={i.id} className="border-b border-border last:border-0 hover:bg-bg-elev-2">
                <td className="px-3.5 py-3 font-mono">{i.id}</td>
                <td className="px-3.5 py-3">{i.period}</td>
                <td className="px-3.5 py-3">{i.plan}</td>
                <td className="px-3.5 py-3 font-mono">${i.amount.toFixed(2)}</td>
                <td className="px-3.5 py-3">{i.method}</td>
                <td className="px-3.5 py-3">{i.status === "paid" ? <Badge tone="accent">Paid</Badge> : <Badge tone="muted">Free</Badge>}</td>
                <td className="px-3.5 py-3 text-right"><Button size="sm">↓ PDF</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
