"use client";

import type { ComponentEvent, ComponentStatus } from "@/types/component";

const STATUS_META: Record<ComponentStatus, { label: string; color: string; bg: string; dot: string }> = {
  CREATED:    { label: "Created",    color: "#6b7280", bg: "#f9fafb", dot: "#9ca3af" },
  IN_TRANSIT: { label: "In Transit", color: "#2563eb", bg: "#eff6ff", dot: "#3b82f6" },
  RECEIVED:   { label: "Received",   color: "#0891b2", bg: "#ecfeff", dot: "#06b6d4" },
  INSPECTED:  { label: "Inspected",  color: "#7c3aed", bg: "#f5f3ff", dot: "#8b5cf6" },
  RECALLED:   { label: "Recalled",   color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
  ARCHIVED:   { label: "Archived",   color: "#374151", bg: "#f3f4f6", dot: "#6b7280" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function StatusTimeline({ events }: { events: ComponentEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500">No status changes recorded yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {events.map((ev, i) => {
        const meta = STATUS_META[ev.toStatus] ?? STATUS_META.CREATED;
        const isLast = i === events.length - 1;
        return (
          <div key={ev.id} className="flex gap-3">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <div
                className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full border-2 border-white dark:border-gray-900 shadow"
                style={{ backgroundColor: meta.dot }}
              />
              {!isLast && <div className="mt-1 flex-1 w-px bg-gray-200 dark:bg-gray-700" />}
            </div>

            {/* Content */}
            <div className={`pb-4 ${isLast ? "" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.dot + "40" }}
                >
                  {meta.label}
                </span>
                {ev.fromStatus && (
                  <span className="text-[10px] text-gray-400">
                    from {STATUS_META[ev.fromStatus]?.label ?? ev.fromStatus}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                {ev.changedBy} · {formatDate(ev.createdAt)}
              </p>
              {ev.notes && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic">{ev.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
