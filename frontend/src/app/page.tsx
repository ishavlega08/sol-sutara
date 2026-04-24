"use client";

import Link from "next/link";
import { useState } from "react";
import { Download } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import BarChart from "@/components/ui/BarChart";
import SectionCard from "@/components/ui/SectionCard";

const STATS = [
  { label: "COMPONENTS",      value: "4,218", suffix: "total",  delta: "↑ 142 this week",  deltaUp: true,  accent: "#10b981" },
  { label: "LINKS",           value: "9,844", suffix: "",       delta: "↑ 318 this week",  deltaUp: true,  accent: "#7c3aed" },
  { label: "GRAPH DEPTH",     value: "7",     suffix: "tiers",  delta: "+1 vs last month", deltaUp: true,  accent: "#f59e0b" },
  { label: "HIGH-RISK NODES", value: "12",    suffix: "",       delta: "↑ 3 this week",    deltaUp: false, accent: "#06b6d4" },
];

const CHART_DATA: Record<string, number[]> = {
  Writes:  [32, 48, 28, 65, 42, 58, 51, 74, 44, 82, 58, 91, 76, 98],
  Traces:  [14, 22, 12, 38, 20, 34, 26, 45, 28, 52, 36, 61, 44, 70],
  Recalls: [2,   5,  3,  8,  4,  7,  5,  9,  6, 11,  8, 14, 10, 16],
};

const X_LABELS = ["Apr 06", "", "", "", "", "", "Apr 13", "", "", "", "", "", "", "Apr 20"];

const RISK = [
  { label: "HIGH",   count: "12 nodes",    color: "#ef4444", bg: "#fef2f2", bar: 8  },
  { label: "MEDIUM", count: "84 nodes",    color: "#f59e0b", bg: "#fffbeb", bar: 33 },
  { label: "LOW",    count: "4,122 nodes", color: "#10b981", bg: "#ecfdf5", bar: 96 },
];

const ACTIVITY = [
  { type: "CREATE", label: "CM-31·NMC-811 created by org:kaldera", time: "2m ago" },
  { type: "LINK",   label: "SP-02 → CM-18 linked",                 time: "8m"    },
  { type: "RECALL", label: "Recall simulated on SP-02·b-881",       time: "1h"    },
  { type: "TRACE",  label: "Trace PR-A · depth=6",                  time: "2h"    },
];

const ACTIVITY_BADGE: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: "#ecfdf5", color: "#059669" },
  LINK:   { bg: "#f5f3ff", color: "#7c3aed" },
  RECALL: { bg: "#fef2f2", color: "#ef4444" },
  TRACE:  { bg: "#ecfeff", color: "#0891b2" },
};

const QUICK = [
  { title: "+ New component",  desc: "Register on-chain",      href: "/components/create" },
  { title: "Load sample data", desc: "EV + Pharma + Food",     href: "#" },
  { title: "Run recall demo",  desc: "Simulate blast radius",  href: "/recall" },
  { title: "Get API key",      desc: "Integrate your ERP",     href: "#" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Writes");
  const bars = CHART_DATA[activeTab];

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
      <div className="px-4 py-6 sm:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{greeting()}, Ava.</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              Here&apos;s your supply-chain graph at a glance.
              <span className="rounded-md bg-gray-800 px-2 py-0.5 font-mono text-[11px] text-gray-300">devnet</span>
              <span className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 font-mono text-[11px] text-gray-500 dark:text-gray-400">last sync 14s ago</span>
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <Link
              href="/components/create"
              className="flex items-center gap-1 rounded-md px-3.5 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              + Create component
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Chart + Risk */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <SectionCard
            title="Activity · last 14 days"
            action={
              <div className="flex items-center gap-1">
                {Object.keys(CHART_DATA).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      activeTab === tab
                        ? "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-sm"
                        : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            }
          >
            <BarChart bars={bars} colorFrom="#7c3aed" colorTo="#10b981" xLabels={X_LABELS} height={160} />
          </SectionCard>

          <SectionCard
            title="Risk overview"
            action={
              <button className="text-xs font-medium text-violet-600 hover:text-violet-700 transition">
                View all →
              </button>
            }
          >
            <div className="flex flex-col gap-5">
              {RISK.map((r) => (
                <div key={r.label}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: r.bg, color: r.color }}>
                      ● {r.label}
                    </span>
                    <span className="text-xs text-gray-500">{r.count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${r.bar}%`, backgroundColor: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Activity + Quick actions */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard title="Recent activity">
            <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-800">
              {ACTIVITY.map((item, i) => {
                const b = ACTIVITY_BADGE[item.type];
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <span
                      className="flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: b.bg, color: b.color }}
                    >
                      {item.type}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="flex-shrink-0 text-xs text-gray-400">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Quick actions">
            <div className="grid grid-cols-2 gap-3">
              {QUICK.map((q) => (
                <Link
                  key={q.title}
                  href={q.href}
                  className="flex flex-col gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 transition hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">{q.title}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{q.desc}</span>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
