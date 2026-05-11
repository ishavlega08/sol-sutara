"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, Truck, ArrowRight, MapPin, Filter, ChevronRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { getShipments } from "@/lib/api/shipments";
import type { Shipment, ShipmentStatus, ShipmentPriority } from "@/types/shipment";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ShipmentStatus, { label: string; cls: string; dot: string }> = {
    CREATED:      { label: "Created",      cls: "bg-gray-100   text-gray-600   dark:bg-gray-800    dark:text-gray-400",      dot: "bg-gray-400"    },
    PICKED_UP:    { label: "Picked up",    cls: "bg-blue-50    text-blue-700   dark:bg-blue-950/50  dark:text-blue-400",      dot: "bg-blue-500"    },
    IN_TRANSIT:   { label: "In transit",   cls: "bg-violet-50  text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",   dot: "bg-violet-500"  },
    CUSTOMS_HOLD: { label: "Customs hold", cls: "bg-amber-50   text-amber-700  dark:bg-amber-950/50 dark:text-amber-400",    dot: "bg-amber-500"   },
    DELAYED:      { label: "Delayed",      cls: "bg-orange-50  text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",  dot: "bg-orange-500"  },
    DELIVERED:    { label: "Delivered",    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",dot: "bg-emerald-500" },
    CANCELLED:    { label: "Cancelled",    cls: "bg-red-50     text-red-700    dark:bg-red-950/50   dark:text-red-400",      dot: "bg-red-500"     },
};

const PRIORITY_CFG: Record<ShipmentPriority, { label: string; cls: string }> = {
    LOW:      { label: "Low",      cls: "text-gray-400"   },
    STANDARD: { label: "Standard", cls: "text-blue-500"   },
    HIGH:     { label: "High",     cls: "text-amber-500"  },
    URGENT:   { label: "Urgent",   cls: "text-red-500 font-bold" },
};

function StatusBadge({ status }: { status: ShipmentStatus }) {
    const cfg = STATUS_CFG[status];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function EmptyState({ filtered }: { filtered: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
                <Truck className="h-7 w-7 text-blue-400" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {filtered ? "No shipments match" : "No shipments yet"}
            </h3>
            <p className="mb-5 max-w-xs text-sm text-gray-400">
                {filtered ? "Try adjusting your filters." : "Track your first shipment to see live status here."}
            </p>
            {!filtered && (
                <Link href="/shipments/create"
                    className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                    <Plus className="h-4 w-4" /> New shipment
                </Link>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_STATUSES:   ShipmentStatus[]   = ["CREATED","PICKED_UP","IN_TRANSIT","CUSTOMS_HOLD","DELAYED","DELIVERED","CANCELLED"];
const ALL_PRIORITIES: ShipmentPriority[] = ["LOW","STANDARD","HIGH","URGENT"];

export default function ShipmentsPage() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [total,     setTotal]     = useState(0);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState<string | null>(null);
    const [search,    setSearch]    = useState("");
    const [status,    setStatus]    = useState<ShipmentStatus | "">("");
    const [priority,  setPriority]  = useState<ShipmentPriority | "">("");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await getShipments({ search: search || undefined, status: status || undefined, priority: priority || undefined, limit: 30 });
            setShipments(res.shipments);
            setTotal(res.total);
        } catch { setError("Failed to load shipments"); }
        finally { setLoading(false); }
    }, [search, status, priority]);

    useEffect(() => { load(); }, [load]);

    const counts = ALL_STATUSES.reduce((acc, s) => {
        acc[s] = shipments.filter((sh) => sh.status === s).length;
        return acc;
    }, {} as Record<ShipmentStatus, number>);

    const isFiltered = !!(search || status || priority);

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

                <PageHeader
                    title="Shipments"
                    subtitle={`${total} total shipment${total !== 1 ? "s" : ""}`}
                    actions={
                        <div className="flex items-center gap-2">
                            <button onClick={load} disabled={loading} className="rounded-md p-1.5 text-gray-400 hover:bg-white dark:hover:bg-gray-800">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </button>
                            <Link href="/shipments/create"
                                className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors">
                                <Plus className="h-4 w-4" /> New shipment
                            </Link>
                        </div>
                    }
                />

                {/* ── Pipeline summary ── */}
                {!loading && total > 0 && (
                    <div className="mb-5 grid grid-cols-4 gap-2 sm:grid-cols-7">
                        {ALL_STATUSES.map((s) => {
                            const cfg = STATUS_CFG[s];
                            const n   = counts[s] ?? 0;
                            return (
                                <button key={s} onClick={() => setStatus(status === s ? "" : s)}
                                    className={`rounded-lg border px-2 py-2 text-center transition-all ${
                                        status === s
                                            ? "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/40"
                                            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                                    }`}>
                                    <p className={`text-lg font-bold tabular-nums ${n > 0 ? "text-gray-900 dark:text-gray-100" : "text-gray-300 dark:text-gray-700"}`}>{n}</p>
                                    <p className="mt-0.5 text-[10px] font-medium text-gray-400 leading-tight">{cfg.label}</p>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Filters ── */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search shipment #, carrier, route…"
                            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <select value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus | "")}
                            className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-violet-400">
                            <option value="">All statuses</option>
                            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                        </select>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as ShipmentPriority | "")}
                            className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-violet-400">
                            <option value="">All priorities</option>
                            {ALL_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
                )}

                {/* ── Table ── */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    {loading ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 px-4 py-4">
                                    <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                        <div className="h-2.5 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                    </div>
                                    <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                                </div>
                            ))}
                        </div>
                    ) : shipments.length === 0 ? (
                        <EmptyState filtered={isFiltered} />
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                <div className="col-span-3">Shipment</div>
                                <div className="col-span-4">Route</div>
                                <div className="col-span-2">Supplier</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-1">ETA</div>
                            </div>
                            {shipments.map((sh) => {
                                const pCfg = PRIORITY_CFG[sh.priority];
                                return (
                                    <Link key={sh.id} href={`/shipments/${sh.id}`}
                                        className="grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                                                <Truck className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold font-mono text-gray-900 dark:text-gray-100">{sh.shipment_number}</p>
                                                <p className={`text-[11px] font-medium ${pCfg.cls}`}>{pCfg.label}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                                            <MapPin className="h-3 w-3 flex-shrink-0 text-gray-300" />
                                            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{sh.origin}</span>
                                            <ArrowRight className="h-3 w-3 flex-shrink-0 text-gray-300" />
                                            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{sh.destination}</span>
                                        </div>
                                        <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {sh.supplier?.company_name ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                                        </div>
                                        <div className="col-span-2"><StatusBadge status={sh.status} /></div>
                                        <div className="col-span-1 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">
                                                {sh.estimated_delivery
                                                    ? new Date(sh.estimated_delivery).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                                                    : "—"}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {!loading && shipments.length > 0 && (
                    <p className="mt-3 text-xs text-gray-400 text-center">
                        Showing {shipments.length} of {total}{isFiltered && " · filtered"}
                    </p>
                )}
            </div>
        </div>
    );
}
