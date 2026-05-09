import { cn } from "@/lib/utils";
import * as React from "react";

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border bg-bg-elev overflow-hidden", className)} {...p} />;
}
export function CardHead({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-[18px] py-3.5 border-b border-border flex justify-between items-center", className)} {...p} />;
}
export function CardTitle({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-[13px] font-semibold", className)} {...p} />;
}
export function CardBody({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-[18px]", className)} {...p} />;
}

type BadgeTone = "accent" | "purple" | "coral" | "teal" | "danger" | "warn" | "muted";
const toneMap: Record<BadgeTone, string> = {
  accent: "text-accent border-accent/45 bg-accent/10",
  purple: "text-accent-2 border-accent-2/45 bg-accent-2/10",
  coral: "text-accent-3 border-accent-3/45 bg-accent-3/10",
  teal: "text-accent-4 border-accent-4/45 bg-accent-4/10",
  danger: "text-danger border-danger/45 bg-danger/10",
  warn: "text-warn border-warn/45 bg-warn/10",
  muted: "text-fg-muted border-border-strong",
};
export function Badge({ tone = "muted", children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-wider font-medium border",
      toneMap[tone], className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Stat({ label, value, unit, delta, accentIdx = 0 }: { label: string; value: React.ReactNode; unit?: string; delta?: React.ReactNode; accentIdx?: number }) {
  const bars = ["bg-accent", "bg-accent-2", "bg-accent-3", "bg-accent-4"];
  return (
    <div className="relative p-4 px-[18px] rounded-lg border border-border bg-bg-elev overflow-hidden">
      <div className={cn("absolute top-0 inset-x-0 h-0.5", bars[accentIdx % 4])} />
      <div className="font-mono text-[10px] tracking-wider uppercase text-fg-dim mb-2.5">{label}</div>
      <div className="font-display text-[28px] font-semibold tracking-tight leading-none">
        {value}
        {unit && <span className="text-sm text-fg-muted font-medium ml-1">{unit}</span>}
      </div>
      {delta && <div className="font-mono text-[11px] mt-2 text-accent">{delta}</div>}
    </div>
  );
}
