"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FileText, CreditCard, RefreshCw, ExternalLink,
    Zap, Rocket, Sparkles, Building2, ArrowRight,
    CheckCircle2, XCircle, Clock, Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/ui/PageHeader";
import ActionButton from "@/components/ui/ActionButton";
import Link from "next/link";
import {
    getOrgPlan, getOrgUsage, getInvoices, getSubscription,
    type OrgPlan, type OrgUsage, type Invoice, type Subscription,
} from "@/lib/api/billing";

// ─── Plan meta ────────────────────────────────────────────────────────────────

const PLAN_META: Record<OrgPlan, { label: string; color: string; icon: React.ElementType }> = {
    SANDBOX:    { label: "Free",       color: "#6b7280", icon: Zap },
    STARTER:    { label: "Starter",    color: "#3b82f6", icon: Rocket },
    GROWTH:     { label: "Growth",     color: "#7c3aed", icon: Sparkles },
    ENTERPRISE: { label: "Enterprise", color: "#10b981", icon: Building2 },
};

const PLAN_PRICE: Record<OrgPlan, number | null> = {
    SANDBOX: 0, STARTER: 100, GROWTH: 250, ENTERPRISE: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString(); }

function fmtAmount(amount: number, currency: string) {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency", currency: currency.toUpperCase(),
        }).format(amount / 100);
    } catch {
        return `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;
    }
}

function InvoiceStatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    if (s === "succeeded" || s === "paid" || s === "success")
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-2.5 w-2.5" /> Paid
            </span>
        );
    if (s === "failed" || s === "cancelled")
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                <XCircle className="h-2.5 w-2.5" /> {s === "failed" ? "Failed" : "Cancelled"}
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
            <Clock className="h-2.5 w-2.5" /> Pending
        </span>
    );
}

function UsageRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 py-2.5 last:border-0 text-sm">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{value}</span>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
    const { org } = useAuth();

    const [plan,         setPlan]         = useState<OrgPlan | null>(null);
    const [usage,        setUsage]        = useState<OrgUsage | null>(null);
    const [invoices,     setInvoices]     = useState<Invoice[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [planRes, usageRes, invRes, subRes] = await Promise.all([
                getOrgPlan(),
                getOrgUsage(),
                getInvoices(),
                getSubscription(),
            ]);
            setPlan(planRes.plan);
            setUsage(usageRes.usage);
            setInvoices(invRes.invoices ?? []);
            setSubscription(subRes.subscription);
        } catch {
            setError("Failed to load billing data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const meta     = plan ? PLAN_META[plan] : null;
    const price    = plan ? PLAN_PRICE[plan] : null;
    const PlanIcon = meta?.icon ?? FileText;

    const periodLabel = usage
        ? `${new Date(usage.period_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(usage.period_end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
        : null;

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                <PageHeader
                    title="Invoices"
                    subtitle={<span>Billing history for <strong className="text-gray-800 dark:text-gray-200">{org?.name ?? "your workspace"}</strong></span>}
                    actions={
                        <ActionButton variant="ghost" onClick={load} disabled={loading}>
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </ActionButton>
                    }
                />

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* ── Active subscription banner ── */}
                {!loading && subscription && (
                    <div className="mb-6 overflow-hidden rounded-xl border bg-white dark:bg-gray-900 px-5 py-4"
                        style={{ borderColor: `color-mix(in oklab, ${meta?.color ?? "#7c3aed"} 25%, transparent)` }}>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                                    style={{ background: `color-mix(in oklab, ${meta?.color ?? "#7c3aed"} 12%, transparent)` }}>
                                    <PlanIcon className="h-4 w-4" style={{ color: meta?.color ?? "#7c3aed" }} />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Active subscription</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                        {meta?.label ?? subscription.plan} · <span className="capitalize font-medium text-gray-500">{subscription.billing}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {subscription.current_period_end && (
                                    <p className="text-xs text-gray-400">
                                        Renews {new Date(subscription.current_period_end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                )}
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                    subscription.status === "active"
                                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                                        : subscription.status === "past_due"
                                        ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                }`}>
                                    {subscription.status.replace("_", " ")}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

                    {/* ── Main column ── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Current plan card */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
                                <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Current plan</span>
                            </div>
                            <div className="p-4">
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                            <div className="h-3 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-xl"
                                                style={{ background: `color-mix(in oklab, ${meta?.color} 12%, transparent)` }}>
                                                <PlanIcon className="h-5 w-5" style={{ color: meta?.color }} />
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">{meta?.label}</p>
                                                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                                                        style={{ color: meta?.color, background: `color-mix(in oklab, ${meta?.color} 10%, transparent)` }}>
                                                        Active
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {price === 0 ? "Free forever · no card required" :
                                                     price === null ? "Custom pricing · contact sales" :
                                                     `$${price}/mo · billed monthly`}
                                                </p>
                                            </div>
                                        </div>
                                        <Link href="/billing/plans"
                                            className="flex items-center gap-1.5 rounded-lg border border-violet-200 dark:border-violet-800 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950 transition">
                                            Manage plan <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Usage summary */}
                        {!loading && usage && (
                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">This period&apos;s usage</span>
                                    </div>
                                    {periodLabel && <span className="text-[11px] tabular-nums text-gray-400">{periodLabel}</span>}
                                </div>
                                <div className="px-4 py-1">
                                    <UsageRow label="Components registered"  value={fmt(usage.components)} />
                                    <UsageRow label="Shipments tracked"      value={fmt(usage.shipments)} />
                                    <UsageRow label="Suppliers managed"      value={fmt(usage.suppliers)} />
                                    <UsageRow label="Documents uploaded"     value={fmt(usage.documents)} />
                                    <UsageRow label="Org members"            value={fmt(usage.members)} />
                                    <UsageRow label="Webhooks"               value={fmt(usage.webhooks)} />
                                    <UsageRow label="Webhook deliveries"     value={fmt(usage.webhook_deliveries)} />
                                    <UsageRow label="Traces this month"      value={fmt(usage.traces_this_month)} />
                                </div>
                            </div>
                        )}

                        {/* Invoices table */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Invoice history</span>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                </div>
                            ) : invoices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                        <FileText className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No invoices yet</p>
                                    <p className="text-xs text-gray-400 max-w-xs">
                                        {plan === "SANDBOX"
                                            ? "You're on the free Sandbox plan. Invoices will appear here once you upgrade."
                                            : "Invoices from your paid plan will appear here."}
                                    </p>
                                    {plan === "SANDBOX" && (
                                        <Link href="/billing/plans"
                                            className="mt-1 flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition">
                                            View paid plans <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[560px]">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Date</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Description</th>
                                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">Amount</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">Status</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {invoices.map((inv) => (
                                                <tr key={inv.payment_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                                                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                                                        {new Date(inv.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                                                        {inv.description ?? "Subscription payment"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                                                        {fmtAmount(inv.amount, inv.currency)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <InvoiceStatusBadge status={inv.status} />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {inv.payment_link ? (
                                                            <a href={inv.payment_link} target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 text-xs hover:underline underline-offset-2">
                                                                View <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="space-y-4">

                        {/* Billing period */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div className="h-0.5" style={{ background: meta?.color ?? "#7c3aed" }} />
                            <div className="p-4 space-y-3">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Billing period</p>
                                {loading ? (
                                    <div className="space-y-2">
                                        <div className="h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{periodLabel ?? "—"}</p>
                                        <p className="text-xs text-gray-500">Resets monthly</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Need help */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Need help?</p>
                            <div className="space-y-2.5 text-sm">
                                <a href="mailto:mridul@solsutara.com"
                                    className="flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:underline underline-offset-2">
                                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                    Billing support
                                </a>
                                <Link href="/billing/plans"
                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                                    Compare plans
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-6 pb-2 text-center text-xs text-gray-400">
                    Questions about a charge?{" "}
                    <a href="mailto:mridul@solsutara.com" className="text-violet-600 hover:underline underline-offset-2">
                        mridul@solsutara.com
                    </a>
                    {" · "}No contracts · Cancel anytime
                </p>

            </div>
        </div>
    );
}
