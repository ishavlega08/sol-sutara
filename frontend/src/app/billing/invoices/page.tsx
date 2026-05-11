"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, ExternalLink, RefreshCw, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { getInvoices, getSubscription, type Invoice, type Subscription } from "@/lib/api/billing";

function StatusBadge({ status }: { status: string }) {
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

function fmtAmount(amount: number, currency: string) {
    try {
        return new Intl.NumberFormat("en-US", {
            style:    "currency",
            currency: currency.toUpperCase(),
        }).format(amount / 100); // Dodo amounts are in cents
    } catch {
        return `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;
    }
}

export default function InvoicesPage() {
    const [invoices,     setInvoices]     = useState<Invoice[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [invRes, subRes] = await Promise.all([getInvoices(), getSubscription()]);
            setInvoices(invRes.invoices ?? []);
            setSubscription(subRes.subscription);
        } catch {
            setError("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
                <PageHeader
                    title="Invoices"
                    subtitle={<span>Billing history for your workspace</span>}
                    actions={
                        <button onClick={load} disabled={loading}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    }
                />

                {/* Subscription info */}
                {subscription && (
                    <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3.5">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Active subscription</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {subscription.plan} · {subscription.billing}
                                </p>
                            </div>
                            <div className="text-right">
                                {subscription.current_period_end && (
                                    <p className="text-xs text-gray-400">
                                        Renews {new Date(subscription.current_period_end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                )}
                                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    subscription.status === "active"
                                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                                        : subscription.status === "past_due"
                                        ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                }`}>
                                    {subscription.status.replace("_", " ").toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-20">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <FileText className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">No invoices yet</p>
                        <p className="text-xs text-gray-400 text-center max-w-xs">
                            Invoices appear here once you upgrade to a paid plan.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <table className="w-full text-sm">
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
                                            <StatusBadge status={inv.status} />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {inv.payment_link ? (
                                                <a
                                                    href={inv.payment_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 text-xs hover:underline"
                                                >
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

                <p className="mt-6 text-center text-xs text-gray-400">
                    Questions about a charge?{" "}
                    <a href="mailto:mridul@solsutara.com" className="text-violet-600 hover:underline underline-offset-2">
                        mridul@solsutara.com
                    </a>
                </p>
            </div>
        </div>
    );
}
