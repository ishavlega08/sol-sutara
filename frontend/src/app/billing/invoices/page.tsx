"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, CreditCard, RefreshCw, ExternalLink, Zap, Rocket, Sparkles, Building2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/ui/PageHeader";
import ActionButton from "@/components/ui/ActionButton";
import { getOrgPlan, getOrgUsage, type OrgPlan, type OrgUsage } from "@/lib/api/billing";
import Link from "next/link";

const PLAN_META: Record<OrgPlan, { label: string; color: string; icon: React.ElementType }> = {
    SANDBOX:    { label: "Free",       color: "#6b7280", icon: Zap },
    STARTER:    { label: "Starter",    color: "#3b82f6", icon: Rocket },
    GROWTH:     { label: "Growth",     color: "#7c3aed", icon: Sparkles },
    ENTERPRISE: { label: "Enterprise", color: "#10b981", icon: Building2 },
};

const PLAN_PRICE: Record<OrgPlan, number | null> = {
    SANDBOX: 0, STARTER: 100, GROWTH: 250, ENTERPRISE: null,
};

function fmt(n: number): string {
    return n.toLocaleString();
}

function UsageSummaryRow({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{value}</span>
        </div>
    );
}

export default function InvoicesPage() {
    const { org } = useAuth();

    const [plan, setPlan]   = useState<OrgPlan | null>(null);
    const [usage, setUsage] = useState<OrgUsage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [planRes, usageRes] = await Promise.all([getOrgPlan(), getOrgUsage()]);
            setPlan(planRes.plan);
            setUsage(usageRes.usage);
        } catch {
            setError("Failed to load billing data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const meta = plan ? PLAN_META[plan] : null;
    const price = plan ? PLAN_PRICE[plan] : null;
    const PlanIcon = meta?.icon ?? FileText;

    const periodLabel = usage
        ? `${new Date(usage.period_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(usage.period_end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
        : null;

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

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

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                    {/* Current billing period */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Current plan summary */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
                                <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Current plan</span>
                            </div>
                            <div className="p-4">
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                            <div className="h-3 w-36 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
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
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">{meta?.label ?? "—"}</p>
                                                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                                                        style={{ color: meta?.color, background: `color-mix(in oklab, ${meta?.color} 10%, transparent)` }}>
                                                        Active
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">
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

                        {/* Current period usage */}
                        {usage && !loading && (
                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Current period usage</span>
                                    </div>
                                    {periodLabel && (
                                        <span className="text-[11px] tabular-nums text-gray-400">{periodLabel}</span>
                                    )}
                                </div>
                                <div className="divide-y divide-gray-50 dark:divide-gray-800 px-4">
                                    <UsageSummaryRow label="Components registered"    value={fmt(usage.components)} />
                                    <UsageSummaryRow label="Shipments tracked"        value={fmt(usage.shipments)} />
                                    <UsageSummaryRow label="Suppliers managed"        value={fmt(usage.suppliers)} />
                                    <UsageSummaryRow label="Documents uploaded"       value={fmt(usage.documents)} />
                                    <UsageSummaryRow label="Org members"              value={fmt(usage.members)} />
                                    <UsageSummaryRow label="Webhooks"                 value={fmt(usage.webhooks)} />
                                    <UsageSummaryRow label="Webhook deliveries"       value={fmt(usage.webhook_deliveries)} />
                                    <UsageSummaryRow label="Traces this month"        value={fmt(usage.traces_this_month)} />
                                </div>
                            </div>
                        )}

                        {/* Invoice history */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Invoice history</span>
                            </div>

                            {plan === "SANDBOX" ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                        <FileText className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No invoices yet</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
                                        You&apos;re on the free Sandbox plan. Invoices will appear here once you upgrade to a paid plan.
                                    </p>
                                    <Link href="/billing/plans"
                                        className="mt-1 flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition">
                                        View paid plans <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                        <ExternalLink className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Invoice portal coming soon</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
                                        Full invoice history and PDF downloads are being added. For now, contact us to get your receipts.
                                    </p>
                                    <a href="mailto:mridul@solsutara.com?subject=Invoice request"
                                        className="mt-1 flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                        Request invoices <ArrowRight className="h-3 w-3" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-4">

                        {/* Billing cycle */}
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
                                        <p className="text-xs text-gray-500">Renews automatically each month</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Help */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Need help?</p>
                            <div className="space-y-2 text-sm">
                                <a href="mailto:mridul@solsutara.com" className="block text-violet-600 hover:underline underline-offset-2">
                                    Billing support
                                </a>
                                <Link href="/billing/plans" className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                                    Compare plans
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
