"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  return (
    <main className="relative z-10 min-h-screen grid place-items-center p-10">
      <div className="w-full max-w-md bg-bg-elev border border-border rounded-[14px] p-9">
        <Link href="/" className="flex items-center gap-2.5 font-display font-semibold mb-7 whitespace-nowrap">
          <Logo /> Sol Sutara
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-1.5">Create your account.</h1>
        <p className="text-sm text-fg-muted mb-6">14-day sandbox · no card required.</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><Label>Full name</Label><Input placeholder="Ava Patel" /></div>
          <div><Label>Work email</Label><Input type="email" placeholder="you@co.com" /></div>
        </div>
        <div className="mb-4">
          <Label>Password</Label>
          <Input type="password" placeholder="at least 12 characters" />
        </div>
        <Button variant="primary" size="lg" className="w-full" onClick={() => router.push("/onboarding")}>
          Create account →
        </Button>
        <p className="mt-4 text-center text-sm text-fg-muted">
          Already have one? <Link href="/login" className="text-accent">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
