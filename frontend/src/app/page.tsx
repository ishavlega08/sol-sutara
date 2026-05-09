"use client";

import Link from "next/link";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Is this another supply-chain blockchain that doesn't ship?",
    a: "Probably the right thing to ask. Difference: we're not selling a token. The product is a hosted graph + SDK. You pay in dollars (or USDC if you must). Solana is an implementation detail — you can use Sol Sutara without ever touching a wallet.",
  },
  {
    q: "Why not just use a Postgres + audit log?",
    a: "You can. But you can't make your suppliers sign rows in your database. The cryptography is what makes \u201ctier-3 said this\u201d actually verifiable instead of trusting your tier-1 to forward the truth. A central database belongs to one party; this graph doesn't.",
  },
  {
    q: "Does my whole supply chain need to be on it?",
    a: "No. Start with one tier-1 supplier and one product line. The graph grows where signatures grow. The parts you can't get signed are still recorded — just marked as unverified. Recall + audit work either way.",
  },
  {
    q: "What about IP-sensitive supply data?",
    a: "Component metadata can live off-chain (Shadow Drive, IPFS, your own S3). Only the hash and signature are public. The graph topology is opt-in — you can keep edges private to participating orgs only.",
  },
  {
    q: "How are you priced?",
    a: "$0 on devnet, free during build season. Production tiers start at $490/mo for 500k writes + 250k traces, or $0.0008 per write on top. Enterprise is custom — dedicated indexer + SAML. No tokens, no pre-sales.",
  },
  {
    q: "Who are you?",
    a: "A small team. Ex-Stripe, ex-Solana Labs, one person who spent eight years inside an automotive OEM's supplier-quality team. Building in public, hiring slowly, shipping every two weeks.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="lp">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header className="nav">
        <div className="wrap nav-inner">
          <Link className="brand" href="/">
            <span className="brand-mark" />
            <span>Sol Sutara</span>
            <em>· devnet</em>
          </Link>
          <nav className="nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Product</a>
            <a href="#why">Why Solana</a>
            <a href="#road">Roadmap</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="nav-cta">
            <Link className="btn btn-ghost" href="/login">Sign in</Link>
            <Link className="btn btn-primary" href="/login">Get devnet access →</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-band">
            <div className="left">Vol. I · Issue 04 · Apr 26</div>
            <div className="center">— building in public —</div>
            <div className="right"><span className="live">live · devnet</span></div>
          </div>

          <div className="hero-grid">
            <div>
              <h1>The supply chain,<br /><em>set in type.</em></h1>
              <div className="hero-cta">
                <Link className="btn btn-primary" href="/login">Open the sandbox →</Link>
                <a className="btn" href="#how">Read how it works</a>
              </div>
            </div>
            <div>
              <p className="hero-lede">
                One graph. Every part you ship — from raw to finished good —{" "}
                <b>signed by every supplier in line</b>, written to Solana, traceable in
                milliseconds. We&apos;re building it in the open. The sandbox is live.
              </p>
            </div>
          </div>

          <div className="hero-foot">
            <div className="item"><div className="k">Network</div><div className="v">Solana <small>devnet</small></div></div>
            <div className="item"><div className="k">Trace latency</div><div className="v tnum">41 <small>ms median</small></div></div>
            <div className="item"><div className="k">Per-write fee</div><div className="v tnum">$0.0008 <small>amortized</small></div></div>
            <div className="item"><div className="k">Status</div><div className="v">Pre-mainnet <small>· design partners only</small></div></div>
          </div>

          <div style={{ marginTop: 56 }}>
            <div className="hero-graph">
              <svg viewBox="0 0 1100 280" fill="none" aria-hidden="true">
                <defs>
                  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M0 0L10 5L0 10z" fill="currentColor" />
                  </marker>
                </defs>
                <g stroke="currentColor" strokeOpacity=".18" strokeDasharray="2 4">
                  <line x1="0" y1="46" x2="1100" y2="46" /><line x1="0" y1="120" x2="1100" y2="120" /><line x1="0" y1="194" x2="1100" y2="194" />
                </g>
                <g fill="var(--fg-3)" fontFamily="JetBrains Mono" fontSize="9.5" letterSpacing="1.4">
                  <text x="0" y="22">TIER 4 · RAW</text>
                  <text x="0" y="96">TIER 3 · COMPONENT</text>
                  <text x="0" y="170">TIER 2 · SUBASSEMBLY</text>
                  <text x="0" y="244">TIER 1 · PRODUCT</text>
                </g>
                {/* raw */}
                <g>
                  <circle cx="160" cy="46" r="6" fill="var(--rust)" /><text x="160" y="32" fontFamily="Geist" fontWeight="500" fontSize="11" textAnchor="middle" fill="var(--fg-2)">Lithium · Chile</text>
                  <circle cx="340" cy="46" r="6" fill="var(--rust)" /><text x="340" y="32" fontFamily="Geist" fontWeight="500" fontSize="11" textAnchor="middle" fill="var(--fg-2)">Cobalt · DRC</text>
                  <circle cx="560" cy="46" r="6" fill="var(--rust)" /><text x="560" y="32" fontFamily="Geist" fontWeight="500" fontSize="11" textAnchor="middle" fill="var(--fg-2)">Nickel · ID</text>
                  <circle cx="780" cy="46" r="6" fill="var(--rust)" /><text x="780" y="32" fontFamily="Geist" fontWeight="500" fontSize="11" textAnchor="middle" fill="var(--fg-2)">Graphite · CN</text>
                  <circle cx="960" cy="46" r="6" fill="var(--rust)" /><text x="960" y="32" fontFamily="Geist" fontWeight="500" fontSize="11" textAnchor="middle" fill="var(--fg-2)">Copper · CL</text>
                </g>
                {/* components */}
                <g>
                  <rect x="220" y="106" width="80" height="28" rx="3" fill="var(--ink-3)" stroke="var(--aqua)" strokeWidth="1.4" /><text x="260" y="124" fontFamily="JetBrains Mono" fontSize="10.5" textAnchor="middle" fill="var(--fg)">CM-18</text>
                  <rect x="500" y="106" width="80" height="28" rx="3" fill="var(--ink-3)" stroke="var(--aqua)" strokeWidth="1.4" /><text x="540" y="124" fontFamily="JetBrains Mono" fontSize="10.5" textAnchor="middle" fill="var(--fg)">CM-31</text>
                  <rect x="720" y="106" width="80" height="28" rx="3" fill="var(--ink-3)" stroke="var(--aqua)" strokeWidth="1.4" /><text x="760" y="124" fontFamily="JetBrains Mono" fontSize="10.5" textAnchor="middle" fill="var(--fg)">CM-24</text>
                </g>
                {/* subassembly */}
                <g>
                  <rect x="320" y="180" width="80" height="28" rx="3" fill="var(--ink-3)" stroke="var(--amber)" strokeWidth="1.4" /><text x="360" y="198" fontFamily="JetBrains Mono" fontSize="10.5" textAnchor="middle" fill="var(--fg)">AS-07</text>
                  <rect x="600" y="180" width="80" height="28" rx="3" fill="var(--ink-3)" stroke="var(--amber)" strokeWidth="1.4" /><text x="640" y="198" fontFamily="JetBrains Mono" fontSize="10.5" textAnchor="middle" fill="var(--fg)">AS-09</text>
                  <rect x="800" y="180" width="80" height="28" rx="3" fill="var(--ink-3)" stroke="var(--amber)" strokeWidth="1.4" /><text x="840" y="198" fontFamily="JetBrains Mono" fontSize="10.5" textAnchor="middle" fill="var(--fg)">AS-12</text>
                </g>
                {/* product */}
                <g>
                  <rect x="460" y="252" width="120" height="22" rx="3" fill="var(--teal)" /><text x="520" y="267" fontFamily="JetBrains Mono" fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#02180e">PR-A · EV PACK</text>
                </g>
                {/* edges */}
                <g className="gedge">
                  <path d="M340 46 C 340 80, 540 80, 540 106" markerEnd="url(#arr)" />
                  <path d="M560 46 C 560 80, 540 80, 540 106" markerEnd="url(#arr)" />
                  <path d="M780 46 C 780 80, 760 80, 760 106" markerEnd="url(#arr)" />
                  <path d="M960 46 C 960 80, 760 80, 760 106" markerEnd="url(#arr)" />
                  <path d="M260 134 C 260 156, 360 156, 360 180" markerEnd="url(#arr)" />
                  <path d="M540 134 C 540 156, 640 156, 640 180" markerEnd="url(#arr)" />
                  <path d="M540 134 C 540 156, 840 156, 840 180" markerEnd="url(#arr)" />
                  <path d="M760 134 C 760 156, 840 156, 840 180" markerEnd="url(#arr)" />
                  <path d="M360 208 C 360 232, 520 232, 520 252" markerEnd="url(#arr)" />
                  <path d="M640 208 C 640 232, 520 232, 520 252" markerEnd="url(#arr)" />
                  <path d="M840 208 C 840 232, 520 232, 520 252" markerEnd="url(#arr)" />
                </g>
                {/* live trace */}
                <g className="gedge live">
                  <path d="M520 252 C 520 232, 360 232, 360 208" />
                  <path d="M360 208 C 360 156, 260 156, 260 134" />
                  <path d="M260 134 C 260 80, 160 80, 160 52" />
                </g>
                {/* annotation */}
                <g>
                  <line x1="160" y1="60" x2="100" y2="84" stroke="var(--teal)" strokeOpacity=".5" strokeWidth="1" />
                  <text x="98" y="100" fontFamily="Geist" fontWeight="500" fontSize="11.5" fill="var(--teal)" textAnchor="end">↑ depth 4 · 41 ms</text>
                </g>
              </svg>
              <div className="cap"><b>The graph,</b> live — every part you ship traced back to the salar it came from. Each edge is a signature from the org one tier up. None of this lives in your ERP.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────── */}
      <section className="sec" id="problem">
        <div className="wrap">
          <div className="sec-head">
            <h2>The supply chain<br /><em>has no memory.</em></h2>
            <div className="kicker">
              <p className="eyebrow">The problem</p>
              <p>Every recall is an archaeology project. Every audit is a spreadsheet rodeo. Every claim of &ldquo;ethically sourced&rdquo; is <b>somebody&apos;s word</b>, attached to a PDF, attached to an email — until it isn&apos;t.</p>
              <p>We&apos;ve shipped supply chains for forty years on the assumption that paper trails would scale. They didn&apos;t.</p>
            </div>
          </div>
          <div className="three-col">
            <div className="col">
              <div className="num">i.</div>
              <h3>Trust is a phone call.</h3>
              <p>You get a notice from a tier-1 supplier. They got it from tier-2. Tier-2&apos;s emailing tier-3. By the time the recall lands in customer hands, you&apos;ve burned a week on the phone.</p>
              <div className="quote">— &ldquo;Three days of incident response is a Tuesday.&rdquo; — head of QA, EV OEM</div>
            </div>
            <div className="col">
              <div className="num">ii.</div>
              <h3>Provenance is a PDF.</h3>
              <p>&ldquo;Conflict-free cobalt.&rdquo; &ldquo;Organic.&rdquo; &ldquo;Single-origin.&rdquo; The certificate is real. Whether it tracks the actual lot in your warehouse — that&apos;s a different question, and nobody can answer it in seconds.</p>
              <div className="quote">— Buyers will pay <b style={{ color: "var(--fg)" }}>17%</b> more for verifiable origin (McKinsey, &lsquo;24).</div>
            </div>
            <div className="col">
              <div className="num">iii.</div>
              <h3>Audits are theatre.</h3>
              <p>Once a year, an auditor flies in, samples 4% of records, signs off, leaves. The other 96% is goodwill. Regulators are catching up — DPP in EU, FSMA 204 in US — and goodwill won&apos;t pass.</p>
              <div className="quote">— EU Digital Product Passport: mandatory for batteries <b style={{ color: "var(--fg)" }}>Feb 2027</b>.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="sec" id="how">
        <div className="wrap">
          <div className="sec-head">
            <h2>One graph.<br /><em>Every signature.</em></h2>
            <div className="kicker">
              <p className="eyebrow">How it works</p>
              <p>Sol Sutara turns each component into a compressed NFT on Solana. Each parent–child link is a co-signed edge. Trace runs against an indexed graph — not a chain walk — so a lookup that takes hours in your ERP takes <b>tens of milliseconds</b> here.</p>
            </div>
          </div>
          <div className="steps">
            <div>
              {[
                { n: "01", h: "Register a part.", p: <span>Mint a compressed NFT for any raw, component, subassembly, or finished good. <code>POST /components</code> from your ERP, or use the dashboard. Costs a fraction of a cent on Solana.</span> },
                { n: "02", h: "Link parts together.", p: "When supplier and buyer both confirm a parent–child relationship, the edge is co-signed and committed. Two signatures, one immutable record." },
                { n: "03", h: "Trace upstream — or down.", p: <span>Pick any node. We walk the graph in both directions, returning every parent and child, with org signatures intact. Median <code>41 ms</code> in our sandbox.</span> },
                { n: "04", h: "Recall, surgically.", p: "Tag a contaminated lot. Every downstream child resolves automatically. Notifications go on-chain to every affected org. No phone trees." },
              ].map((s) => (
                <div key={s.n} className="step">
                  <div className="n">{s.n}</div>
                  <div className="b"><h4>{s.h}</h4><p>{s.p}</p></div>
                </div>
              ))}
            </div>
            <aside className="steps-aside">
              <div className="eyebrow">A trace, in flight</div>
              <svg viewBox="0 0 460 320" fill="none">
                <defs>
                  <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M0 0L10 5L0 10z" fill="var(--teal)" />
                  </marker>
                </defs>
                <g stroke="currentColor" strokeOpacity=".15" strokeDasharray="2 4">
                  <line x1="0" y1="40" x2="460" y2="40" /><line x1="0" y1="130" x2="460" y2="130" /><line x1="0" y1="220" x2="460" y2="220" /><line x1="0" y1="290" x2="460" y2="290" />
                </g>
                <g fill="var(--fg-3)" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="1.2">
                  <text x="0" y="18">RAW</text><text x="0" y="108">COMPONENT</text><text x="0" y="198">SUBASSEMBLY</text><text x="0" y="268">PRODUCT</text>
                </g>
                <g>
                  <circle cx="100" cy="40" r="6" fill="var(--rust)" /><circle cx="240" cy="40" r="6" fill="var(--rust)" /><circle cx="380" cy="40" r="6" fill="var(--rust)" />
                </g>
                <g>
                  <rect x="60" y="116" width="80" height="28" rx="3" fill="var(--ink)" stroke="var(--aqua)" strokeWidth="1.4" /><text x="100" y="134" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" fill="var(--fg)">CM-18</text>
                  <rect x="200" y="116" width="80" height="28" rx="3" fill="var(--ink)" stroke="var(--aqua)" strokeWidth="1.4" /><text x="240" y="134" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" fill="var(--fg)">CM-31</text>
                  <rect x="340" y="116" width="80" height="28" rx="3" fill="var(--ink)" stroke="var(--aqua)" strokeWidth="1.4" /><text x="380" y="134" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" fill="var(--fg)">CM-24</text>
                </g>
                <g>
                  <rect x="120" y="206" width="80" height="28" rx="3" fill="var(--ink)" stroke="var(--amber)" strokeWidth="1.4" /><text x="160" y="224" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" fill="var(--fg)">AS-07</text>
                  <rect x="280" y="206" width="80" height="28" rx="3" fill="var(--ink)" stroke="var(--amber)" strokeWidth="1.4" /><text x="320" y="224" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" fill="var(--fg)">AS-09</text>
                </g>
                <rect x="180" y="280" width="120" height="22" rx="3" fill="var(--teal)" /><text x="240" y="295" fontFamily="JetBrains Mono" fontSize="11" fontWeight="700" textAnchor="middle" fill="#02180e">PR-A</text>
                <g className="gedge">
                  <path d="M100 40 C 100 80, 100 80, 100 116" markerEnd="url(#arr2)" />
                  <path d="M240 40 C 240 80, 240 80, 240 116" markerEnd="url(#arr2)" />
                  <path d="M380 40 C 380 80, 380 80, 380 116" markerEnd="url(#arr2)" />
                  <path d="M100 144 C 100 175, 160 175, 160 206" markerEnd="url(#arr2)" />
                  <path d="M240 144 C 240 175, 160 175, 160 206" markerEnd="url(#arr2)" />
                  <path d="M240 144 C 240 175, 320 175, 320 206" markerEnd="url(#arr2)" />
                  <path d="M380 144 C 380 175, 320 175, 320 206" markerEnd="url(#arr2)" />
                  <path d="M160 234 C 160 256, 240 256, 240 280" markerEnd="url(#arr2)" />
                  <path d="M320 234 C 320 256, 240 256, 240 280" markerEnd="url(#arr2)" />
                </g>
                <g className="gedge live">
                  <path d="M240 280 C 240 256, 160 256, 160 234" />
                  <path d="M160 234 C 160 175, 100 175, 100 144" />
                  <path d="M100 116 C 100 80, 100 80, 100 46" />
                </g>
                <g>
                  <line x1="100" y1="60" x2="34" y2="86" stroke="var(--teal)" strokeOpacity=".4" />
                  <text x="32" y="100" fontFamily="Geist" fontWeight="500" fontSize="11" fill="var(--teal)" textAnchor="end">41 ms</text>
                </g>
              </svg>
              <div className="cap">A finished EV pack, traced back to the Chilean salar. Nine nodes. Ten edges. <b>One query.</b></div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FEATURES (BENTO) ─────────────────────────────────────────────── */}
      <section className="sec" id="features">
        <div className="wrap">
          <div className="sec-head">
            <h2>Built for the<br /><em>way you actually ship.</em></h2>
            <div className="kicker">
              <p className="eyebrow">The product</p>
              <p>An ERP-shaped surface on top of Solana — components, links, traces, recalls, audit-grade exports. The chain is the substrate, not the UI.</p>
            </div>
          </div>
          <div className="bento">
            <div className="tile feat-mint span-3">
              <div className="tile-tag">01 · Mint</div>
              <h4>Compressed NFTs. <em>Per part.</em></h4>
              <p>Every component is a compressed NFT. Cheap to mint, cheap to query, signed by your org&apos;s wallet. Metadata lives on Shadow Drive or IPFS — you choose.</p>
              <div className="tile-foot">
                <div className="code">
                  <span className="c">{"// register a part"}</span>{"\n"}
                  <span className="k">await</span>{" sutara."}<span className="v">components</span>{".create({\n  id: "}<span className="s">{'"CM-18"'}</span>{",\n  name: "}<span className="s">{'"Cathode B-18, NMC-881"'}</span>{",\n  type: "}<span className="s">{'"Component"'}</span>{",\n})"}
                </div>
              </div>
            </div>
            <div className="tile feat-trace span-3">
              <div className="tile-tag">02 · Trace</div>
              <h4>One query. <em>Whole graph.</em></h4>
              <p>Indexed parent–child relationships. Walk upstream, downstream, or both — <code style={{ fontFamily: "var(--mono)", color: "var(--aqua)", fontSize: 12 }}>trace.upstream(id, {"{ depth: 7 }"})</code>. Median 41 ms in sandbox.</p>
              <div className="tile-foot">
                <svg viewBox="0 0 360 110" fill="none">
                  <g stroke="var(--line)" strokeDasharray="2 4"><line x1="0" y1="20" x2="360" y2="20" /><line x1="0" y1="60" x2="360" y2="60" /><line x1="0" y1="100" x2="360" y2="100" /></g>
                  <g>
                    <circle cx="60" cy="20" r="5" fill="var(--rust)" /><circle cx="180" cy="20" r="5" fill="var(--rust)" /><circle cx="300" cy="20" r="5" fill="var(--rust)" />
                    <rect x="100" y="50" width="60" height="20" rx="3" fill="var(--ink-3)" stroke="var(--aqua)" strokeWidth="1.3" />
                    <rect x="220" y="50" width="60" height="20" rx="3" fill="var(--ink-3)" stroke="var(--aqua)" strokeWidth="1.3" />
                    <rect x="160" y="92" width="60" height="14" rx="3" fill="var(--teal)" />
                  </g>
                  <g className="gedge live">
                    <path d="M190 92 C 190 80, 130 80, 130 70" />
                    <path d="M130 50 C 130 30, 60 30, 60 26" />
                  </g>
                  <g className="gedge">
                    <path d="M180 26 C 180 30, 130 30, 130 50" />
                    <path d="M300 26 C 300 30, 250 30, 250 50" />
                    <path d="M130 70 C 130 80, 190 80, 190 92" />
                    <path d="M250 70 C 250 80, 190 80, 190 92" />
                  </g>
                </svg>
              </div>
            </div>
            <div className="tile feat-recall span-2">
              <div className="tile-tag" style={{ color: "var(--crimson)" }}>03 · Recall</div>
              <h4>Blast radius, <em>before you announce.</em></h4>
              <p>Tag a contaminated lot. We resolve every downstream child and quote you the cost before a single notification ships.</p>
            </div>
            <div className="tile feat-risk span-2">
              <div className="tile-tag">04 · Risk score</div>
              <h4>0–100, <em>per node.</em></h4>
              <p>Single-source raw materials, geographies under sanctions, suppliers without recent signatures — all factored. The dashboard sorts by risk by default.</p>
              <div className="tile-foot" style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                {[{ c: "var(--teal)", l: "LOW · 4,122" }, { c: "var(--amber)", l: "MED · 84" }, { c: "var(--crimson)", l: "HIGH · 12" }].map((r) => (
                  <span key={r.l} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.c, flexShrink: 0 }} />
                    <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)", letterSpacing: "0.06em" }}>{r.l}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="tile feat-sdk span-2">
              <div className="tile-tag">05 · SDK</div>
              <h4>One npm install. <em>That&apos;s the integration.</em></h4>
              <p>TypeScript-first SDK. Wallet, signer, indexer, retries, batching — handled. ERP webhooks first-class.</p>
              <div className="tile-foot">
                <code style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--aqua)", background: "var(--ink)", padding: "4px 8px", border: "1px solid var(--line)", borderRadius: 3 }}>
                  $ npm i @sutara/sdk
                </code>
              </div>
            </div>
            <div className="tile span-3" style={{ background: "var(--ink-2)" }}>
              <div className="tile-tag">06 · Audit-grade exports</div>
              <h4>PDF the regulator <em>actually accepts.</em></h4>
              <p>One click on any product → a sealed PDF with every signature, every tx hash, every metadata URI in the chain. Designed against EU DPP and FSMA 204 requirements.</p>
            </div>
            <div className="tile span-3">
              <div className="tile-tag">07 · Multi-org by design</div>
              <h4>Your suppliers <em>sign with you.</em></h4>
              <p>Edges require co-signature. No &ldquo;we got the data from them&rdquo; hand-waving — both orgs sign or the edge doesn&apos;t exist. The cryptography is the contract.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY SOLANA ───────────────────────────────────────────────────── */}
      <section className="sec" id="why">
        <div className="wrap">
          <div className="sec-head">
            <h2>Why Solana?<br /><em>Because the math works.</em></h2>
            <div className="kicker">
              <p className="eyebrow">Infrastructure</p>
              <p>Supply chains write a lot. Millions of components, edges, signatures per year for any real manufacturer. Anything but Solana — or a chain like it — turns this from a product into an academic exercise.</p>
            </div>
          </div>
          <div className="why-grid">
            <div className="why-side">
              <div className="eyebrow" style={{ color: "var(--teal)" }}>A note from the team</div>
              <div className="pull">We tried Ethereum first. <em>The maths didn&apos;t math.</em> A single OEM mints ~ 4M parts a year. At $5 a write, that&apos;s a $20M tax to do <em>nothing useful yet.</em></div>
              <div className="src">— Sol Sutara, build-in-public log #07</div>
            </div>
            <div className="why-stats">
              {[
                { k: "Per-part write",       v: "$0.0008", s: "/ amortized",       p: "Compressed NFTs put 4M parts inside a budget any line manager can sign off." },
                { k: "Block time",           v: "~400",    s: "ms",                p: "Edges confirm faster than the time it takes to walk down a warehouse aisle." },
                { k: "Throughput ceiling",   v: "65k",     s: "tps theoretical",   p: "Headroom for the day every loading bay in the supplier network goes live at once." },
                { k: "Tooling maturity",     v: "2026",    s: "· production",      p: "Wallet adapters, RPC providers, indexers, mainstream-grade. Not 2021 anymore." },
              ].map((s) => (
                <div key={s.k} className="why-stat">
                  <div className="k">{s.k}</div>
                  <div className="v tnum">{s.v}<small>{s.s}</small></div>
                  <p>{s.p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROADMAP ──────────────────────────────────────────────────────── */}
      <section className="sec" id="road">
        <div className="wrap">
          <div className="sec-head">
            <h2>Building, in public.<br /><em>One issue at a time.</em></h2>
            <div className="kicker">
              <p className="eyebrow">Roadmap</p>
              <p>We ship every two weeks and write up what changed. The sandbox is open today; mainnet follows once design partners are happy. No pre-sales. No tokens. <b>The product is the pitch.</b></p>
            </div>
          </div>
          <div className="road">
            <div className="road-col">
              <div className="ph">Q4 2025 · Shipped</div>
              <h4>Foundations</h4>
              <div className="when">Oct — Dec &apos;25</div>
              <ul><li>cNFT schema for components</li><li>Co-signed edges (parent–child)</li><li>Trace API · upstream + downstream</li><li>Devnet integration</li></ul>
            </div>
            <div className="road-col now">
              <div className="ph">Q2 2026 · Now</div>
              <h4>Sandbox <em>+ design partners</em></h4>
              <div className="when">Apr — Jun &apos;26</div>
              <ul><li>Multi-org workspace</li><li>Recall simulation + dispatch</li><li>TypeScript SDK · v0.4</li><li>EU DPP audit export</li></ul>
            </div>
            <div className="road-col">
              <div className="ph">Q3 2026</div>
              <h4>Mainnet beta</h4>
              <div className="when">Jul — Sep &apos;26</div>
              <ul><li>Mainnet writes</li><li>SSO + role-based access</li><li>FSMA 204 audit export</li><li>ERP connectors · SAP, NetSuite</li></ul>
            </div>
            <div className="road-col">
              <div className="ph">Q4 2026</div>
              <h4>General availability</h4>
              <div className="when">Oct — Dec &apos;26</div>
              <ul><li>99.9% SLA · Growth tier</li><li>Dedicated indexer · Enterprise</li><li>Public verification widget</li><li>Mobile inspector app</li></ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="sec" id="faq">
        <div className="wrap">
          <div className="sec-head">
            <h2>The questions<br /><em>we keep getting asked.</em></h2>
            <div className="kicker">
              <p className="eyebrow">FAQ</p>
              <p>If you&apos;ve been around supply-chain blockchain projects before, you have justified scepticism. We share most of it. Here are the ones that come up every call.</p>
            </div>
          </div>
          <div className="faq">
            <div />
            <div className="faq-list">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className={`q${openFaq === i ? " open" : ""}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div className="q-h">
                    <h4>{item.q}</h4>
                    <span className="toggle">+</span>
                  </div>
                  <div className="a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="cta">
        <div className="wrap">
          <div className="cta-grid">
            <div>
              <h2>The graph is open.<br /><em>Bring a tier-1.</em></h2>
              <p>Devnet sandbox, no card, no token. Pick one supplier and one product line — we&apos;ll walk you through standing up your first signed edge in an afternoon.</p>
            </div>
            <div className="cta-actions">
              <div className="row">
                <Link className="btn btn-primary" href="/login">Open the sandbox →</Link>
                <a className="btn" href="#">Talk to a builder</a>
              </div>
              <div className="meta">No card · 14-day workspace · We&apos;ll match you with a design-partner engineer</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="foot">
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <div className="brand"><span className="brand-mark" /><span>Sol Sutara</span><em>· devnet</em></div>
              <p>The supply chain, set in type. Built in public on Solana, since Q4 2025.</p>
            </div>
            <div className="foot-col">
              <h5>Product</h5>
              <a href="#how">How it works</a>
              <a href="#features">Features</a>
              <Link href="/login">Dashboard</Link>
              <a href="#road">Roadmap</a>
            </div>
            <div className="foot-col">
              <h5>Company</h5>
              <a href="#">Build log</a>
              <a href="#">Press kit</a>
              <a href="#">Hiring</a>
              <a href="#">Contact</a>
            </div>
            <div className="foot-col">
              <h5>Resources</h5>
              <a href="#">Docs</a>
              <a href="#">SDK</a>
              <a href="#">Status</a>
              <a href="#">Security</a>
            </div>
          </div>
          <div className="foot-bot">
            <span>© 2026 Sol Sutara · Vol. I · Issue 04</span>
            <span>Building in public · devnet · Solana</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
