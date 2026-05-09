"use client";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { signIn } from "@/lib/mock/auth";

export default function OnboardingPage() {
  return (
    <main className="relative z-10 min-h-screen grid place-items-center p-10">
      <div className="w-full max-w-[520px] bg-bg-elev border border-border rounded-[14px] p-9">
        <div className="flex items-center gap-2.5 font-display font-semibold mb-7 whitespace-nowrap">
          <Logo /> Sol Sutara
          <span className="ml-auto font-mono text-[11px] text-fg-dim">STEP 1 / 2</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-1.5">Set up your organization.</h1>
        <p className="text-sm text-fg-muted mb-6">This is the root of your supply-chain graph. Invite teammates later.</p>

        <div className="mb-4">
          <Label>Organization name</Label>
          <Input placeholder="Meridian EV" />
          <div className="text-[11.5px] text-fg-muted mt-1">Displayed to suppliers and partners you link to.</div>
        </div>
        <div className="mb-4">
          <Label>Industry</Label>
          <Select>
            <option>Automotive / EV</option>
            <option>Pharmaceuticals / Biologics</option>
            <option>Food & Agriculture</option>
            <option>Electronics</option>
            <option>Aerospace</option>
            <option>Other</option>
          </Select>
        </div>
        <div className="mb-4">
          <Label>Solana wallet (optional)</Label>
          <Button variant="ghost" className="w-full">
            Connect wallet — <span className="text-fg-dim font-mono text-[11px] ml-1">you can do this later</span>
          </Button>
        </div>

        <div className="flex gap-2 mt-6">
          <Link href="/login" className="flex-1"><Button variant="ghost" className="w-full">Back</Button></Link>
          <Button variant="primary" className="flex-[2]" onClick={() => signIn()}>Create org & continue →</Button>
        </div>
      </div>
    </main>
  );
}
