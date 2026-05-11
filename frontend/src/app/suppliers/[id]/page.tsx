"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Building2, Mail, Phone, MapPin, FileText,
    Package, Truck, AlertTriangle, CheckCircle, Clock, XCircle,
    ChevronDown, Edit2, Save, X, Loader2, RefreshCw, ExternalLink, Boxes,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { getSupplierById, updateSupplier, updateSupplierStatus } from "@/lib/api/suppliers";
import type { SupplierDetail, SupplierStatus, SupplierRisk } from "@/types/supplier";

// ─── Badge configs ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SupplierStatus, { label: string; icon: React.ElementType; cls: string }> = {
    PENDING_REVIEW: { label: "Pending review", icon: Clock,          cls: "bg-amber-50  text-amber-700  dark:bg-amber-950/60  dark:text-amber-400  border-amber-200  dark:border-amber-800" },
    APPROVED:       { label: "Approved",        icon: CheckCircle,   cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
    SUSPENDED:      { label: "Suspended",       icon: AlertTriangle, cls: "bg-orange-50  text-orange-700  dark:bg-orange-950/60  dark:text-orange-400  border-orange-200  dark:border-orange-800" },
    REJECTED:       { label: "Rejected",        icon: XCircle,       cls: "bg-red-50     text-red-700     dark:bg-red-950/60     dark:text-red-400     border-red-200     dark:border-red-800" },
};

const RISK_CFG: Record<SupplierRisk, { label: string; cls: string; dot: string }> = {
    LOW:      { label: "Low risk",      cls: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
    MEDIUM:   { label: "Medium risk",   cls: "text-amber-700   dark:text-amber-400",   dot: "bg-amber-500"   },
    HIGH:     { label: "High risk",     cls: "text-orange-700  dark:text-orange-400",  dot: "bg-orange-500"  },
    CRITICAL: { label: "Critical risk", cls: "text-red-700     dark:text-red-400",     dot: "bg-red-500"     },
};

const SHIPMENT_STATUS_CLS: Record<string, string> = {
    CREATED:      "bg-gray-100   text-gray-600   dark:bg-gray-800 dark:text-gray-400",
    PICKED_UP:    "bg-blue-50    text-blue-700   dark:bg-blue-950/50 dark:text-blue-400",
    IN_TRANSIT:   "bg-violet-50  text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
    CUSTOMS_HOLD: "bg-amber-50   text-amber-700  dark:bg-amber-950/50 dark:text-amber-400",
    DELAYED:      "bg-orange-50  text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
    DELIVERED:    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    CANCELLED:    "bg-red-50     text-red-700    dark:bg-red-950/50 dark:text-red-400",
};

const DOC_TYPE_LABEL: Record<string, string> = {
    INVOICE: "Invoice", CERTIFICATION: "Cert.", CUSTOMS: "Customs",
    INSPECTION_REPORT: "Inspection", BILL_OF_LADING: "BoL", OTHER: "Other",
};

// ─── Status change dropdown ───────────────────────────────────────────────────

function StatusDropdown({ current, onSelect, busy }: {
    current: SupplierStatus;
    onSelect: (s: SupplierStatus) => void;
    busy: boolean;
}) {
    const [open, setOpen] = useState(false);
    const options: SupplierStatus[] = ["PENDING_REVIEW", "APPROVED", "SUSPENDED", "REJECTED"];
    const cfg  = STATUS_CFG[current];
    const Icon = cfg.icon;

    return (
        <div className="relative">
            <button onClick={() => setOpen((o) => !o)} disabled={busy}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.cls} hover:opacity-80 transition-opacity`}>
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
                {cfg.label}
                <ChevronDown className="h-3 w-3 ml-0.5" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1.5 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                        {options.map((s) => {
                            const c = STATUS_CFG[s];
                            const I = c.icon;
                            return (
                                <button key={s} onClick={() => { onSelect(s); setOpen(false); }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 ${s === current ? "opacity-40 cursor-default" : ""}`}
                                    disabled={s === current}>
                                    <I className="h-3.5 w-3.5" style={{ color: undefined }} />
                                    {c.label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Editable field ───────────────────────────────────────────────────────────

function EditableField({ label, value, onSave, placeholder }: {
    label: string; value: string | null; onSave: (v: string) => Promise<void>; placeholder?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [draft,   setDraft]   = useState(value ?? "");
    const [busy,    setBusy]    = useState(false);

    async function save() {
        setBusy(true);
        await onSave(draft);
        setBusy(false);
        setEditing(false);
    }

    return (
        <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
            {editing ? (
                <div className="flex items-center gap-1.5">
                    <input value={draft} onChange={(e) => setDraft(e.target.value)}
                        className="flex-1 rounded-md border border-violet-400 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none"
                        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
                        autoFocus />
                    <button onClick={save} disabled={busy} className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => { setEditing(false); setDraft(value ?? ""); }}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <div className="group flex items-center gap-2">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{value || <span className="text-gray-400">{placeholder ?? "—"}</span>}</p>
                    <button onClick={() => { setDraft(value ?? ""); setEditing(true); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-0.5 text-gray-400 hover:text-gray-600">
                        <Edit2 className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupplierDetailPage() {
    const { id }     = useParams<{ id: string }>();
    const router     = useRouter();
    const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);
    const [statusBusy, setStatusBusy] = useState(false);
    const [tab, setTab] = useState<"overview" | "components" | "shipments" | "documents">("overview");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getSupplierById(id);
            setSupplier(res.supplier);
        } catch {
            setError("Supplier not found");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    async function changeStatus(status: SupplierStatus) {
        if (!supplier) return;
        setStatusBusy(true);
        try {
            await updateSupplierStatus(supplier.id, status);
            setSupplier((s) => s ? { ...s, status } : s);
        } catch { /* ignore */ }
        finally { setStatusBusy(false); }
    }

    async function saveField(field: string, value: string) {
        if (!supplier) return;
        await updateSupplier(supplier.id, { [field]: value || undefined });
        setSupplier((s) => s ? { ...s, [field]: value } : s);
    }

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
    );

    if (error || !supplier) return (
        <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-gray-500">{error ?? "Not found"}</p>
            <Link href="/suppliers" className="text-sm text-violet-600 hover:underline">← Back to suppliers</Link>
        </div>
    );

    const riskCfg = RISK_CFG[supplier.risk_level];

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

                <div className="mb-3">
                    <Link href="/suppliers" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <ArrowLeft className="h-3.5 w-3.5" /> Suppliers
                    </Link>
                </div>

                <PageHeader
                    title={supplier.company_name}
                    subtitle={
                        <span className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-400">{supplier.supplier_code}</span>
                            <span className={`flex items-center gap-1 text-xs font-semibold ${riskCfg.cls}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${riskCfg.dot}`} />
                                {riskCfg.label}
                            </span>
                        </span>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <button onClick={load} className="rounded-md p-1.5 text-gray-400 hover:bg-white dark:hover:bg-gray-800">
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            <StatusDropdown current={supplier.status} onSelect={changeStatus} busy={statusBusy} />
                        </div>
                    }
                />

                {/* ── Stat cards ── */}
                <div className="mb-6 grid grid-cols-3 gap-3">
                    {[
                        { icon: Package,  label: "Components",  value: supplier._count?.components ?? 0,  color: "text-violet-500" },
                        { icon: Truck,    label: "Shipments",   value: supplier._count?.shipments  ?? 0,  color: "text-blue-500"   },
                        { icon: FileText, label: "Documents",   value: supplier._count?.documents  ?? 0,  color: "text-emerald-500" },
                    ].map((card) => (
                        <div key={card.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3">
                            <card.icon className={`h-5 w-5 flex-shrink-0 ${card.color}`} />
                            <div>
                                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{card.value}</p>
                                <p className="text-xs text-gray-400">{card.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Tabs ── */}
                <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
                    {(["overview", "components", "shipments", "documents"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize transition-colors ${
                                tab === t
                                    ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}>
                            {t}
                            {t === "components" && supplier.components.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px]">{supplier.components.length}</span>
                            )}
                            {t === "shipments" && supplier.shipments.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px]">{supplier.shipments.length}</span>
                            )}
                            {t === "documents" && supplier.documents.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px]">{supplier.documents.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Overview tab ── */}
                {tab === "overview" && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Company</h3>
                            <EditableField label="Company name"   value={supplier.company_name}  onSave={(v) => saveField("company_name", v)} />
                            <EditableField label="Legal name"     value={supplier.legal_name}    onSave={(v) => saveField("legal_name", v)}    placeholder="Same as company name" />
                        </div>

                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Contact</h3>
                            <EditableField label="Email"   value={supplier.contact_email} onSave={(v) => saveField("contact_email", v)} placeholder="Not set" />
                            <EditableField label="Phone"   value={supplier.contact_phone} onSave={(v) => saveField("contact_phone", v)} placeholder="Not set" />
                            <EditableField label="Country" value={supplier.country}        onSave={(v) => saveField("country", v)}        placeholder="Not set" />
                            <EditableField label="Address" value={supplier.address}        onSave={(v) => saveField("address", v)}        placeholder="Not set" />
                        </div>

                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:col-span-2">
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Certifications</h3>
                            {supplier.certifications.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {supplier.certifications.map((c) => (
                                        <span key={c} className="rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-400">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No certifications recorded.</p>
                            )}
                        </div>

                        {supplier.notes && (
                            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:col-span-2">
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Notes</h3>
                                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-line">{supplier.notes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Components tab ── */}
                {tab === "components" && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                        {supplier.components.length === 0 ? (
                            <div className="flex flex-col items-center py-16 gap-3">
                                <Boxes className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm text-gray-400">No components linked to this supplier yet.</p>
                                <Link href="/components/create" className="text-sm text-violet-600 hover:underline">Register a component →</Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                    <div className="col-span-5">Name</div>
                                    <div className="col-span-3">Type</div>
                                    <div className="col-span-2">Status</div>
                                    <div className="col-span-2">Batch</div>
                                </div>
                                {supplier.components.map((c) => (
                                    <Link key={c.id} href={`/components/${c.id}`}
                                        className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-violet-50 dark:bg-violet-950/40">
                                                <Package className="h-3.5 w-3.5 text-violet-500" />
                                            </div>
                                            <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                                        </div>
                                        <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400 truncate">{c.type}</div>
                                        <div className="col-span-2">
                                            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                                                {c.status.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-xs text-gray-400 font-mono truncate">{c.batch_number ?? "—"}</div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Shipments tab ── */}
                {tab === "shipments" && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                        {supplier.shipments.length === 0 ? (
                            <div className="flex flex-col items-center py-16 gap-3">
                                <Truck className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm text-gray-400">No shipments linked to this supplier yet.</p>
                                <Link href="/shipments/create" className="text-sm text-violet-600 hover:underline">Create a shipment →</Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {supplier.shipments.map((sh) => (
                                    <Link key={sh.id} href={`/shipments/${sh.id}`}
                                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">{sh.shipment_number}</p>
                                            <p className="text-xs text-gray-400 truncate">{sh.origin} → {sh.destination}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SHIPMENT_STATUS_CLS[sh.status] ?? "bg-gray-100 text-gray-600"}`}>
                                            {sh.status.replace(/_/g, " ")}
                                        </span>
                                        <ChevronDown className="h-4 w-4 -rotate-90 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Documents tab ── */}
                {tab === "documents" && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                        {supplier.documents.length === 0 ? (
                            <div className="flex flex-col items-center py-16 gap-3">
                                <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm text-gray-400">No documents uploaded for this supplier.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {supplier.documents.map((doc) => (
                                    <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-400">{DOC_TYPE_LABEL[doc.type] ?? doc.type} · {new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <p className="mt-4 pb-6 text-xs text-gray-400">
                    Created {new Date(supplier.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    {supplier.creator?.email && ` by ${supplier.creator.email}`}
                </p>
            </div>
        </div>
    );
}
