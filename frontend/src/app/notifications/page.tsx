"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Loader2, Truck, Building2, FileText, AlertOctagon, RefreshCw } from "lucide-react";
import { getNotifications, markNotificationRead, markAllRead } from "@/lib/api/notifications";
import type { Notification } from "@/types/shipment";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeIcon(type: string) {
  if (type.startsWith("shipment_")) return <Truck className="h-4 w-4" />;
  if (type.startsWith("supplier_")) return <Building2 className="h-4 w-4" />;
  if (type.startsWith("document_")) return <FileText className="h-4 w-4" />;
  if (type.startsWith("recall_"))   return <AlertOctagon className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
}

function typeColor(type: string): string {
  if (type.includes("delayed") || type.includes("customs") || type.includes("suspended")) return "text-amber-500";
  if (type.includes("delivered") || type.includes("approved"))  return "text-emerald-500";
  if (type.includes("cancelled") || type.includes("rejected"))  return "text-red-500";
  return "text-violet-500";
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)  return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60)  return `${min}m ago`;
  const hr  = Math.floor(min / 60);
  if (hr < 24)   return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [markingAll, setMarkingAll]       = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllRead();
      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
            <p className="mt-0.5 text-sm text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => load(true)} disabled={refreshing}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
              >
                {markingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Mark all read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <Bell className="h-7 w-7 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400">You'll see alerts here when shipments change status, suppliers are approved, and more.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`flex items-start gap-3 px-4 py-4 transition-colors ${
                  !n.read
                    ? "cursor-pointer bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                    : "bg-white dark:bg-gray-900"
                }`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${typeColor(n.type)}`}>
                  {typeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${n.read ? "text-gray-700 dark:text-gray-300" : "font-semibold text-gray-900 dark:text-gray-100"}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-violet-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{n.body}</p>
                  <p className="mt-1 text-[11px] text-gray-300 dark:text-gray-600">{relativeTime(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
