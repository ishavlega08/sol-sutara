"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Download, PlusCircle, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, Table2 } from "lucide-react";
import { getComponents } from "@/lib/api";
import type { ComponentListItem } from "@/types/component";
import { RiskBadge, TypeBadge, OrgChip, type RiskLevel } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import ActionButton from "@/components/ui/ActionButton";

interface DisplayRow {
  id: string;
  name: string;
  type: string;
  org: string;
  risk: RiskLevel;
  created: string;
  txHash?: string;
}

const MOCK_ROWS: DisplayRow[] = [
  { id: "SP-01", name: "Lithium · Chile salar",    type: "Raw Material",  org: "org:aster",    risk: "LOW",    created: "2025-01-12" },
  { id: "SP-02", name: "Cobalt · DRC b-881",       type: "Raw Material",  org: "org:aster",    risk: "HIGH",   created: "2025-01-14" },
  { id: "SP-03", name: "Nickel · Philippines",     type: "Raw Material",  org: "org:aster",    risk: "MEDIUM", created: "2025-01-18" },
  { id: "SP-04", name: "Manganese · South Africa", type: "Raw Material",  org: "org:aster",    risk: "LOW",    created: "2025-01-20" },
  { id: "CM-18", name: "Cathode B-18",             type: "Component",     org: "org:meridian", risk: "MEDIUM", created: "2025-02-03" },
  { id: "CM-24", name: "Anode block A-24",         type: "Component",     org: "org:meridian", risk: "LOW",    created: "2025-02-07" },
  { id: "CM-31", name: "NMC-811 · cell precursor", type: "Component",     org: "org:kaldera",  risk: "HIGH",   created: "2025-02-11" },
  { id: "CM-44", name: "Electrolyte solution",     type: "Component",     org: "org:kaldera",  risk: "LOW",    created: "2025-02-19" },
  { id: "AS-07", name: "Battery module 48V",       type: "Assembly",      org: "org:meridian", risk: "MEDIUM", created: "2025-03-01" },
  { id: "AS-09", name: "Battery pack 96V",         type: "Assembly",      org: "org:meridian", risk: "LOW",    created: "2025-03-08" },
  { id: "PR-A",  name: "EV drivetrain unit",       type: "Finished Good", org: "org:meridian", risk: "LOW",    created: "2025-04-01" },
  { id: "PR-B",  name: "Stationary storage rack",  type: "Finished Good", org: "org:meridian", risk: "MEDIUM", created: "2025-04-10" },
];

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {[30, 45, 40, 35, 25, 35].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 animate-pulse rounded bg-gray-100 dark:bg-gray-700" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

const PER_PAGE = 12;

export default function ComponentsPage() {
  const [apiComponents, setApiComponents] = useState<ComponentListItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState("");
  const [riskFilter, setRiskFilter] = useState("All risk levels");
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const [page, setPage]         = useState(1);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getComponents();
      setApiComponents(res.components);
    } catch { /* fall back to mock */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows: DisplayRow[] = apiComponents.length > 0
    ? apiComponents.map((c, i) => ({
        id: c.id.slice(0, 6).toUpperCase(),
        name: c.name,
        type: c.type,
        org: c.supplier ? `org:${c.supplier.toLowerCase().replace(/\s+/g, "")}` : "org:meridian",
        risk: (["LOW", "MEDIUM", "HIGH"] as RiskLevel[])[i % 3],
        created: c.created_at.slice(0, 10),
        txHash: c.tx_hash,
      }))
    : MOCK_ROWS;

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.org.toLowerCase().includes(q);
    const matchRisk   = riskFilter === "All risk levels" || r.risk === riskFilter.toUpperCase();
    return matchSearch && matchRisk;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        <PageHeader
          title="Components"
          subtitle={
            <span>
              4,218 components across 3 industries ·{" "}
              <OrgChip org="org:meridian" />
            </span>
          }
          actions={
            <>
              <ActionButton variant="ghost" onClick={() => load(true)} disabled={loading || refreshing}>
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </ActionButton>
              <ActionButton variant="ghost">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </ActionButton>
              <ActionButton variant="gradient" className="hidden sm:inline-flex">
                <Link href="/components/create" className="flex items-center gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5" />
                  New component
                </Link>
              </ActionButton>
            </>
          }
        />

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search components, orgs…"
            className="w-full sm:w-64"
          />

          <div className="relative">
            <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              className="appearance-none rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 bg-white py-1.5 pl-3 pr-7 text-xs text-gray-600 outline-none hover:bg-gray-50 dark:hover:bg-gray-700">
              <option>All risk levels</option>
              <option>HIGH</option>
              <option>MEDIUM</option>
              <option>LOW</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="ml-auto flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5">
            {(["table", "graph"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition ${viewMode === m ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                {m === "table" ? <Table2 className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline capitalize">{m}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left">
                  {["ID", "Name", "Type", "Org", "Risk", "Created"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                {!loading && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                      No components match your filters.
                    </td>
                  </tr>
                )}

                {!loading && pageRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => window.location.href = `/components/${row.id}`}
                    className="cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-violet-600">{row.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-gray-200">{row.name}</span>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={row.type} /></td>
                    <td className="px-4 py-3"><OrgChip org={row.org} /></td>
                    <td className="px-4 py-3"><RiskBadge level={row.risk} /></td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{row.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length === rows.length ? "4,218" : filtered.length}</span>
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
