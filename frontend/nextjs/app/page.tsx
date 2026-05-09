import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="relative z-10 min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold">
          <Logo /> Sol Sutara
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-fg-muted">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#usecase">Use case</a>
          <Link href="/billing">Pricing</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/signup"><Button variant="primary" size="sm">Get started →</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-20 pb-24 max-w-6xl mx-auto">
        <div className="font-mono text-xs tracking-widest text-accent uppercase mb-5">TRACEABILITY · ON SOLANA</div>
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] max-w-4xl">
          Every part, every handoff, <span className="text-accent">one graph.</span>
        </h1>
        <p className="text-lg text-fg-muted max-w-2xl mt-6 leading-relaxed">
          Sol Sutara threads raw materials, components, subassemblies, and finished goods into one tamper-proof on-chain graph — so you can trace origins, measure risk, and scope recalls in milliseconds.
        </p>
        <div className="flex flex-wrap gap-3 mt-10">
          <Link href="/signup"><Button variant="primary" size="lg">Start building →</Button></Link>
          <Link href="/dashboard"><Button variant="ghost" size="lg">See live dashboard</Button></Link>
        </div>
      </section>

      {/* Problem / Solution */}
      <section id="how" className="px-8 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <div className="font-mono text-xs tracking-widest text-accent-3 uppercase mb-4">THE PROBLEM</div>
            <h2 className="font-display text-3xl font-semibold mb-4">Supply chains are opaque paper trails.</h2>
            <p className="text-fg-muted leading-relaxed">
              Defective components hide behind 6 tiers of siloed ERPs and PDFs. Recalls take weeks. Origin claims can't be proven. Risk is invisible until it's a headline.
            </p>
          </div>
          <div>
            <div className="font-mono text-xs tracking-widest text-accent uppercase mb-4">THE SOLUTION</div>
            <h2 className="font-display text-3xl font-semibold mb-4">One graph. Signed by every org.</h2>
            <p className="text-fg-muted leading-relaxed">
              Every component is a compressed NFT. Every link is a cryptographic edge. The result: a graph you can traverse in milliseconds, audit across orgs, and trust because it's signed on-chain.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-semibold mb-12">Built for production supply chains.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { t: "Compressed NFTs", d: "Mint millions of component identities cheaply via Bubblegum." },
              { t: "Trace engine", d: "Upstream DFS walk with deep graph + multi-parent support." },
              { t: "Recall engine", d: "Reverse-traverse to get the blast radius before you lift the phone." },
              { t: "Risk scoring", d: "Dynamic LOW / MEDIUM / HIGH by depth, reuse, and single-source flags." },
              { t: "Multi-org", d: "Suppliers, manufacturers, distributors each sign their own edges." },
              { t: "Analytics", d: "Graph depth, reuse, and recall impact — surfaced in real time." },
            ].map((f) => (
              <div key={f.t} className="rounded-lg border border-border bg-bg-elev p-6 hover:border-border-strong transition">
                <div className="font-display font-semibold text-base mb-1.5">{f.t}</div>
                <div className="text-sm text-fg-muted">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="usecase" className="px-8 py-24 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-5">Own the graph.<br/><span className="text-accent-2">Not the chaos.</span></h2>
          <p className="text-fg-muted mb-8">14-day sandbox · no card required.</p>
          <Link href="/signup"><Button variant="primary" size="lg">Create organization →</Button></Link>
        </div>
      </section>

      <footer className="border-t border-border py-10 px-8 text-center text-xs text-fg-dim font-mono tracking-wider">
        © 2026 SOL SUTARA · BUILT ON SOLANA
      </footer>
    </main>
  );
}
