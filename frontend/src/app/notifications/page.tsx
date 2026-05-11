"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, RefreshCw, Truck, Package, AlertTriangle, Info, Building2, Boxes } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { getNotifications, markNotificationRead, markAllRead } from "@/lib/api/notifications";
import type { Notification } from "@/types/shipment";

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, { icon: React.ElementType; cls: string; bg: string }> = {
    SHIPMENT_STATUS_CHANGE: { icon: Truck,         cls: "text-blue-500",   bg: "bg-blue-50   dark:bg-blue-950/40"   },
    SHIPMENT_DELAYED:       { icon: AlertTriangle, cls: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40" },
    SHIPMENT_DELIVERED:     { icon: Truck,         cls: "text-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    CUSTOMS_HOLD:           { icon: AlertTriangle, cls: "text-amber-500",  bg: "bg-amber-50  dark:bg-amber-950/40"  },
    SUPPLIER_STATUS_CHANGE: { icon: Building2,     cls: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/40" },
    RECALL_ALERT:           { icon: AlertTriangle, cls: "text-red-500",    bg: "bg-red-50    dark:bg-red-950/40"    },
    COMPONENT_LINKED:       { icon: Boxes,         cls: "text-teal-500",   bg: "bg-teal-50   dark:bg-teal-950/40"   },
    SYSTEM:                 { icon: Info,          cls: "text-gray-500",   bg: "bg-gray-100  dark:bg-gray-800"      },
};

function getTypeCfg(type: string) {
    return TYPE_CFG[type] ?? TYPE_CFG["SYSTEM"];
}

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NotificationRow({
    notif,
    onMarkRead,
}: {
    notif: Notification;
    onMarkRead: (id: string) => void;
}) {
    const cfg  = getTypeCfg(notif.type);
    const Icon = cfg.icon;

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                !notif.read ? "bg-violet-50/40 dark:bg-violet-950/10" : ""
            }`}
        >
            {/* Icon */}
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                <Icon className={`h-4 w-4 ${cfg.cls}`} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className={`text-sm leading-snug ${!notif.read ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>
                            {notif.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{notif.body}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{relativeTime(notif.created_at)}</span>
                        {!notif.read && (
                            <button
                                onClick={() => onMarkRead(notif.id)}
                                title="Mark as read"
                                className="rounded-md p-1 text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-violet-600 transition-colors">
                                <CheckCheck className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Unread dot */}
            {!notif.read && (
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
            )}
        </div>
    );
}

function EmptyState({ filtered }: { filtered: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/40">
                <Bell className="h-7 w-7 text-violet-300 dark:text-violet-500" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {filtered ? "No unread notifications" : "You're all caught up"}
            </h3>
            <p className="max-w-xs text-sm text-gray-400">
                {filtered
                    ? "All notifications have been read."
                    : "Shipment updates, recall alerts, and supplier changes will appear here."}
            </p>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState<string | null>(null);
    const [unreadOnly,    setUnreadOnly]     = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await getNotifications(unreadOnly);
            setNotifications(res.notifications);
        } catch { setError("Failed to load notifications"); }
        finally { setLoading(false); }
    }, [unreadOnly]);

    useEffect(() => { load(); }, [load]);

    async function handleMarkRead(id: string) {
        await markNotificationRead(id);
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    }

    async function handleMarkAllRead() {
        await markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }

    const unreadCount = notifications.filter((n) => !n.read).length;
    const displayed   = unreadOnly ? notifications.filter((n) => !n.read) : notifications;

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">

                <PageHeader
                    title="Notifications"
                    subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                    actions={
                        <div className="flex items-center gap-2">
                            <button onClick={load} disabled={loading}
                                className="rounded-md p-1.5 text-gray-400 hover:bg-white dark:hover:bg-gray-800">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </button>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <CheckCheck className="h-4 w-4" /> Mark all read
                                </button>
                            )}
                        </div>
                    }
                />

                {/* ── Filter toggle ── */}
                <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setUnreadOnly(false)}
                        className={`px-3 pb-2 pt-1 text-sm font-medium transition-colors ${
                            !unreadOnly
                                ? "border-b-2 border-violet-600 text-violet-600 dark:text-violet-400"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}>
                        All
                        <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                            {notifications.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setUnreadOnly(true)}
                        className={`px-3 pb-2 pt-1 text-sm font-medium transition-colors ${
                            unreadOnly
                                ? "border-b-2 border-violet-600 text-violet-600 dark:text-violet-400"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}>
                        Unread
                        {unreadCount > 0 && (
                            <span className="ml-1.5 rounded-full bg-violet-100 dark:bg-violet-950 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* ── Notifications list ── */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    {loading ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                                    <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                        <div className="h-2.5 w-72 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : displayed.length === 0 ? (
                        <EmptyState filtered={unreadOnly} />
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {displayed.map((n) => (
                                <NotificationRow key={n.id} notif={n} onMarkRead={handleMarkRead} />
                            ))}
                        </div>
                    )}
                </div>

                {!loading && displayed.length > 0 && (
                    <p className="mt-3 text-xs text-gray-400 text-center">
                        Showing {displayed.length} notification{displayed.length !== 1 ? "s" : ""}
                        {unreadOnly && " · unread only"}
                    </p>
                )}

            </div>
        </div>
    );
}
