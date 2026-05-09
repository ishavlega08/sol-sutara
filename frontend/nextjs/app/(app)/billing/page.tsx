"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLANS, USAGE } from "@/lib/mock/dodo";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Plans & usage</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">You&apos;re on the <b>Starter</b> plan · renewing May 20, 2026</p>
        </div>
        <div className="flex gap-2">
          <Link href="/billing/invoices"><Button>View invoices</Button></Link>
          <Link href="/billing/checkout?plan=growth"><Button variant="primary">Upgrade plan →</Button></Link>
        </div>
      </div>

      <Card className="mb-4">
        <CardHead><CardTitle>Current usage · this billing period</CardTitle><span className="text-fg-dim font-mono text-[11px]">Apr 01 – Apr 30</span></CardHead>
        <CardBody className="grid grid-cols-3 gap-5">
          {[
            { label: "Component writes", ...USAGE.writes },
            { label: "Trace queries", ...USAGE.traces },
            { label: "Seats", ...USAGE.seats },
          ].map((u) => {
            const pct = Math.round((u.used / u.limit) * 100);
            return (
              <div key={u.label}>
                <div className="flex justify-between text-[12.5px] mb-2"><span className="text-fg-muted">{u.label}</span><span className="font-mono">{u.used.toLocaleString()} / {u.limit.toLocaleString()}</span></div>
                <div className="h-1.5 bg-bg-elev-2 rounded"><div className="h-full bg-gradient-to-r from-accent to-accent-4 rounded" style={{ width: `${pct}%` }} /></div>
                <div className="text-fg-muted text-[11.5px] mt-1.5">{u.rate}</div>
              </div>
            );
          })}
        </CardBody>
      </Card>

      <h3 className="font-display text-lg font-semibold mt-6 mb-3.5">Pick a plan</h3>
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div key={p.id} className={cn(
            "rounded-xl border bg-bg-elev p-6 relative",
            p.featured && "border-accent/50 bg-gradient-to-b from-accent/5 to-transparent"
          )}>
            {p.featured && <div className="absolute -top-2.5 left-5 font-mono text-[10px] tracking-wider px-2 py-0.5 bg-accent text-[#02180e] rounded-sm font-semibold">MOST POPULAR</div>}
            <div className="font-display text-lg font-semibold">{p.name}</div>
            <div className="font-display text-[40px] font-semibold tracking-tight my-2.5">
              {p.price === null ? "Custom" : <>${p.price}<span className="text-sm text-fg-muted font-medium">/{p.period}</span></>}
            </div>
            <div className="text-sm text-fg-muted mb-5">{p.description}</div>
            <ul className="list-none p-0 mb-6 space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="text-[13px] flex gap-2 items-start">
                  <Check className="w-3 h-3 mt-1 text-accent shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {p.id === "starter" ? (
              <Button className="w-full" disabled>Current plan</Button>
            ) : p.id === "growth" ? (
              <Link href="/billing/checkout?plan=growth"><Button variant="primary" className="w-full">Upgrade to Growth →</Button></Link>
            ) : (
              <Button className="w-full">Contact sales →</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
