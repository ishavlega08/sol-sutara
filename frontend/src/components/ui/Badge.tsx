// Shared badge primitives reused across all screens

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "low" | "medium" | "high";
export type ComponentType = "Raw Material" | "Component" | "Sub-assembly" | "Assembly" | "Finished Good" | string;

const RISK_CLS: Record<string, string> = {
  LOW:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH:   "bg-red-50 text-red-600 border-red-200",
};

const TYPE_CLS: Record<string, string> = {
  "Raw Material":  "bg-amber-50 text-amber-700 border-amber-200",
  Component:       "bg-blue-50 text-blue-700 border-blue-200",
  "Sub-assembly":  "bg-cyan-50 text-cyan-700 border-cyan-200",
  Assembly:        "bg-violet-50 text-violet-700 border-violet-200",
  "Finished Good": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function RiskBadge({ level, short }: { level: RiskLevel; short?: boolean }) {
  const key = level.toUpperCase() as "LOW" | "MEDIUM" | "HIGH";
  const cls = RISK_CLS[key] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const text = short && key === "MEDIUM" ? "MED" : key;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
    </span>
  );
}

export function TypeBadge({ type }: { type: ComponentType }) {
  const cls = TYPE_CLS[type] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {type}
    </span>
  );
}

export function StatusBadge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
}) {
  const cls = {
    default: "bg-gray-100 text-gray-600 border-gray-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error:   "bg-red-50 text-red-600 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info:    "bg-blue-50 text-blue-700 border-blue-200",
  }[variant];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function OrgChip({ org }: { org: string }) {
  return (
    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-500">
      {org}
    </span>
  );
}
