"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, RefreshCw, ExternalLink, Package, AlertCircle, GitBranch } from "lucide-react";
import { getComponents } from "@/lib/api";
import type { ComponentListItem } from "@/types/component";

function truncate(str: string, start = 6, end = 4) {
  if (!str || str.length <= start + end + 3) return str;
  return `${str.slice(0, start)}…${str.slice(-end)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TYPE_COLORS: Record<string, string> = {
  Component: "bg-blue-50 text-blue-700 border-blue-200",
  Assembly: "bg-violet-50 text-violet-700 border-violet-200",
  "Raw Material": "bg-amber-50 text-amber-700 border-amber-200",
  "Sub-assembly": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Finished Good": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_COLORS[type] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {type}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[60, 40, 50, 70, 35, 20].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-gray-100" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function ComponentsPage() {
  const [components, setComponents] = useState<ComponentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const res = await getComponents();
      setComponents(res.components);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load components");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="h-full overflow-y-auto mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Components</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {!loading && !error && `${components.length} component${components.length !== 1 ? "s" : ""} registered`}
            {loading && "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/components/create"
            className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New Component
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => load()}
            className="ml-auto text-sm font-medium text-red-600 underline underline-offset-2 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Supplier</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">On-Chain Address</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Tx Hash</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"></th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && !error && components.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState />
                </td>
              </tr>
            )}

            {!loading &&
              components.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">{c.name}</span>
                      <TypeBadge type={c.type} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.supplier}</td>
                  <td className="px-4 py-3">
                    <AddressCell value={c.on_chain_address} />
                  </td>
                  <td className="px-4 py-3">
                    <TxCell value={c.tx_hash} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/components/${c.id}/parents?name=${encodeURIComponent(c.name)}`}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                    >
                      <GitBranch className="h-3 w-3" />
                      Parents
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddressCell({ value }: { value: string }) {
  return (
    <span className="font-mono text-xs text-gray-500" title={value}>
      {truncate(value)}
    </span>
  );
}

function TxCell({ value }: { value: string }) {
  return (
    <a
      href={`https://explorer.solana.com/tx/${value}?cluster=devnet`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs text-gray-500 transition hover:text-gray-900"
      title={value}
    >
      {truncate(value)}
      <ExternalLink className="h-3 w-3 flex-shrink-0" />
    </a>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
        <Package className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-700">No components yet</p>
      <p className="mt-1 text-xs text-gray-400">
        Register your first supply chain component to get started.
      </p>
      <Link
        href="/components/create"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Create Component
      </Link>
    </div>
  );
}
