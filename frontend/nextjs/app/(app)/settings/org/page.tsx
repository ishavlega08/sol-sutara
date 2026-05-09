import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export default function OrgSettings() {
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="mb-6 pb-5 border-b border-border">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Organization</h1>
        <p className="text-fg-muted text-[13.5px] mt-1">General settings for Meridian EV</p>
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <Card>
          <CardHead><CardTitle>General</CardTitle></CardHead>
          <CardBody>
            <div className="mb-4"><Label>Organization name</Label><Input defaultValue="Meridian EV" /></div>
            <div className="mb-4"><Label>Organization ID</Label><Input className="font-mono" defaultValue="org:meridian" disabled /></div>
            <div className="mb-4"><Label>Owner wallet</Label><Input className="font-mono" defaultValue="8Jk2…p9Qp" disabled /></div>
            <div className="mb-4"><Label>Industry</Label><Select><option>Automotive / EV</option><option>Pharma</option></Select></div>
            <Button variant="primary" className="mt-2">Save changes</Button>
          </CardBody>
        </Card>
        <div>
          <Card className="mb-4">
            <CardHead><CardTitle>On-chain identity</CardTitle></CardHead>
            <CardBody className="text-[12.5px] grid gap-2">
              <div className="flex justify-between"><span className="text-fg-muted">Network</span><span className="font-mono">devnet</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">Program ID</span><span className="font-mono text-[11px]">SoLSu…9Pq4</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">Org PDA</span><span className="font-mono text-[11px]">4Jk8…p9Qp</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">RPC</span><span className="font-mono text-[11px]">RPC Fast</span></div>
            </CardBody>
          </Card>
          <Card className="border-danger/40">
            <CardHead><CardTitle className="text-danger">Danger zone</CardTitle></CardHead>
            <CardBody>
              <Button variant="danger" className="w-full">Delete organization</Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
