"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import type { ComponentListItem } from "@/types/component";

const TYPE_STYLES: Record<string, { border: string; bg: string; badge: string; dot: string }> = {
  "Component":       { border: "border-blue-300",   bg: "bg-blue-50/80",   badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-400" },
  "Assembly":        { border: "border-violet-300",  bg: "bg-violet-50/80", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  "Raw Material":    { border: "border-amber-300",   bg: "bg-amber-50/80",  badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-400" },
  "Sub-assembly":    { border: "border-cyan-300",    bg: "bg-cyan-50/80",   badge: "bg-cyan-100 text-cyan-700",    dot: "bg-cyan-400" },
  "Finished Good":   { border: "border-emerald-300", bg: "bg-emerald-50/80",badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
};

const DEFAULT = { border: "border-gray-200", bg: "bg-white", badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };

export default function ComponentNode({ data, selected }: NodeProps<ComponentListItem>) {
  const s = TYPE_STYLES[data.type] ?? DEFAULT;

  return (
    <div
      className={`w-52 rounded-xl border-2 px-4 py-3.5 shadow-sm transition-all select-none
        ${s.border} ${s.bg}
        ${selected ? "shadow-lg ring-2 ring-gray-900 ring-offset-2" : "hover:shadow-md"}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />

      <div className="flex items-center gap-1.5 mb-2">
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.badge}`}>
          {data.type}
        </span>
      </div>

      <p className="text-sm font-semibold leading-snug text-gray-900">{data.name}</p>
      <p className="mt-0.5 text-xs text-gray-500">{data.supplier}</p>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />
    </div>
  );
}
