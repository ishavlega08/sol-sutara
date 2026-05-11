"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Truck, MapPin, ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { createShipment } from "@/lib/api/shipments";
import { getSuppliers } from "@/lib/api/suppliers";
import type { ShipmentPriority } from "@/types/shipment";
import type { Supplier } from "@/types/supplier";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {children}{required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
    );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input {...props}
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-violet-400 dark:focus:border-violet-600 transition-colors" />
    );
}

const PRIORITIES: { value: ShipmentPriority; label: string; cls: string }[] = [
    { value: "LOW",      label: "Low",      cls: "text-gray-500" },
    { value: "STANDARD", label: "Standard", cls: "text-blue-500" },
    { value: "HIGH",     label: "High",     cls: "text-amber-500" },
    { value: "URGENT",   label: "Urgent",   cls: "text-red-500" },
];

export default function CreateShipmentPage() {
    const router = useRouter();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [form, setForm] = useState({
        supplierId:        "",
        origin:            "",
        destination:       "",
        carrier:           "",
        trackingNumber:    "",
        priority:          "STANDARD" as ShipmentPriority,
        estimatedDelivery: "",
        notes:             "",
    });
    const [busy,  setBusy]  = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSuppliers({ limit: 100 }).then((res) => setSuppliers(res.suppliers)).catch(() => {});
    }, []);

    function set(field: string, value: string) {
        setForm((f) => ({ ...f, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.origin.trim())      { setError("Origin is required");      return; }
        if (!form.destination.trim()) { setError("Destination is required"); return; }
        setBusy(true);
        setError(null);
        try {
            const res = await createShipment({
                supplierId:        form.supplierId        || undefined,
                origin:            form.origin.trim(),
                destination:       form.destination.trim(),
                carrier:           form.carrier.trim()          || undefined,
                trackingNumber:    form.trackingNumber.trim()   || undefined,
                priority:          form.priority,
                estimatedDelivery: form.estimatedDelivery       || undefined,
                notes:             form.notes.trim()            || undefined,
            });
            router.push(`/shipments/${res.shipment.id}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create shipment");
            setBusy(false);
        }
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">

                <div className="mb-2">
                    <Link href="/shipments" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to shipments
                    </Link>
                </div>

                <PageHeader title="New shipment" subtitle="Create a new tracked shipment" />

                {error && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">

                    {/* ── Route ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-violet-500" />
                                <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                                <MapPin className="h-4 w-4 text-blue-500" />
                            </div>
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Route</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label required>Origin</Label>
                                <Input
                                    value={form.origin}
                                    onChange={(e) => set("origin", e.target.value)}
                                    placeholder="Shanghai, China"
                                    required
                                />
                            </div>
                            <div>
                                <Label required>Destination</Label>
                                <Input
                                    value={form.destination}
                                    onChange={(e) => set("destination", e.target.value)}
                                    placeholder="Los Angeles, USA"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Carrier & tracking ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-500" />
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Carrier & tracking</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Carrier</Label>
                                <Input
                                    value={form.carrier}
                                    onChange={(e) => set("carrier", e.target.value)}
                                    placeholder="DHL, FedEx, Maersk…"
                                />
                            </div>
                            <div>
                                <Label>Tracking number</Label>
                                <Input
                                    value={form.trackingNumber}
                                    onChange={(e) => set("trackingNumber", e.target.value)}
                                    placeholder="1Z999AA10123456784"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Details ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-200">Shipment details</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <div>
                                <Label>Supplier</Label>
                                <select
                                    value={form.supplierId}
                                    onChange={(e) => set("supplierId", e.target.value)}
                                    className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-400">
                                    <option value="">No supplier</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.company_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label>Priority</Label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => set("priority", e.target.value as ShipmentPriority)}
                                    className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-400">
                                    {PRIORITIES.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <Label>Estimated delivery</Label>
                                <Input
                                    type="date"
                                    value={form.estimatedDelivery}
                                    onChange={(e) => set("estimatedDelivery", e.target.value)}
                                />
                            </div>

                        </div>
                    </div>

                    {/* ── Notes ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <Label>Notes</Label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            placeholder="Any special handling instructions, customs notes, or internal remarks…"
                            rows={3}
                            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-violet-400 transition-colors resize-none"
                        />
                    </div>

                    {/* ── Actions ── */}
                    <div className="flex items-center justify-between pb-6">
                        <Link href="/shipments" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            Cancel
                        </Link>
                        <button type="submit" disabled={busy}
                            className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors">
                            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create shipment"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
