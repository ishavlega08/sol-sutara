"use client";

import { type NodeProps } from "reactflow";

interface LaneLabelData {
  label: string;
  dotColor: string;
  bgColor: string;
  borderColor: string;
}

export default function LaneLabelNode({ data }: NodeProps<LaneLabelData>) {
  return (
    <div className="pointer-events-none select-none">
      <div
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap shadow-sm"
        style={{
          color: data.dotColor,
          backgroundColor: data.bgColor,
          borderColor: data.borderColor,
        }}
      >
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: data.dotColor }}
        />
        {data.label}
      </div>
    </div>
  );
}
