import { Card, CardHead, CardTitle, CardBody, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const KEYS = [
  { name: "Production ERP", key: "sk_live_8Jk…••••…9Qp", scope: "write:*", scopeTone: "accent", created: "Mar 14", last: "4m ago" },
  { name: "Analytics read-only", key: "sk_live_2pF…••••…mN3", scope: "read:*", scopeTone: "teal", created: "Mar 02", last: "1h ago" },
];

export default function ApiKeysPage() {
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">API keys</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">Use these to authenticate SDK calls from your ERP or backend.</p>
        </div>
        <Button variant="primary">+ Create key</Button>
      </div>
      <Card className="mb-4">
        <table className="w-full text-sm">
          <thead><tr className="bg-bg-elev-2/50">{["Name","Key","Scope","Created","Last used",""].map(h => (
            <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-wider text-fg-dim font-medium border-b border-border">{h}</th>
          ))}</tr></thead>
          <tbody>
            {KEYS.map(k => (
              <tr key={k.name} className="border-b border-border last:border-0">
                <td className="px-3.5 py-3">{k.name}</td>
                <td className="px-3.5 py-3 font-mono text-[11px]">{k.key} <Button size="sm" className="ml-2">Copy</Button></td>
                <td className="px-3.5 py-3"><Badge tone={k.scopeTone as any}>{k.scope}</Badge></td>
                <td className="px-3.5 py-3 text-fg-dim">{k.created}</td>
                <td className="px-3.5 py-3 text-fg-dim">{k.last}</td>
                <td className="px-3.5 py-3 text-right"><Button variant="danger" size="sm">Revoke</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <CardHead><CardTitle>Webhook endpoints</CardTitle></CardHead>
        <CardBody>
          <div className="flex justify-between items-center p-3 border border-border rounded-md">
            <div>
              <div className="font-mono text-[12.5px]">https://erp.meridian.ev/webhooks/sutara</div>
              <div className="text-fg-muted text-[11.5px] mt-0.5">component.created · link.created · recall.issued</div>
            </div>
            <Badge tone="accent">Active</Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
