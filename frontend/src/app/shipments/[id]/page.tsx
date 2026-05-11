"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Truck, MapPin, ArrowRight, Package, FileText,
    RefreshCw, CheckCircle, Clock, AlertTriangle, XCircle,
    ChevronDown, ExternalLink, User, Calendar,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { getShipmentById, updateShipmentStatus } from "@/lib/api/shipments";
import type { ShipmentDetail, ShipmentStatus, ShipmentEvent } from "@/types/shipment";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ShipmentStatus, { label: string; cls: string; dot: string; icon: React.ElementType }> = {
    CREATED:      { label: "Created",      cls: "bg-gray-100   text-gray-600   dark:bg-gray-800    dark:text-gray-400",      dot: "bg-gray-400",    icon: Clock         },
    PICKED_UP:    { label: "Picked up",    cls: "bg-blue-50    text-blue-700   dark:bg-blue-950/50  dark:text-blue-400",      dot: "bg-blue-500",    icon: Package       },
    IN_TRANSIT:   { label: "In transit",   cls: "bg-violet-50  text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",   dot: "bg-violet-500",  icon: Truck         },
    CUSTOMS_HOLD: { label: "Customs hold", cls: "bg-amber-50   text-amber-700  dark:bg-amber-950/50 dark:text-amber-400",    dot: "bg-amber-500",   icon: AlertTriangle },
    DELAYED:      { label: "Delayed",      cls: "bg-orange-50  text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",  dot: "bg-orange-500",  icon: AlertTriangle },
    DELIVERED:    { label: "Delivered",    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",dot: "bg-emerald-500", icon: CheckCircle   },
    CANCELLED:    { label: "Cancelled",    cls: "bg-red-50     text-red-700    dark:bg-red-950/50   dark:text-red-400",      dot: "bg-red-500",     icon: XCircle       },
};

const ALL_STATUSES: ShipmentStatus[] = ["CREATED","PICKED_UP","IN_TRANSIT","CUSTOMS_HOLD","DELAYED","DELIVERED","CANCELLED"];

const PRIORITY_CFG = {
    LOW:      { label: "Low",      cls: "text-gray-400"   },
    STANDARD: { label: "Standard", cls: "text-blue-500"   },
    HIGH:     { label: "High",     cls: "text-amber-500"  },
    URGENT:   { label: "Urgent",   cls: "text-red-500 font-bold" },
};

function StatusBadge({ status }: { status: ShipmentStatus }) {
    const cfg = STATUS_CFG[status];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ─── Update status modal ───────────────────────────────────────────────────────

function UpdateStatusModal({
    current, onClose, onSave,
}: {
    current: ShipmentStatus;
    onClose: () => void;
    onSave: (status: ShipmentStatus, location: string, notes: string) => Promise<void>;
}) {
    const [status,   setStatus]   = useState<ShipmentStatus>(current);
    const [location, setLocation] = useState("");
    const [notes,    setNotes]    = useState("");
    const [busy,     setBusy]     = useState(false);
    const [err,      setErr]      = useState<string | null>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true); setErr(null);
        try {
            await onSave(status, location, notes);
            onClose();
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Failed to update");
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl">
                <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Update shipment status</h3>
                </div>
                <form onSubmit={submit} className="p-5 space-y-4">
                    {err && <p className="text-sm text-red-500">{err}</p>}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">New status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
                            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-400">
                            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">Location (optional)</label>
                        <input value={location} onChange={(e) => setLocation(e.target.value)}
                            placeholder="Port of Long Beach, CA"
                            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-violet-400" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">Notes (optional)</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                            rows={3} placeholder="Any notes about this status change…"
                            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-violet-400 resize-none" />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                        <button type="submit" disabled={busy || status === current}
                            className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                            {busy ? "Saving…" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({ events }: { events: ShipmentEvent[] }) {
    if (events.length === 0) {
        return <p className="py-8 text-center text-sm text-gray-400">No events recorded yet.</p>;
    }

    return (
        <div className="relative space-y-0">
            {[...events].reverse().map((ev, idx, arr) => {
                const cfg = STATUS_CFG[ev.to_status];
                const Icon = cfg.icon;
                const isLast = idx === arr.length - 1;
                return (
                    <div key={ev.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${cfg.cls} border ${idx === 0 ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900" : ""}`}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
                        </div>
                        <div className="pb-4 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cfg.label}</span>
                                {ev.from_status && (
                                    <span className="text-xs text-gray-400">from {STATUS_CFG[ev.from_status].label}</span>
                                )}
                            </div>
                            {ev.location && (
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin className="h-3 w-3" /> {ev.location}
                                </p>
                            )}
                            {ev.notes && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{ev.notes}</p>}
                            <p className="mt-1 text-[11px] text-gray-400">
                                {new Date(ev.created_at).toLocaleString()} · {ev.recorder?.email ?? ev.recorded_by}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "events" | "documents";

export default function ShipmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [shipment,     setShipment]     = useState<ShipmentDetail | null>(null);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState<string | null>(null);
    const [tab,          setTab]          = useState<Tab>("overview");
    const [showUpdate,   setShowUpdate]   = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await getShipmentById(id);
            setShipment(res.shipment);
        } catch { setError("Shipment not found"); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    async function handleStatusUpdate(status: ShipmentStatus, location: string, notes: string) {
        await updateShipmentStatus(id, status, location || undefined, notes || undefined);
        await load();
    }

    if (loading) {
        return (
            <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                        <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-800" />
                        <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-800" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !shipment) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3">
                <Truck className="h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">{error ?? "Shipment not found"}</p>
                <Link href="/shipments" className="text-sm text-violet-600 hover:underline">Back to shipments</Link>
            </div>
        );
    }

    const pCfg = PRIORITY_CFG[shipment.priority];

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

                <div className="mb-2">
                    <Link href="/shipments" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to shipments
                    </Link>
                </div>

                <PageHeader
                    title={shipment.shipment_number}
                    subtitle={
                        <span className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${pCfg.cls}`}>{pCfg.label} priority</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">
                                Created {new Date(shipment.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                        </span>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <button onClick={load} className="rounded-md p-1.5 text-gray-400 hover:bg-white dark:hover:bg-gray-800">
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            <button onClick={() => setShowUpdate(true)}
                                className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                                <ChevronDown className="h-4 w-4" /> Update status
                            </button>
                        </div>
                    }
                />

                {/* ── Hero card ── */}
                <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Route */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                                <Truck className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400">From</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{shipment.origin}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-300 mx-1" />
                                <div className="text-center">
                                    <p className="text-xs text-gray-400">To</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{shipment.destination}</p>
                                </div>
                            </div>
                        </div>
                        {/* Status */}
                        <StatusBadge status={shipment.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4 sm:grid-cols-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Carrier</p>
                            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{shipment.carrier ?? "—"}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Tracking #</p>
                            <p className="mt-0.5 text-sm font-mono text-gray-700 dark:text-gray-300">{shipment.tracking_number ?? "—"}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Supplier</p>
                            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                                {shipment.supplier ? (
                                    <Link href={`/suppliers/${shipment.supplier_id}`} className="text-violet-600 hover:underline">
                                        {shipment.supplier.company_name}
                                    </Link>
                                ) : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Est. Delivery</p>
                            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                                {shipment.estimated_delivery
                                    ? new Date(shipment.estimated_delivery).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    {shipment.actual_delivery && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                Delivered {new Date(shipment.actual_delivery).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-800">
                    {(["overview", "events", "documents"] as Tab[]).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3 pb-2 pt-1 text-sm font-medium transition-colors capitalize ${
                                tab === t
                                    ? "border-b-2 border-violet-600 text-violet-600 dark:text-violet-400"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}>
                            {t}
                            {t === "events"    && <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold">{shipment.events.length}</span>}
                            {t === "documents" && <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold">{shipment.documents.length}</span>}
                        </button>
                    ))}
                </div>

                {/* ── Tab content ── */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">

                    {tab === "overview" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Shipment ID</p>
                                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{shipment.id}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Created by</p>
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-gray-400" />
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{shipment.creator?.email ?? "—"}</p>
                                    </div>
                                </div>
                                {shipment.notes && (
                                    <div className="sm:col-span-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Notes</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{shipment.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "events" && <Timeline events={shipment.events} />}

                    {tab === "documents" && (
                        <div>
                            {shipment.documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <FileText className="mb-3 h-8 w-8 text-gray-200 dark:text-gray-700" />
                                    <p className="text-sm text-gray-400">No documents attached</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {shipment.documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.name}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {doc.type} · {new Date(doc.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
                                                View <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* ── Footer stats ── */}
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {shipment._count?.events ?? shipment.events.length} events</span>
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {shipment._count?.documents ?? shipment.documents.length} documents</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Updated {new Date(shipment.created_at).toLocaleDateString()}</span>
                </div>

            </div>

            {showUpdate && (
                <UpdateStatusModal
                    current={shipment.status}
                    onClose={() => setShowUpdate(false)}
                    onSave={handleStatusUpdate}
                />
            )}
        </div>
    );
}
