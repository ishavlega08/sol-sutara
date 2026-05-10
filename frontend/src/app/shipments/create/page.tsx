"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createShipment } from "@/lib/api/shipments";
import { getSuppliers } from "@/lib/api/suppliers";
import type { Supplier } from "@/types/supplier";
import type { ShipmentPriority } from "@/types/shipment";

export default function CreateShipmentPage() {
  const router    = useRouter();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);

  useEffect(() => {
    getSuppliers({ limit: 100 }).then((r) => setSuppliers(r.suppliers)).catch(() => {});
  }, []);

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

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.origin.trim())      { setError("Origin is required");      return; }
    if (!form.destination.trim()) { setError("Destination is required"); return; }
    setLoading(true);
    setError(null);
    try {
      await createShipment({
        supplierId:        form.supplierId        || undefined,
        origin:            form.origin,
        destination:       form.destination,
        carrier:           form.carrier           || undefined,
        trackingNumber:    form.trackingNumber    || undefined,
        priority:          form.priority,
        estimatedDelivery: form.estimatedDelivery || undefined,
        notes:             form.notes             || undefined,
      });
      router.push("/shipments");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-500";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1";

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        <div className="mb-6 flex items-center gap-3">
          <Link href="/shipments" className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">New Shipment</h1>
            <p className="text-sm text-gray-400">Create a new shipment and start tracking it</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Route</p>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Origin <span className="text-red-500">*</span></label>
                <input className={inputCls} value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="Shanghai, China" required />
              </div>
              <div>
                <label className={labelCls}>Destination <span className="text-red-500">*</span></label>
                <input className={inputCls} value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Los Angeles, USA" required />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Carrier & tracking</p>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Carrier</label>
                <input className={inputCls} value={form.carrier} onChange={(e) => set("carrier", e.target.value)} placeholder="Maersk, FedEx, DHL…" />
              </div>
              <div>
                <label className={labelCls}>Tracking number</label>
                <input className={inputCls} value={form.trackingNumber} onChange={(e) => set("trackingNumber", e.target.value)} placeholder="1Z999AA10123456784" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Details</p>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Supplier</label>
                <select className={inputCls} value={form.supplierId} onChange={(e) => set("supplierId", e.target.value)}>
                  <option value="">No supplier linked</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.company_name} ({s.supplier_code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Priority</label>
                <select className={inputCls} value={form.priority} onChange={(e) => set("priority", e.target.value as ShipmentPriority)}>
                  <option value="LOW">Low</option>
                  <option value="STANDARD">Standard</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Estimated delivery</label>
                <input type="date" className={inputCls} value={form.estimatedDelivery} onChange={(e) => set("estimatedDelivery", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Notes</label>
                <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal notes…" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/shipments" className="rounded-md border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create shipment
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
