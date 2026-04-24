"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import BarChart from "@/components/ui/BarChart";

type Period = "7d" | "30d" | "90d" | "All";

const STATS = [
  { label: "TOTAL COMPONENTS",   value: "4,218", delta: "+ 482 (30d)", deltaUp: true,  accent: "#10b981" },
  { label: "TOTAL LINKS",        value: "9,844", delta: "+ 1,204",     deltaUp: true,  accent: "#7c3aed" },
  { label: "AVG GRAPH DEPTH",    value: "4.2",   delta: "+ 0.3",       deltaUp: true,  accent: "#f59e0b" },
  { label: "RECALL IMPACT (AVG)", value: "812",  suffix: "units", delta: "+ 12%", deltaUp: false, accent: "#06b6d4" },
];

const GROWTH_BARS = [12,14,13,15,16,15,17,18,20,19,21,22,20,23,24,22,25,26,27,28,27,29,30,31,33,34,35,36,38,42];

const REUSED = [
  { id: "SP-02", name: "Cobalt · DRC",    count: 1842, first: true },
  { id: "SP-01", name: "Lithium · Chile", count: 1612 },
  { id: "CM-31", name: "Cell · NMC-811",  count: 984 },
  { id: "SP-04", name: "Graphite · CN",   count: 722 },
  { id: "CM-18", name: "Cathode B-18",    count: 418 },
];

const INDUSTRIES = [
  { name: "Automotive / EV",    count: 2814, pct: 67, color: "#7c3aed" },
  { name: "Pharma / Biologics", count: 912,  pct: 22, color: "#06b6d4" },
  { name: "Food & Agriculture", count: 492,  pct: 11, color: "#f59e0b" },
];

const RISK_DONUT = [
  { label: "Low",  pct: 97.7, color: "#10b981" },
  { label: "Med",  pct: 2.0,  color: "#f59e0b" },
  { label: "High", pct: 0.3,  color: "#ef4444" },
];

function DonutChart() {
  const r = 70; const cx = 90; const cy = 90;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = RISK_DONUT.map(({ pct, color, label }) => {
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
        {RISK_DONUT.map(({ label, pct, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label} · {pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PERIODS: Period[] = ["7d", "30d", "90d", "All"];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

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

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard title="Growth · components created">
            <BarChart bars={GROWTH_BARS} colorFrom="#10b981" colorTo="#7c3aed" height={176} />
          </SectionCard>

          <SectionCard title="Most reused components" noPadding>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {REUSED.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <span className="w-10 font-mono text-xs font-semibold text-violet-600">{r.id}</span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{r.name}</span>
                  <span className="text-xs text-gray-500">
                    {r.first
                      ? <><span className="text-gray-400 dark:text-gray-500">reused in </span><span className="font-semibold text-gray-700 dark:text-gray-300">{r.count.toLocaleString()}</span></>
                      : <span className="font-semibold text-gray-700 dark:text-gray-300">{r.count.toLocaleString()}</span>
                    }
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Risk distribution">
            <DonutChart />
          </SectionCard>

          <SectionCard title="Components by industry" noPadding>
            <div className="divide-y divide-gray-50 dark:divide-gray-800 px-5">
              {INDUSTRIES.map((ind) => (
                <div key={ind.name} className="py-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{ind.name}</span>
                    <span className="text-gray-400 dark:text-gray-500">
                      {ind.count.toLocaleString()} · <span className="font-semibold text-gray-700 dark:text-gray-300">{ind.pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className="h-full rounded-full transition-all" style={{ width: `${ind.pct}%`, backgroundColor: ind.color }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
