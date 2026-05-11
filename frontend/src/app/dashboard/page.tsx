"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    Boxes, Link2, AlertOctagon, GitMerge, ArrowRight,
    RefreshCw, Activity, Package, TrendingUp, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/ui/PageHeader";
import { getDashboardStats, getRecentLinks } from "@/lib/api";
import type { DashboardStats, RecentLink } from "@/types/component";
import { cacheGet, cacheSet, TTL } from "@/lib/apiCache";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-100 dark:bg-gray-800 ${className}`} />;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
    label, value, icon: Icon, color, href, loading,
}: {
    label:   string;
    value:   number | string;
    icon:    React.ElementType;
    color:   string;
    href?:   string;
    loading: boolean;
}) {
    const inner = (
        <div className="group relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in oklab, ${color} 12%, transparent)` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                </span>
                {href && (
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 transition group-hover:translate-x-0.5 group-hover:text-gray-400" />
                )}
            </div>
            {loading ? (
                <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                </>
            ) : (
                <>
                    <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-none">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
                </>
            )}
            {/* subtle bottom accent */}
            <div className="absolute bottom-0 left-0 h-0.5 w-full opacity-40"
                style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
        </div>
    );

    return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { user, org } = useAuth();

    const [stats,       setStats]      = useState<DashboardStats | null>(() => cacheGet("dashboard:stats", TTL.long));
    const [recentLinks, setRecentLinks] = useState<RecentLink[]>(() => cacheGet("dashboard:links", TTL.long) ?? []);
    const [loading,     setLoading]    = useState(() => !cacheGet("dashboard:stats", TTL.long));
    const [error,       setError]      = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!cacheGet("dashboard:stats", TTL.long)) setLoading(true);
        setError(null);
        try {
            const [s, l] = await Promise.all([
                getDashboardStats(),
                getRecentLinks(),
            ]);
            cacheSet("dashboard:stats", s.stats);
            cacheSet("dashboard:links", l.links ?? []);
            setStats(s.stats);
            setRecentLinks(l.links ?? []);
        } catch {
            setError("Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const hour   = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const firstName = user?.email?.split("@")[0] ?? "there";

    const statCards = [
        { label: "Total components",  value: stats?.totalComponents  ?? 0, icon: Boxes,       color: "#7c3aed", href: "/components" },
        { label: "Component links",   value: stats?.totalLinks       ?? 0, icon: Link2,       color: "#3b82f6", href: "/components/link" },
        { label: "Max graph depth",   value: stats?.maxGraphDepth    ?? 0, icon: GitMerge,    color: "#10b981", href: "/trace" },
        { label: "Active recalls",    value: stats?.activeRecallCount ?? 0, icon: AlertOctagon, color: stats?.activeRecallCount ? "#ef4444" : "#6b7280", href: "/recall" },
    ];

    return (
        <div className="h-full overflow-hidden bg-gray-50 dark:bg-gray-950 flex flex-col">
            <div className="flex flex-1 min-h-0 flex-col mx-auto w-full max-w-7xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">

                {/* Header row */}
                <div className="flex-shrink-0 mb-1 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{greeting}</h1>
                        <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
                            {org?.name && <strong className="text-gray-700 dark:text-gray-300">{org.name}</strong>}
                            {org?.name && " · "}
                            {firstName}
                        </p>
                    </div>
                    <button onClick={load} disabled={loading}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {error && (
                    <div className="flex-shrink-0 mt-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error} —{" "}
                        <button onClick={load} className="underline underline-offset-2">Retry</button>
                    </div>
                )}

                {/* ── Stat cards ── */}
                <div className="flex-shrink-0 mt-4 mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statCards.map((card) => (
                        <StatCard key={card.label} {...card} loading={loading} />
                    ))}
                </div>

                {/* ── Main content — fills remaining height, no scroll ── */}
                <div className="flex-1 min-h-0 grid grid-cols-1 gap-4 lg:grid-cols-5">

                    {/* Recent activity — takes full remaining height, clips overflow */}
                    <div className="lg:col-span-3 flex flex-col min-h-0">
                        <div className="flex flex-col h-full rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                            <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Recent activity</span>
                                </div>
                            </div>

                            {/* Items fill available height — overflow hidden so they clip, never scroll */}
                            <div className="flex-1 min-h-0 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                                            <Skeleton className="h-7 w-7 rounded-lg flex-shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <Skeleton className="h-3 w-48" />
                                            </div>
                                            <Skeleton className="h-2.5 w-10 flex-shrink-0" />
                                        </div>
                                    ))
                                ) : stats?.recentActivity?.length ? (
                                    stats.recentActivity.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                            <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                                                item.type === "CREATE"
                                                    ? "bg-violet-50 dark:bg-violet-950"
                                                    : "bg-blue-50 dark:bg-blue-950"
                                            }`}>
                                                {item.type === "CREATE"
                                                    ? <Package className="h-3.5 w-3.5 text-violet-500" />
                                                    : <Link2   className="h-3.5 w-3.5 text-blue-500"   />
                                                }
                                            </span>
                                            <p className="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-300 truncate">{item.label}</p>
                                            <span className="flex-shrink-0 text-[11px] tabular-nums text-gray-400">{item.time}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                                        <Activity className="mb-3 h-8 w-8 text-gray-200 dark:text-gray-700" />
                                        <p className="text-sm font-medium text-gray-400">No activity yet</p>
                                        <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">Create your first component to get started</p>
                                        <Link href="/components/create"
                                            className="mt-4 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition">
                                            Create component →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right column — flex so each section shares height ── */}
                    <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">

                        {/* Recent links — grows to fill available space, clips overflow */}
                        <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                            <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Link2 className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Recent links</span>
                                </div>
                                <Link href="/components/link" className="text-[11px] text-violet-600 hover:underline underline-offset-2">
                                    View all
                                </Link>
                            </div>

                            <div className="flex-1 min-h-0 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="px-4 py-3 space-y-1.5">
                                            <Skeleton className="h-3 w-full" />
                                            <Skeleton className="h-2.5 w-20" />
                                        </div>
                                    ))
                                ) : recentLinks.length ? (
                                    recentLinks.map((link) => (
                                        <div key={link.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                            <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                                <span className="font-medium">{link.parentName}</span>
                                                <span className="mx-1.5 text-gray-300 dark:text-gray-600">→</span>
                                                <span className="font-medium">{link.childName}</span>
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-gray-400 tabular-nums">{link.when}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-xs text-gray-400">No links yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick actions — fixed height at bottom */}
                        <div className="flex-shrink-0 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                            <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Quick actions</span>
                                </div>
                            </div>
                            <div className="p-3 grid grid-cols-2 gap-2">
                                {[
                                    { label: "New component", href: "/components/create", color: "#7c3aed", icon: Boxes },
                                    { label: "Link parts",    href: "/components/link",   color: "#3b82f6", icon: Link2 },
                                    { label: "Trace graph",   href: "/trace",             color: "#10b981", icon: GitMerge },
                                    { label: "Run recall",    href: "/recall",            color: "#ef4444", icon: ShieldAlert },
                                ].map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <Link key={action.label} href={action.href}
                                            className="flex flex-col items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-800 p-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg"
                                                style={{ background: `color-mix(in oklab, ${action.color} 10%, transparent)` }}>
                                                <Icon className="h-3.5 w-3.5" style={{ color: action.color }} />
                                            </span>
                                            {action.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
