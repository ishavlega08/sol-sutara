"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, Building2, Search } from "lucide-react";
import { getSuppliers } from "@/lib/api/suppliers";
import type { Supplier, SupplierStatus, SupplierRisk } from "@/types/supplier";
import { StatusBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ActionButton from "@/components/ui/ActionButton";
import { useRole } from "@/hooks/useRole";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusVariant(s: SupplierStatus): "success" | "warning" | "error" | "default" | "info" {
  if (s === "APPROVED")       return "success";
  if (s === "PENDING_REVIEW") return "warning";
  if (s === "SUSPENDED")      return "error";
  if (s === "REJECTED")       return "error";
  return "default";
}

function riskVariant(r: SupplierRisk): "success" | "warning" | "error" | "default" {
  if (r === "LOW")      return "success";
  if (r === "MEDIUM")   return "warning";
  if (r === "HIGH")     return "error";
  if (r === "CRITICAL") return "error";
  return "default";
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {[40, 30, 25, 20, 20, 25].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 animate-pulse rounded bg-gray-100 dark:bg-gray-700" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

const PER_PAGE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [riskFilter, setRisk]       = useState("");
  const [page, setPage]             = useState(1);
  const { canCreate }               = useRole();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await getSuppliers({ search: search || undefined, status: statusFilter || undefined, risk_level: riskFilter || undefined, page, limit: PER_PAGE });
      setSuppliers(res.suppliers);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, riskFilter, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <PageHeader
          title="Suppliers"
          subtitle={<span>{total} suppliers</span>}
          actions={
            <>
              <ActionButton variant="ghost" onClick={() => load(true)} disabled={refreshing}>
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </ActionButton>
              {canCreate && (
                <ActionButton variant="gradient">
                  <Link href="/suppliers/create" className="flex items-center gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" />
                    New supplier
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
              placeholder="Search suppliers…"
              className="w-48 bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none placeholder:text-gray-400"
            />
          </div>

          {(["", "PENDING_REVIEW", "APPROVED", "SUSPENDED", "REJECTED"] as const).map((s, i) => (
            <div key={s} className="relative">
              {i === 0 ? (
                <div className="relative">
                  <select value={statusFilter} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="appearance-none rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 bg-white py-1.5 pl-3 pr-7 text-xs text-gray-600 outline-none hover:bg-gray-50 dark:hover:bg-gray-700">
                    <option value="">All statuses</option>
                    <option value="PENDING_REVIEW">Pending review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                </div>
              ) : null}
            </div>
          )).filter((_, i) => i === 0)}

          <div className="relative">
            <select value={riskFilter} onChange={(e) => { setRisk(e.target.value); setPage(1); }}
              className="appearance-none rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 bg-white py-1.5 pl-3 pr-7 text-xs text-gray-600 outline-none hover:bg-gray-50 dark:hover:bg-gray-700">
              <option value="">All risk levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left">
                  {["Supplier", "Code", "Country", "Status", "Risk", "Shipments"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                {!loading && suppliers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                      <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                      No suppliers yet.{" "}
                      {canCreate && (
                        <Link href="/suppliers/create" className="text-violet-600 underline underline-offset-2">
                          Add your first supplier
                        </Link>
                      )}
                    </td>
                  </tr>
                )}

                {!loading && suppliers.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => window.location.href = `/suppliers/${s.id}`}
                    className="cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{s.company_name}</p>
                      {s.contact_email && <p className="text-xs text-gray-400">{s.contact_email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] text-gray-500 dark:text-gray-400">{s.supplier_code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{s.country ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge label={s.status.replace("_", " ")} variant={statusVariant(s.status)} /></td>
                    <td className="px-4 py-3"><StatusBadge label={s.risk_level} variant={riskVariant(s.risk_level)} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{s._count?.shipments ?? 0}</td>
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
