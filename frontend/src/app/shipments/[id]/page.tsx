"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, FileText, MapPin, Clock, Loader2, ChevronDown, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { getShipmentById, updateShipmentStatus } from "@/lib/api/shipments";
import type { ShipmentDetail, ShipmentStatus, ShipmentEvent } from "@/types/shipment";
import { StatusBadge } from "@/components/ui/Badge";
import { useRole } from "@/hooks/useRole";

// ─── Status transition options per current status ─────────────────────────────

const TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED:      ["PICKED_UP", "CANCELLED"],
  PICKED_UP:    ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT:   ["CUSTOMS_HOLD", "DELAYED", "DELIVERED", "CANCELLED"],
  CUSTOMS_HOLD: ["IN_TRANSIT", "DELAYED", "CANCELLED"],
  DELAYED:      ["IN_TRANSIT", "CANCELLED"],
  DELIVERED:    [],
  CANCELLED:    [],
};

function statusVariant(s: ShipmentStatus) {
  switch (s) {
    case "DELIVERED":   return "success" as const;
    case "CREATED":     return "default" as const;
    case "PICKED_UP":
    case "IN_TRANSIT":  return "info" as const;
    case "CUSTOMS_HOLD":
    case "DELAYED":     return "warning" as const;
    case "CANCELLED":   return "error" as const;
    default:            return "default" as const;
  }
}

// ─── Tracking timeline ────────────────────────────────────────────────────────

function TimelineEvent({ event, isLast }: { event: ShipmentEvent; isLast: boolean }) {
  const isTerminal = event.to_status === "DELIVERED" || event.to_status === "CANCELLED";
  const isDelivered = event.to_status === "DELIVERED";
  const isCancelled = event.to_status === "CANCELLED";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 ${
          isDelivered ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-600" :
          isCancelled ? "border-red-300 bg-red-50 dark:bg-red-950 text-red-500" :
          "border-violet-300 bg-violet-50 dark:bg-violet-950 text-violet-600"
        }`}>
          {isDelivered ? <CheckCircle2 className="h-3.5 w-3.5" /> :
           isCancelled ? <AlertCircle className="h-3.5 w-3.5" /> :
           <Circle className="h-3 w-3 fill-current" />}
        </div>
        {!isLast && <div className="mt-1 w-0.5 flex-1 bg-gray-100 dark:bg-gray-700" style={{ minHeight: "24px" }} />}
      </div>
      <div className="pb-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{event.to_status.replace(/_/g, " ")}</span>
          {event.location && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />{event.location}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          {new Date(event.created_at).toLocaleString()}
          {event.recorder?.email && <span>· {event.recorder.email}</span>}
        </div>
        {event.notes && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{event.notes}</p>}
      </div>
    </div>
  );
}

// ─── Status updater ───────────────────────────────────────────────────────────

function StatusUpdater({ shipment, onUpdate }: { shipment: ShipmentDetail; onUpdate: () => void }) {
  const [open, setOpen]         = useState(false);
  const [toStatus, setToStatus] = useState<ShipmentStatus | "">("");
  const [location, setLocation] = useState("");
  const [notes, setNotes]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const options = TRANSITIONS[shipment.status];
  if (options.length === 0) return null;

  async function handleUpdate() {
    if (!toStatus) { setError("Select a status"); return; }
    setLoading(true);
    setError(null);
    try {
      await updateShipmentStatus(shipment.id, toStatus, location || undefined, notes || undefined);
      setOpen(false);
      setToStatus("");
      setLocation("");
      setNotes("");
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-500 placeholder:text-gray-400";

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Update status <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">New status *</label>
            <select className={inputCls} value={toStatus} onChange={(e) => setToStatus(e.target.value as ShipmentStatus)}>
              <option value="">Select status…</option>
              {options.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Location (optional)</label>
            <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Rotterdam, Netherlands" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Notes (optional)</label>
            <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Customs inspection complete…" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
            <button onClick={handleUpdate} disabled={loading}
              className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">{value || "—"}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShipmentDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const { role } = useRole();

  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const canUpdate = role === "MEMBER" || role === "ADMIN" || role === "OWNER";

  function loadShipment() {
    getShipmentById(id)
      .then((r) => setShipment(r.shipment))
      .catch(() => setError("Shipment not found"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadShipment(); }, [id]);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );

  if (error || !shipment) return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p className="text-sm text-gray-500">{error ?? "Not found"}</p>
      <Link href="/shipments" className="text-xs text-violet-600 underline">Back to shipments</Link>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <Link href="/shipments" className="mt-0.5 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-1 items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" />
                <span className="font-mono text-xs font-semibold text-violet-600">{shipment.shipment_number}</span>
                <StatusBadge label={shipment.status.replace(/_/g, " ")} variant={statusVariant(shipment.status)} />
              </div>
              <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                {shipment.origin} → {shipment.destination}
              </h1>
              {shipment.supplier && (
                <p className="mt-0.5 text-sm text-gray-400">
                  Supplier:{" "}
                  <Link href={`/suppliers/${shipment.supplier_id}`} className="text-violet-600 hover:underline">
                    {shipment.supplier.company_name}
                  </Link>
                </p>
              )}
            </div>
            {canUpdate && <StatusUpdater shipment={shipment} onUpdate={loadShipment} />}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">

            {/* Details */}
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Shipment Details</p>
              </div>
              <div className="grid grid-cols-2 gap-5 p-4 sm:grid-cols-3">
                <Detail label="Carrier"            value={shipment.carrier} />
                <Detail label="Tracking #"         value={shipment.tracking_number} />
                <Detail label="Priority"           value={shipment.priority} />
                <Detail label="Est. Delivery"      value={shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString() : null} />
                <Detail label="Actual Delivery"    value={shipment.actual_delivery ? new Date(shipment.actual_delivery).toLocaleDateString() : null} />
                <Detail label="Created"            value={new Date(shipment.created_at).toLocaleDateString()} />
                {shipment.notes && <div className="col-span-full"><Detail label="Notes" value={shipment.notes} /></div>}
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tracking Timeline ({shipment.events.length} events)</p>
              </div>
              <div className="p-4">
                {shipment.events.length === 0 ? (
                  <p className="text-sm text-gray-400">No tracking events yet.</p>
                ) : (
                  [...shipment.events].reverse().map((event, i, arr) => (
                    <TimelineEvent key={event.id} event={event} isLast={i === arr.length - 1} />
                  ))
                )}
              </div>
            </div>

            {/* Documents */}
            {shipment.documents.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Documents ({shipment.documents.length})</p>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {shipment.documents.map((d) => (
                    <a key={d.id} href={d.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-gray-800 dark:text-gray-200">{d.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{d.type}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {[
              { label: "Tracking Events", value: shipment._count?.events  ?? 0, color: "#7c3aed" },
              { label: "Documents",       value: shipment._count?.documents ?? 0, color: "#10b981" },
            ].map(({ label, value, color }) => (
              <div key={label} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="h-0.5" style={{ background: color }} />
                <div className="px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
