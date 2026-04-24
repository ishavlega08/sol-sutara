// Stat card with colored top accent — reused in Dashboard + Analytics

interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
  delta: string;
  deltaUp: boolean;
  accent: string;
}

export default function StatCard({ label, value, suffix, delta, deltaUp, accent }: StatCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="h-0.5 w-full" style={{ backgroundColor: accent }} />
      <div className="px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
        <p className="mt-2 text-[28px] font-bold leading-none text-gray-900 dark:text-gray-100">
          {value}
          {suffix && <span className="ml-1.5 text-sm font-normal text-gray-400 dark:text-gray-500">{suffix}</span>}
        </p>
        <p className={`mt-2 text-xs font-medium ${deltaUp ? "text-emerald-600" : "text-red-500"}`}>
          {delta}
        </p>
      </div>
    </div>
  );
}
