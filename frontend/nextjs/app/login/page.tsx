"use client";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signIn, connectWallet } from "@/lib/mock/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  return (
    <main className="relative z-10 min-h-screen grid place-items-center p-10">
      <div className="w-full max-w-md bg-bg-elev border border-border rounded-[14px] p-9">
        <Link href="/" className="flex items-center gap-2.5 font-display font-semibold mb-7 whitespace-nowrap">
          <Logo /> Sol Sutara
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-1.5">Welcome back.</h1>
        <p className="text-sm text-fg-muted mb-6">Sign in to your organization&apos;s graph.</p>

        <div className="mb-4">
          <Label>Work email</Label>
          <Input type="email" defaultValue="ava@meridian.ev" />
        </div>
        <div className="mb-4">
          <Label>Password</Label>
          <Input type="password" defaultValue="••••••••••" />
          <div className="text-right mt-1.5"><a className="font-mono text-[11px] text-accent-4">Forgot?</a></div>
        </div>
        <Button variant="primary" size="lg" className="w-full" onClick={() => { setLoading(true); signIn(); }}>
          {loading ? "Signing in…" : "Sign in →"}
        </Button>

        <div className="flex items-center gap-3 my-4 text-fg-dim text-[11px] tracking-widest font-mono">
          <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
        </div>

        <Button variant="ghost" size="lg" className="w-full" onClick={async () => { await connectWallet(); signIn(); }}>
          Continue with wallet
        </Button>

        <p className="mt-6 text-center text-sm text-fg-muted">
          No account? <Link href="/signup" className="text-accent">Create organization</Link>
        </p>
      </div>
    </main>
  );
}
