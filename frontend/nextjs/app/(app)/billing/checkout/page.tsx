"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PLANS, createCheckout, type Plan } from "@/lib/mock/dodo";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = (params.get("plan") as Plan["id"]) || "growth";
  const plan = PLANS.find(p => p.id === planId)!;
  const [method, setMethod] = useState<"card" | "crypto">("card");
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    const res = await createCheckout({ planId: plan.id, method, email: "ava@meridian.ev" });
    setLoading(false);
    alert(`Dodo checkout ${res.id}: ${res.status}`);
    router.push("/billing/invoices");
  };

  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="mb-6 pb-5 border-b border-border">
        <Link href="/billing" className="text-fg-muted text-xs mb-2 inline-block">← Back to plans</Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-fg-muted text-[13.5px] mt-1">Upgrade to <b>{plan.name}</b> · ${plan.price} / month</p>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-6">
        <div>
          <Card className="mb-4">
            <CardHead><CardTitle>Payment method</CardTitle><span className="text-fg-dim font-mono text-[10px] tracking-wider">POWERED BY DODO</span></CardHead>
            <CardBody>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {(["card", "crypto"] as const).map((m) => (
                  <label key={m} className={cn(
                    "p-3.5 border rounded-lg cursor-pointer flex items-center gap-2.5",
                    method === m ? "border-accent bg-accent/5" : "border-border"
                  )}>
                    <input type="radio" checked={method === m} onChange={() => setMethod(m)} className="accent-[hsl(var(--accent))]" />
                    <div>
                      <div className="font-medium">{m === "card" ? "💳 Card · fiat" : "◎ Crypto"}</div>
                      <div className="text-fg-muted text-xs">{m === "card" ? "Visa, Mastercard, Amex" : "USDC, SOL on Solana"}</div>
                    </div>
                  </label>
                ))}
              </div>

              {method === "card" ? (
                <>
                  <div className="mb-4"><Label>Card number</Label><Input className="font-mono" placeholder="4242 4242 4242 4242" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Expiry</Label><Input className="font-mono" placeholder="MM / YY" /></div>
                    <div><Label>CVC</Label><Input className="font-mono" placeholder="123" /></div>
                  </div>
                  <div className="mt-4"><Label>Cardholder name</Label><Input placeholder="Ava Patel" /></div>
                </>
              ) : (
                <div className="p-4 rounded-md bg-bg border border-border-strong">
                  <div className="text-sm text-fg-muted mb-2">Send <span className="font-mono text-fg">${plan.price} USDC</span> to:</div>
                  <div className="font-mono text-xs text-accent break-all">8Jk2pFQpSuTaR4aPaYm9xY3zbK2nNp9Qp</div>
                  <div className="text-fg-dim text-[11px] mt-2 font-mono">Solana · USDC SPL</div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHead><CardTitle>Order summary</CardTitle></CardHead>
            <CardBody>
              <div className="flex justify-between mb-4 pb-3.5 border-b border-border">
                <div>
                  <div className="font-semibold">{plan.name} plan</div>
                  <div className="text-fg-muted text-xs mt-0.5">Billed monthly · cancel anytime</div>
                </div>
                <div className="font-mono text-sm">${plan.price}.00</div>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-fg-muted">Subtotal</span><span className="font-mono">${plan.price}.00</span></div>
                <div className="flex justify-between"><span className="text-fg-muted">Tax</span><span className="font-mono">$0.00</span></div>
                <div className="flex justify-between pt-2.5 border-t border-border mt-2"><span className="font-semibold">Due today</span><span className="font-display text-xl font-semibold">${plan.price}.00</span></div>
              </div>
              <Button variant="primary" size="lg" className="w-full mt-4" onClick={pay} disabled={loading}>
                {loading ? "Processing…" : `🔒 Pay $${plan.price}`}
              </Button>
              <div className="text-fg-dim font-mono text-[10px] tracking-wider text-center mt-3">SSL · PCI-DSS · POWERED BY DODO</div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
