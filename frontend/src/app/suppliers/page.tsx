"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Plus, Search, RefreshCw, Building2, MapPin, Mail, Phone,
    ChevronRight, AlertTriangle, CheckCircle, Clock, XCircle, Filter,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { getSuppliers } from "@/lib/api/suppliers";
import type { Supplier, SupplierStatus, SupplierRisk } from "@/types/supplier";

// ─── Badge helpers ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SupplierStatus, { label: string; icon: React.ElementType; cls: string }> = {
    PENDING_REVIEW: { label: "Pending review", icon: Clock,         cls: "bg-amber-50  text-amber-700  dark:bg-amber-950/60  dark:text-amber-400  border-amber-200  dark:border-amber-800" },
    APPROVED:       { label: "Approved",        icon: CheckCircle,  cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
    SUSPENDED:      { label: "Suspended",       icon: AlertTriangle,cls: "bg-orange-50  text-orange-700  dark:bg-orange-950/60  dark:text-orange-400  border-orange-200  dark:border-orange-800" },
    REJECTED:       { label: "Rejected",        icon: XCircle,      cls: "bg-red-50     text-red-700     dark:bg-red-950/60     dark:text-red-400     border-red-200     dark:border-red-800" },
};

const RISK_CFG: Record<SupplierRisk, { label: string; cls: string }> = {
    LOW:      { label: "Low",      cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
    MEDIUM:   { label: "Medium",   cls: "bg-amber-50   text-amber-700   dark:bg-amber-950/50   dark:text-amber-400"   },
    HIGH:     { label: "High",     cls: "bg-orange-50  text-orange-700  dark:bg-orange-950/50  dark:text-orange-400"  },
    CRITICAL: { label: "Critical", cls: "bg-red-50     text-red-700     dark:bg-red-950/50     dark:text-red-400"     },
};

function StatusBadge({ status }: { status: SupplierStatus }) {
    const cfg  = STATUS_CFG[status];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

function RiskBadge({ risk }: { risk: SupplierRisk }) {
    const cfg = RISK_CFG[risk];
    return (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/40">
                <Building2 className="h-7 w-7 text-violet-400" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {filtered ? "No suppliers match your filters" : "No suppliers yet"}
            </h3>
            <p className="mb-5 max-w-xs text-sm text-gray-400 dark:text-gray-500">
                {filtered
                    ? "Try adjusting your search or filter criteria."
                    : "Add your first supplier to start tracking your supply chain partners."}
            </p>
            {!filtered && (
                <Link href="/suppliers/create"
                    className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                    <Plus className="h-4 w-4" /> Add supplier
                </Link>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_STATUSES: SupplierStatus[] = ["PENDING_REVIEW", "APPROVED", "SUSPENDED", "REJECTED"];
const ALL_RISKS:    SupplierRisk[]   = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [total,     setTotal]     = useState(0);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState<string | null>(null);

    const [search,    setSearch]    = useState("");
    const [status,    setStatus]    = useState<SupplierStatus | "">("");
    const [risk,      setRisk]      = useState<SupplierRisk | "">("");
    const [page,      setPage]      = useState(1);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getSuppliers({
                search:     search  || undefined,
                status:     status  || undefined,
                risk_level: risk    || undefined,
                page,
                limit: 20,
            });
            setSuppliers(res.suppliers);
            setTotal(res.total);
        } catch {
            setError("Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    }, [search, status, risk, page]);

    useEffect(() => { load(); }, [load]);

    const isFiltered = !!(search || status || risk);

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

                <PageHeader
                    title="Suppliers"
                    subtitle={`${total} supplier${total !== 1 ? "s" : ""} in your network`}
                    actions={
                        <div className="flex items-center gap-2">
                            <button onClick={load} disabled={loading}
                                className="rounded-md p-1.5 text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-600">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </button>
                            <Link href="/suppliers/create"
                                className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors">
                                <Plus className="h-4 w-4" /> New supplier
                            </Link>
                        </div>
                    }
                />

                {/* ── Filters ── */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search company name, code…"
                            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-600"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <select value={status} onChange={(e) => { setStatus(e.target.value as SupplierStatus | ""); setPage(1); }}
                            className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-violet-400">
                            <option value="">All statuses</option>
                            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                        </select>
                        <select value={risk} onChange={(e) => { setRisk(e.target.value as SupplierRisk | ""); setPage(1); }}
                            className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-violet-400">
                            <option value="">All risk levels</option>
                            {ALL_RISKS.map((r) => <option key={r} value={r}>{RISK_CFG[r].label}</option>)}
                        </select>
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* ── Table ── */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    {loading ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 px-4 py-4">
                                    <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                        <div className="h-2.5 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                    </div>
                                    <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                                </div>
                            ))}
                        </div>
                    ) : suppliers.length === 0 ? (
                        <EmptyState filtered={isFiltered} />
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                <div className="col-span-4">Supplier</div>
                                <div className="col-span-2">Location</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-1">Risk</div>
                                <div className="col-span-2 text-center">Components</div>
                                <div className="col-span-1" />
                            </div>

                            {suppliers.map((s) => (
                                <Link key={s.id} href={`/suppliers/${s.id}`}
                                    className="grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">

                                    {/* Name + code */}
                                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase">
                                            {s.company_name.slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{s.company_name}</p>
                                            <p className="text-xs text-gray-400 font-mono">{s.supplier_code}</p>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="col-span-2 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                        {s.country ? (
                                            <><MapPin className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{s.country}</span></>
                                        ) : (
                                            <span className="text-gray-300 dark:text-gray-600">—</span>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2">
                                        <StatusBadge status={s.status} />
                                    </div>

                                    {/* Risk */}
                                    <div className="col-span-1">
                                        <RiskBadge risk={s.risk_level} />
                                    </div>

                                    {/* Counts */}
                                    <div className="col-span-2 text-center text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                                        {s._count?.components ?? 0}
                                    </div>

                                    {/* Arrow */}
                                    <div className="col-span-1 flex justify-end">
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Contact info strip under table (small) ── */}
                {!loading && suppliers.length > 0 && (
                    <p className="mt-3 text-xs text-gray-400 text-center">
                        Showing {suppliers.length} of {total} suppliers
                        {isFiltered && " · filtered"}
                    </p>
                )}

            </div>
        </div>
    );
}
