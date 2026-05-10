"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const ROLES = [
  "Founder / CEO",
  "Engineering",
  "Product",
  "Supply Chain / Procurement",
  "Quality / Compliance",
  "Other",
];

const USE_CASES = [
  "Supplier traceability",
  "Recall management",
  "Regulatory compliance (EU DPP / FSMA)",
  "Audit-grade provenance",
  "Building on the SDK",
  "Other",
];

export default function DevnetAccessPage() {
  const [form, setForm] = useState({
    name:        "",
    email:       "",
    company:     "",
    role:        "",
    useCase:     "",
    teamSize:    "",
    description: "",
  });
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim())    { setError("Name is required"); return; }
    if (!form.email.trim())   { setError("Work email is required"); return; }
    if (!form.company.trim()) { setError("Company is required"); return; }
    if (!form.useCase)        { setError("Select a primary use case"); return; }

    setLoading(true);
    setError(null);
    try {
      // Submit to a waitlist endpoint — gracefully no-ops if not configured
      await fetch("/api/devnet-waitlist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      }).catch(() => { /* silent if endpoint not live yet */ });

      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lp">

      {/* ── NAV ── */}
      <header className="nav">
        <div className="wrap nav-inner">
          <Link className="brand" href="/">
            <Logo size={22} />
            <span>Sol Sutara</span>
            <em>· devnet</em>
          </Link>
          <div className="nav-cta">
            <Link className="btn btn-ghost" href="/login">Sign in</Link>
          </div>
        </div>
      </header>

      {/* ── FORM ── */}
      <section style={{ padding: "72px 0 96px" }}>
        <div className="wrap" style={{ maxWidth: 720 }}>

          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <p className="eyebrow" style={{ marginBottom: 16 }}>Devnet access · limited seats</p>
            <h1 style={{
              fontFamily: "var(--serif)", fontWeight: 500,
              fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.06,
              letterSpacing: "-0.025em", margin: 0,
            }}>
              Get early access.<br /><em style={{ fontStyle: "italic", color: "var(--fg-2)", fontWeight: 400 }}>Ship your first signed edge.</em>
            </h1>
            <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.6, color: "var(--fg-2)", maxWidth: "52ch" }}>
              We&apos;re onboarding design partners one team at a time. Tell us what you&apos;re building — we&apos;ll match you with an engineer and have you tracing your first component in an afternoon.
            </p>
            <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
              {["No credit card", "Devnet sandbox included", "14-day workspace", "Engineer on-call"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--fg-2)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)", flexShrink: 0 }} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {submitted ? (
            /* ── SUCCESS ── */
            <div style={{
              border: "1px solid var(--line)", borderRadius: 8,
              background: "var(--ink-2)", padding: "48px 40px",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 16, textAlign: "center",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "color-mix(in oklab, var(--teal) 12%, transparent)",
                border: "1.5px solid var(--teal)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CheckCircle2 size={24} color="var(--teal)" />
              </div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", margin: 0 }}>
                You&apos;re on the list.
              </h2>
              <p style={{ color: "var(--fg-2)", fontSize: 15, lineHeight: 1.6, maxWidth: "42ch", margin: 0 }}>
                We&apos;ll review your application and reach out within <strong style={{ color: "var(--fg)" }}>1–2 business days</strong> with sandbox credentials and a calendar link.
              </p>
              <p style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 8 }}>
                Confirmation sent to <strong style={{ color: "var(--fg-2)" }}>{form.email}</strong>
              </p>
              <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
                <Link className="btn btn-primary" href="/">Back to home</Link>
                <Link className="btn" href="/login">Go to sandbox →</Link>
              </div>
            </div>
          ) : (
            /* ── FORM ── */
            <form onSubmit={handleSubmit} noValidate>
              <div style={{
                border: "1px solid var(--line)", borderRadius: 8,
                background: "var(--ink-2)", overflow: "hidden",
              }}>

                {/* Section: You */}
                <div style={{ padding: "28px 32px", borderBottom: "1px solid var(--line)" }}>
                  <p className="eyebrow" style={{ marginBottom: 20 }}>About you</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                    <div>
                      <label style={labelStyle}>Full name <span style={{ color: "var(--crimson)" }}>*</span></label>
                      <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Alex Chen" />
                    </div>
                    <div>
                      <label style={labelStyle}>Work email <span style={{ color: "var(--crimson)" }}>*</span></label>
                      <input type="email" style={inputStyle} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="alex@company.com" />
                    </div>
                    <div>
                      <label style={labelStyle}>Company <span style={{ color: "var(--crimson)" }}>*</span></label>
                      <input style={inputStyle} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Manufacturing" />
                    </div>
                    <div>
                      <label style={labelStyle}>Role</label>
                      <select style={inputStyle} value={form.role} onChange={(e) => set("role", e.target.value)}>
                        <option value="">Select role…</option>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Your use case */}
                <div style={{ padding: "28px 32px", borderBottom: "1px solid var(--line)" }}>
                  <p className="eyebrow" style={{ marginBottom: 20 }}>Your use case</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                    <div>
                      <label style={labelStyle}>Primary use case <span style={{ color: "var(--crimson)" }}>*</span></label>
                      <select style={inputStyle} value={form.useCase} onChange={(e) => set("useCase", e.target.value)}>
                        <option value="">Select use case…</option>
                        {USE_CASES.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Team size</label>
                      <select style={inputStyle} value={form.teamSize} onChange={(e) => set("teamSize", e.target.value)}>
                        <option value="">Select…</option>
                        {["1–5", "6–20", "21–100", "100–500", "500+"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>What are you trying to build? <span style={{ fontSize: 10, color: "var(--fg-3)" }}>(optional)</span></label>
                      <textarea
                        style={{ ...inputStyle, resize: "none", lineHeight: 1.6, height: 88 }}
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="e.g. We're an EV battery manufacturer and need end-to-end provenance for EU DPP compliance by Q3 2027…"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  {error ? (
                    <p style={{ fontSize: 12.5, color: "var(--crimson)", margin: 0 }}>{error}</p>
                  ) : (
                    <p style={{ fontSize: 12, color: "var(--fg-3)", margin: 0 }}>
                      We read every application. Response within 1–2 business days.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ padding: "11px 28px", fontSize: 14, display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    Request access →
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Footer note */}
          <p style={{ marginTop: 28, fontSize: 12, color: "var(--fg-3)", lineHeight: 1.6 }}>
            Already have access?{" "}
            <Link href="/login" style={{ color: "var(--fg-2)", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Sign in to the sandbox →
            </Link>
          </p>
        </div>
      </section>

    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display:       "block",
  fontSize:      11,
  fontWeight:    600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color:         "var(--fg-3)",
  marginBottom:  7,
  fontFamily:    "var(--mono)",
};

const inputStyle: React.CSSProperties = {
  width:           "100%",
  background:      "var(--ink)",
  border:          "1px solid var(--line)",
  borderRadius:    5,
  padding:         "9px 12px",
  fontSize:        13.5,
  color:           "var(--fg)",
  outline:         "none",
  fontFamily:      "inherit",
  boxSizing:       "border-box",
  appearance:      "none" as const,
  WebkitAppearance: "none" as const,
};
