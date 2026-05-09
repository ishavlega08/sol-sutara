"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle } from "lucide-react";
import { patchComponentStatus } from "@/lib/api";
import type { ComponentStatus } from "@/types/component";

const ALL_STATUSES: ComponentStatus[] = [
  "CREATED", "IN_TRANSIT", "RECEIVED", "INSPECTED", "RECALLED", "ARCHIVED",
];

const STATUS_LABEL: Record<ComponentStatus, string> = {
  CREATED:    "Created",
  IN_TRANSIT: "In Transit",
  RECEIVED:   "Received",
  INSPECTED:  "Inspected",
  RECALLED:   "Recalled",
  ARCHIVED:   "Archived",
};

const STATUS_COLOR: Record<ComponentStatus, string> = {
  CREATED:    "#6b7280",
  IN_TRANSIT: "#2563eb",
  RECEIVED:   "#0891b2",
  INSPECTED:  "#7c3aed",
  RECALLED:   "#dc2626",
  ARCHIVED:   "#374151",
};

interface Props {
  componentId:    string;
  currentStatus:  ComponentStatus;
  onStatusChange: (newStatus: ComponentStatus) => void;
}

export default function StatusChanger({ componentId, currentStatus, onStatusChange }: Props) {
  const [selected, setSelected] = useState<ComponentStatus>(currentStatus);
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const isDirty = selected !== currentStatus;

  async function handleSave() {
    if (!isDirty) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await patchComponentStatus(componentId, { status: selected, notes: notes.trim() || undefined });
      onStatusChange(selected);
      setNotes("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Status selector */}
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => { setSelected(e.target.value as ComponentStatus); setSaved(false); }}
          disabled={saving}
          className="w-full appearance-none rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-3 pr-8 text-sm font-medium outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 disabled:opacity-50"
          style={{ color: STATUS_COLOR[selected] }}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s} style={{ color: STATUS_COLOR[s] }}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Notes */}
      {isDirty && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes (optional)…"
          rows={2}
          className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-violet-400 placeholder:text-gray-400 resize-none"
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!isDirty || saving}
        className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold text-white transition disabled:opacity-40"
        style={{ background: isDirty ? "linear-gradient(135deg, #7c3aed, #10b981)" : "#9ca3af" }}
      >
        {saved ? (
          <><CheckCircle className="h-3.5 w-3.5" /> Saved</>
        ) : saving ? (
          "Saving…"
        ) : (
          "Update status"
        )}
      </button>
    </div>
  );
}
