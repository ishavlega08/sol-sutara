"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, Truck, Search } from "lucide-react";
import { getShipments } from "@/lib/api/shipments";
import type { Shipment, ShipmentStatus } from "@/types/shipment";
import { StatusBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ActionButton from "@/components/ui/ActionButton";
import { useRole } from "@/hooks/useRole";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shipmentVariant(s: ShipmentStatus): "success" | "warning" | "error" | "default" | "info" {
  switch (s) {
    case "DELIVERED":   return "success";
    case "CREATED":     return "default";
    case "PICKED_UP":
    case "IN_TRANSIT":  return "info";
    case "CUSTOMS_HOLD":
    case "DELAYED":     return "warning";
    case "CANCELLED":   return "error";
    default:            return "default";
  }
}

function priorityVariant(p: string): "error" | "warning" | "info" | "default" {
  if (p === "URGENT") return "error";
  if (p === "HIGH")   return "warning";
  if (p === "STANDARD") return "info";
  return "default";
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {[40, 25, 25, 20, 20, 25].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 animate-pulse rounded bg-gray-100 dark:bg-gray-700" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

const PER_PAGE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShipmentsPage() {
  const [shipments, setShipments]   = useState<Shipment[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [page, setPage]             = useState(1);
  const { canCreate }               = useRole();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await getShipments({ search: search || undefined, status: statusFilter || undefined, page, limit: PER_PAGE });
      setShipments(res.shipments);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        <PageHeader
          title="Shipments"
          subtitle={<span>{total} shipments</span>}
          actions={
            <>
              <ActionButton variant="ghost" onClick={() => load(true)} disabled={refreshing}>
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </ActionButton>
              {canCreate && (
                <ActionButton variant="gradient">
                  <Link href="/shipments/create" className="flex items-center gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" />
                    New shipment
                  </Link>
                </ActionButton>
              )}
            </>
          }
        />

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search shipments…"
              className="w-44 bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="appearance-none rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 bg-white py-1.5 pl-3 pr-7 text-xs text-gray-600 outline-none hover:bg-gray-50 dark:hover:bg-gray-700">
              <option value="">All statuses</option>
              {["CREATED","PICKED_UP","IN_TRANSIT","CUSTOMS_HOLD","DELAYED","DELIVERED","CANCELLED"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left">
                  {["Shipment #", "Route", "Supplier", "Priority", "Status", "Est. Delivery"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                {!loading && shipments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                      <Truck className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                      No shipments yet.{" "}
                      {canCreate && (
                        <Link href="/shipments/create" className="text-violet-600 underline underline-offset-2">
                          Create the first one
                        </Link>
                      )}
                    </td>
                  </tr>
                )}

                {!loading && shipments.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => window.location.href = `/shipments/${s.id}`}
                    className="cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-violet-600">{s.shipment_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.origin}</p>
                      <p className="text-xs text-gray-400">→ {s.destination}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {s.supplier?.company_name ?? "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge label={s.priority} variant={priorityVariant(s.priority)} /></td>
                    <td className="px-4 py-3"><StatusBadge label={s.status.replace(/_/g, " ")} variant={shipmentVariant(s.status)} /></td>
                    <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                      {s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>Showing {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
                <ChevronLeft className="h-3 w-3" />Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
                Next<ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
