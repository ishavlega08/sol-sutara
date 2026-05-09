import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function LinkPage() {
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Link components</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">Connect a parent component to a child. Writes to the on-chain graph.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHead><CardTitle>New link</CardTitle></CardHead>
          <CardBody>
            <div className="mb-4">
              <Label>Parent component (upstream)</Label>
              <div className="flex items-center gap-2 px-2.5 py-2 border border-border-strong bg-bg rounded-md text-sm">
                <Search className="w-3.5 h-3.5" /> SP-02 · Cobalt DRC batch 881
              </div>
            </div>
            <div className="text-center font-mono text-accent text-sm my-3">↓</div>
            <div className="mb-4">
              <Label>Child component (downstream)</Label>
              <div className="flex items-center gap-2 px-2.5 py-2 border border-border-strong bg-bg rounded-md text-sm">
                <Search className="w-3.5 h-3.5" /> CM-18 · Cathode B-18
              </div>
            </div>
            <div className="mb-4">
              <Label>Quantity / batch note (optional)</Label>
              <Input placeholder="1,200 kg · batch 881" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button className="flex-1">Cancel</Button>
              <Button variant="primary" className="flex-[2]">Confirm & sign on-chain →</Button>
            </div>
            <div className="mt-4 p-3 bg-bg border border-dashed border-border-strong rounded-md font-mono text-[11.5px] text-fg-muted">
              <div>› LINK SP-02 → CM-18</div>
              <div>› fee: ~$0.00025 · confirm: 400ms</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHead><CardTitle>Preview</CardTitle></CardHead>
          <CardBody>
            <p className="text-fg-muted text-sm">A new edge will be appended to the graph and signed by both orgs.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
