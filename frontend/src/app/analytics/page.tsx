"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import BarChart from "@/components/ui/BarChart";
import { getAnalytics, getTimeSeries } from "@/lib/api";
import type { AnalyticsResult, TimeSeriesData } from "@/types/component";

type Period = "7d" | "30d" | "90d" | "All";

const TYPE_COLORS: Record<string, string> = {
  RAW_MATERIAL:  "#7c3aed",
  COMPONENT:     "#06b6d4",
  ASSEMBLY:      "#f59e0b",
  FINISHED_GOOD: "#10b981",
};

function typeColor(type: string): string {
  return TYPE_COLORS[type.toUpperCase().replace(/\s+/g, "_")] ?? "#6b7280";
}

function DonutChart({ data }: { data: Array<{ label: string; pct: number; color: string }> }) {
  const r = 70; const cx = 90; const cy = 90;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = data.map(({ pct, color, label }) => {
    const len = (pct / 100) * circumference;
    const seg = { color, label, pct, dasharray: `${len} ${circumference}`, dashoffset: -offset };
    offset += len;
    return seg;
  });
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="18" />
        {segments.map((seg, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="18"
            strokeDasharray={seg.dasharray} strokeDashoffset={seg.dashoffset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        ))}
      </svg>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {data.map(({ label, pct, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label} · {pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
  );
}

const PERIODS: Period[] = ["7d", "30d", "90d", "All"];

export default function AnalyticsPage() {
  const [period, setPeriod]       = useState<Period>("30d");
  const [data, setData]           = useState<AnalyticsResult | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const apiPeriod = period === "All" ? "all" : period.toLowerCase();
    // Always fetch 2 years for the growth chart so historical data is never clipped.
    // The stat cards use the period selector; the chart shows the full picture.
    Promise.allSettled([getAnalytics(apiPeriod), getTimeSeries(104)]).then(([analyticsRes, tsRes]) => {
      if (analyticsRes.status === "fulfilled") setData(analyticsRes.value.analytics);
      else setError("Failed to load analytics");
      if (tsRes.status === "fulfilled") setTimeSeries(tsRes.value.timeSeries);
    }).finally(() => setLoading(false));
  }, [period]);

  // Build stat cards from real data
  const stats = data
    ? [
        { label: "TOTAL COMPONENTS",    value: data.totalComponents.toLocaleString(),  delta: "live",  deltaUp: true,  accent: "#10b981" },
        { label: "TOTAL LINKS",         value: data.totalLinks.toLocaleString(),        delta: "live",  deltaUp: true,  accent: "#7c3aed" },
        { label: "MAX GRAPH DEPTH",     value: String(data.maxGraphDepth),              delta: "tiers", deltaUp: true,  accent: "#f59e0b" },
        { label: "AVG PARENTS / NODE",  value: String(data.avgParentsPerNode),          delta: "ratio", deltaUp: false, accent: "#06b6d4" },
      ]
    : [];

  // Build type breakdown for donut
  const totalTypeCount = data?.componentsByType.reduce((s, t) => s + t.count, 0) ?? 1;
  const donutData = (data?.componentsByType ?? []).map((t) => ({
    label: t.type,
    pct:   Math.round((t.count / totalTypeCount) * 1000) / 10,
    color: typeColor(t.type),
  }));

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
            <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">Graph-wide intelligence. Powered by the indexer.</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded px-3 py-1 text-xs font-medium transition ${
                    period === p ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : stats.map((s) => <StatCard key={s.label} {...s} />)
          }
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard title="Growth · components created">
            {loading || !timeSeries ? (
              <div className="h-44 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            ) : (() => {
              // Strip leading weeks where nothing was created so the chart
              // starts from when the first component actually appeared.
              const firstIdx = timeSeries.components.findIndex((v) => v > 0);
              const bars   = firstIdx >= 0 ? timeSeries.components.slice(firstIdx) : timeSeries.components;
              const labels = firstIdx >= 0 ? timeSeries.weeks.slice(firstIdx)      : timeSeries.weeks;
              return bars.every((v) => v === 0) ? (
                <div className="flex h-44 items-center justify-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">No components created yet.</p>
                </div>
              ) : (
                <BarChart
                  bars={bars}
                  colorFrom="#10b981"
                  colorTo="#7c3aed"
                  xLabels={labels.map((w, i) => i === labels.length - 1 ? "now" : w.slice(5))}
                  height={176}
                />
              );
            })()}
          </SectionCard>

          <SectionCard title="Most reused components" noPadding>
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                ))}
              </div>
            ) : (data?.mostReused ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">No links yet — create some component relationships.</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {(data?.mostReused ?? []).map((r, i) => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <span className="w-6 text-xs font-semibold text-gray-400">#{i + 1}</span>
                    <span className="flex-1 text-gray-700 dark:text-gray-300">{r.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{r.type}</span>
                    <span className="font-semibold text-violet-600">{r.childCount}x</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Components by type">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-32 w-32 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
              </div>
            ) : donutData.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No components yet.</p>
            ) : (
              <DonutChart data={donutData} />
            )}
          </SectionCard>

          <SectionCard title="Highest recall impact" noPadding>
            {loading ? (
              <div className="px-5 py-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                ))}
              </div>
            ) : (data?.recallImpact ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">No downstream links found yet.</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800 px-5">
                {(data?.recallImpact ?? []).map((r) => {
                  const maxAffected = data!.recallImpact[0]?.affectedCount ?? 1;
                  const pct = Math.round((r.affectedCount / maxAffected) * 100);
                  return (
                    <div key={r.id} className="py-3">
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{r.name}</span>
                        <span className="text-gray-400">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{r.affectedCount}</span> affected
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
