"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Check, Zap, Building2, Sparkles, Rocket, ArrowRight,
    HelpCircle, Loader2, RefreshCw, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import PageHeader from "@/components/ui/PageHeader";
import {
    getOrgPlan, getOrgUsage, getPlanCatalogue, createCheckout,
    type OrgPlan, type BillingInterval, type PlanLimits, type OrgUsage, type PlanCatalogue,
} from "@/lib/api/billing";

// ─── Plan metadata ─────────────────────────────────────────────────────────────

const PLAN_META: Record<OrgPlan, {
    label:    string;
    desc:     string;
    badge:    string | null;
    icon:     React.ElementType;
    color:    string;
    gradient: string;
    ctaLabel: string;
    features: string[];
    price:    { monthly: number | null; annual: number | null };
}> = {
    SANDBOX: {
        label:    "Free",
        badge:    null,
        desc:     "Explore the graph and test on devnet — no card required.",
        icon:     Zap,
        color:    "#6b7280",
        gradient: "from-gray-500 to-gray-600",
        ctaLabel: "Get started free",
        price:    { monthly: 0, annual: 0 },
        features: [
            "Up to 500 components",
            "3 org members",
            "2 webhooks",
            "Devnet only",
            "Upstream + downstream trace",
            "Recall simulation",
            "Shipment & supplier tracking",
            "Community support",
        ],
    },
    STARTER: {
        label:    "Starter",
        badge:    "Recommended",
        desc:     "For small teams ready to go live with real supply chain data on mainnet.",
        icon:     Rocket,
        color:    "#3b82f6",
        gradient: "from-blue-500 to-blue-600",
        ctaLabel: "Upgrade to Starter",
        price:    { monthly: 100, annual: 82 },
        features: [
            "Up to 5,000 components",
            "25k writes / mo",
            "50k traces / mo",
            "10 org members",
            "5 webhooks",
            "Mainnet + Devnet",
            "Document uploads",
            "Email notifications",
            "Email support · 48h SLA",
        ],
    },
    GROWTH: {
        label:    "Growth",
        badge:    "Most popular",
        desc:     "For teams scaling operations with high-volume writes and real-time integrations.",
        icon:     Sparkles,
        color:    "#7c3aed",
        gradient: "from-violet-500 to-violet-700",
        ctaLabel: "Upgrade to Growth",
        price:    { monthly: 250, annual: 205 },
        features: [
            "Unlimited components",
            "500k writes / mo",
            "250k traces / mo",
            "25 org members",
            "20 webhooks",
            "Mainnet + Devnet",
            "Document uploads (IPFS)",
            "Email notifications",
            "Priority support · 24h SLA",
        ],
    },
    ENTERPRISE: {
        label:    "Enterprise",
        badge:    null,
        desc:     "Dedicated infrastructure, SAML SSO, and a named implementation engineer.",
        icon:     Building2,
        color:    "#10b981",
        gradient: "from-emerald-500 to-emerald-700",
        ctaLabel: "Talk to us",
        price:    { monthly: null, annual: null },
        features: [
            "Unlimited writes & traces",
            "Unlimited members",
            "Dedicated indexer",
            "SAML / SSO",
            "Custom SLA (99.9%+)",
            "ERP connectors (SAP, NetSuite)",
            "EU DPP + FSMA 204 exports",
            "Named implementation engineer",
            "Slack-based support",
        ],
    },
};

const PLAN_ORDER: OrgPlan[] = ["SANDBOX", "STARTER", "GROWTH", "ENTERPRISE"];

const FAQ = [
    { q: "Can I stay on Sandbox forever?",          a: "Yes. Sandbox is free indefinitely on devnet. You only need to upgrade when you're ready to write to mainnet or exceed the component / member limits." },
    { q: "What counts as a 'write'?",               a: "Any POST to /components or /components/link that results in an on-chain Anchor transaction. Dashboard reads, traces, and API GETs are free and unlimited on all plans." },
    { q: "How does annual billing work?",            a: "Annual billing is charged upfront for 12 months at the discounted rate. You save ~18% vs monthly. Unused months are non-refundable but your plan stays active for the full year." },
    { q: "Can I add members beyond my plan limit?",  a: "Members beyond the plan limit are blocked at the API level. Upgrade to Growth for 25 members, or contact us for Enterprise with no ceiling." },
    { q: "Do you offer a free trial of Growth?",    a: "Yes — design partners get a 14-day full-access trial. Apply via the devnet access form or email us at mridul@solsutara.com." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null): string {
    if (n === null) return "Unlimited";
    return n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k` : String(n);
}

function UsageBar({ used, limit, color, label }: { used: number; limit: number | null; color: string; label: string }) {
    const pct  = limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const warn = limit !== null && pct >= 80;
    const crit = limit !== null && pct >= 95;

    return (
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
                <span className="flex-shrink-0 text-[10px] font-semibold rounded-full px-1.5 py-0.5"
                    style={{
                        color:      crit ? "#dc2626" : warn ? "#d97706" : color,
                        background: crit ? "#fef2f2" : warn ? "#fffbeb" : `color-mix(in oklab, ${color} 10%, transparent)`,
                    }}>
                    {limit === null ? "∞" : `${pct}%`}
                </span>
            </div>
            <p className="mb-2.5 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-none">
                {used.toLocaleString()}
            </p>
            {limit === null ? (
                <p className="text-[11px] text-gray-400">Unlimited on current plan</p>
            ) : (
                <>
                    <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-1 rounded-full transition-all duration-500"
                            style={{
                                width:      `${pct}%`,
                                background: crit ? "#dc2626" : warn ? "#f59e0b" : color,
                            }} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400 tabular-nums">
                        of {limit.toLocaleString()} limit
                    </p>
                </>
            )}
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-5 w-8 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-7 w-14 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-1 w-full animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
    const { org }     = useAuth();
    const { isOwner } = useRole();

    const [annual,    setAnnual]    = useState(false);
    const [openFaq,   setOpenFaq]   = useState<number | null>(null);
    const [upgrading, setUpgrading] = useState<OrgPlan | null>(null);

    const [currentPlan, setCurrentPlan] = useState<OrgPlan | null>(null);
    const [limits,      setLimits]      = useState<PlanLimits | null>(null);
    const [usage,       setUsage]       = useState<OrgUsage | null>(null);
    const [catalogue,   setCatalogue]   = useState<PlanCatalogue[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [planRes, usageRes, catRes] = await Promise.all([
                getOrgPlan(),
                getOrgUsage(),
                getPlanCatalogue(),
            ]);
            setCurrentPlan(planRes.plan);
            setLimits(planRes.limits);
            setUsage(usageRes.usage);
            setCatalogue(catRes.plans);
        } catch {
            setError("Failed to load billing data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleUpgrade(plan: OrgPlan) {
        if (plan === "ENTERPRISE") {
            window.location.href = "mailto:mridul@solsutara.com?subject=Enterprise inquiry";
            return;
        }
        if (plan === "SANDBOX") {
            // Downgrade — handled via support contact
            window.location.href = "mailto:mridul@solsutara.com?subject=Downgrade request";
            return;
        }
        setUpgrading(plan);
        try {
            const billing = annual ? "annual" : "monthly";
            const { payment_link } = await createCheckout(plan, billing as BillingInterval);
            window.location.href = payment_link;
        } catch (err: unknown) {
            // Prefer the backend's descriptive error over the generic axios message
            const axiosMsg = (err as any)?.response?.data?.error;
            const msg = axiosMsg || (err instanceof Error ? err.message : "Failed to start checkout");
            setError(msg);
            setUpgrading(null);
        }
    }

    const usageRows = usage && limits ? [
        { label: "Components registered",  used: usage.components,         limit: limits.components,       color: "#7c3aed" },
        { label: "Traces this month",       used: usage.traces_this_month,  limit: limits.traces_per_month, color: "#10b981" },
        { label: "Org members",             used: usage.members,            limit: limits.members,          color: "#3b82f6" },
        { label: "Shipments tracked",       used: usage.shipments,          limit: null,                    color: "#f59e0b" },
        { label: "Suppliers managed",       used: usage.suppliers,          limit: null,                    color: "#8b5cf6" },
        { label: "Webhook deliveries / mo", used: usage.webhook_deliveries, limit: null,                    color: "#06b6d4" },
    ] : [];

    // Featured card = current plan from API, defaulting to STARTER while loading
    const featuredPlan: OrgPlan = currentPlan ?? "STARTER";

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

                <PageHeader
                    title="Plans & billing"
                    subtitle={<span>Workspace: <strong className="text-gray-800 dark:text-gray-200">{org?.name ?? "—"}</strong></span>}
                    actions={
                        <button onClick={() => load()} disabled={loading}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    }
                />

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* ── Current plan pill ── */}
                {!loading && currentPlan && (() => {
                    const m = PLAN_META[currentPlan];
                    const Icon = m.icon;
                    return (
                        <div className="mb-6 flex items-center gap-3 rounded-xl border bg-white dark:bg-gray-900 px-4 py-3.5"
                            style={{ borderColor: `color-mix(in oklab, ${m.color} 25%, transparent)` }}>
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                                style={{ background: `color-mix(in oklab, ${m.color} 12%, transparent)` }}>
                                <Icon className="h-4 w-4" style={{ color: m.color }} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{m.label}</span>
                                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                        style={{ color: m.color, background: `color-mix(in oklab, ${m.color} 10%, transparent)` }}>
                                        Active
                                    </span>
                                    <span className="text-xs text-gray-400">{limits?.network ?? "—"}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.desc}</p>
                            </div>
                            {currentPlan === "SANDBOX" && (
                                <span className="flex-shrink-0 text-xs text-gray-400">Free forever</span>
                            )}
                        </div>
                    );
                })()}

                {/* ── Usage ── */}
                <section className="mb-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                            This month&apos;s usage
                        </h2>
                        {usage && (
                            <span className="text-[11px] text-gray-400 tabular-nums">
                                {new Date(usage.period_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                {" – "}
                                {new Date(usage.period_end).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                            : usageRows.map((row) => (
                                <UsageBar key={row.label} {...row} />
                            ))
                        }
                    </div>
                </section>

                {/* ── Billing toggle ── */}
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Choose your plan</h2>
                    <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 shadow-sm">
                        <button onClick={() => setAnnual(false)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                !annual
                                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}>
                            Monthly
                        </button>
                        <button onClick={() => setAnnual(true)}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                annual
                                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}>
                            Annual
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                                −18%
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── Plan cards ── */}
                <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {PLAN_ORDER.map((planId) => {
                        const m          = PLAN_META[planId];
                        const Icon       = m.icon;
                        const isCurrent  = planId === currentPlan;
                        const isFeatured = planId === featuredPlan;
                        const isUpgrade  = currentPlan && PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlan);
                        const price      = m.price.monthly === null ? null : annual ? m.price.annual : m.price.monthly;

                        return (
                            <div key={planId}
                                className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white dark:bg-gray-900 transition-all duration-200 ${
                                    isFeatured
                                        ? "border-violet-400 dark:border-violet-600 shadow-xl shadow-violet-100/50 dark:shadow-violet-950/50 scale-[1.02]"
                                        : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md"
                                }`}>

                                {/* Top gradient bar */}
                                <div className={`h-1 w-full bg-gradient-to-r ${m.gradient}`} />

                                {/* Badge */}
                                {(m.badge || isCurrent) && (
                                    <div className="absolute right-3 top-4 flex flex-col items-end gap-1">
                                        {isCurrent && (
                                            <span className="flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                                                <Check className="h-2.5 w-2.5" />
                                                Current
                                            </span>
                                        )}
                                        {m.badge && !isCurrent && (
                                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                                style={{ color: m.color, background: `color-mix(in oklab, ${m.color} 10%, transparent)` }}>
                                                {m.badge}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-1 flex-col p-5">
                                    {/* Icon + Label */}
                                    <div className="mb-4 flex items-center gap-2.5">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl"
                                            style={{ background: `color-mix(in oklab, ${m.color} 12%, transparent)` }}>
                                            <Icon className="h-4 w-4" style={{ color: m.color }} />
                                        </span>
                                        <span className="text-base font-bold text-gray-900 dark:text-gray-100">{m.label}</span>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        {price === null ? (
                                            <>
                                                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">Custom</span>
                                                <p className="mt-1 text-xs text-gray-400">Contact us for a quote</p>
                                            </>
                                        ) : price === 0 ? (
                                            <>
                                                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">Free</span>
                                                <p className="mt-1 text-xs text-gray-400">No card required · forever</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">${price}</span>
                                                    <span className="text-sm text-gray-400">/ mo</span>
                                                </div>
                                                {annual
                                                    ? <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Billed ${(price * 12).toLocaleString()}/year</p>
                                                    : <p className="mt-1 text-xs text-gray-400">or ${m.price.annual}/mo billed annually</p>
                                                }
                                            </>
                                        )}
                                    </div>

                                    <p className="mb-5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{m.desc}</p>

                                    {/* Divider */}
                                    <div className="mb-4 h-px bg-gray-100 dark:bg-gray-800" />

                                    {/* Features */}
                                    <ul className="mb-6 flex-1 space-y-2">
                                        {m.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                                                    style={{ background: `color-mix(in oklab, ${m.color} 10%, transparent)` }}>
                                                    <Check className="h-2.5 w-2.5" style={{ color: m.color }} />
                                                </span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    {isCurrent ? (
                                        <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-400">
                                            <Check className="h-3.5 w-3.5" />
                                            Current plan
                                        </div>
                                    ) : planId === "ENTERPRISE" ? (
                                        <a href="mailto:mridul@solsutara.com?subject=Enterprise inquiry"
                                            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800">
                                            Talk to us <ArrowRight className="h-3.5 w-3.5" />
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => handleUpgrade(planId)}
                                            disabled={!isOwner || upgrading !== null}
                                            title={!isOwner ? "Only the workspace owner can upgrade" : undefined}
                                            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed ${
                                                isFeatured
                                                    ? "bg-gradient-to-r from-violet-600 to-violet-700 shadow-md shadow-violet-200 dark:shadow-violet-950"
                                                    : ""
                                            }`}
                                            style={!isFeatured ? { background: `linear-gradient(135deg, ${m.color}, color-mix(in oklab, ${m.color} 80%, #000))` } : undefined}>
                                            {upgrading === planId
                                                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Upgrading…</>
                                                : <>{isUpgrade ? m.ctaLabel : "Downgrade"} <ArrowRight className="h-3.5 w-3.5" /></>
                                            }
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Compare table ── */}
                <section className="mb-10">
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Compare plans</h2>
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 w-1/3">
                                        Feature
                                    </th>
                                    {PLAN_ORDER.map((planId) => (
                                        <th key={planId}
                                            className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide"
                                            style={{ color: planId === currentPlan ? PLAN_META[planId].color : undefined }}>
                                            <span>{PLAN_META[planId].label}</span>
                                            {planId === currentPlan && (
                                                <span className="ml-1 inline-block rounded-full w-1.5 h-1.5 align-middle"
                                                    style={{ background: PLAN_META[planId].color }} />
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {[
                                    { label: "Components",     key: "components"       as keyof PlanLimits },
                                    { label: "Org members",    key: "members"          as keyof PlanLimits },
                                    { label: "Traces / mo",    key: "traces_per_month" as keyof PlanLimits },
                                    { label: "Writes / mo",    key: "writes_per_month" as keyof PlanLimits },
                                    { label: "Webhooks",       key: "webhooks"         as keyof PlanLimits },
                                    { label: "Network",        key: "network"          as keyof PlanLimits },
                                    { label: "Support",        key: "support"          as keyof PlanLimits },
                                ].map((row) => (
                                    <tr key={row.label} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-xs">{row.label}</td>
                                        {PLAN_ORDER.map((planId) => {
                                            const planLimits = catalogue.find((c) => c.id === planId)?.limits;
                                            const val = planLimits ? planLimits[row.key] : "—";
                                            const display = typeof val === "number" ? fmt(val) : (val ?? "∞");
                                            return (
                                                <td key={planId}
                                                    className="px-3 py-3 text-center text-xs text-gray-500 dark:text-gray-400"
                                                    style={{ color: planId === currentPlan ? PLAN_META[planId].color : undefined, fontWeight: planId === currentPlan ? 600 : undefined }}>
                                                    {loading
                                                        ? <span className="inline-block h-3 w-10 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                                        : String(display)
                                                    }
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="mb-8">
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Frequently asked</h2>
                    <div className="space-y-2">
                        {FAQ.map((item, i) => (
                            <div key={i}
                                className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition">
                                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                    <span className="flex items-center gap-2.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                                        <HelpCircle className="h-3.5 w-3.5 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                                        {item.q}
                                    </span>
                                    <ChevronDown className={`ml-4 h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                                </button>
                                {openFaq === i && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 pl-10">
                                        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{item.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <p className="pb-8 text-center text-xs text-gray-400">
                    Questions about billing?{" "}
                    <a href="mailto:mridul@solsutara.com" className="text-violet-600 hover:underline underline-offset-2">
                        mridul@solsutara.com
                    </a>
                    {" · "}No contracts · Cancel anytime
                </p>

            </div>
        </div>
    );
}
