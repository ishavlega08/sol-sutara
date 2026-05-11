// Reusable bar chart — used in Dashboard activity chart + Analytics growth chart

interface BarChartProps {
  bars: number[];
  colorFrom?: string;
  colorTo?: string;
  xLabels?: string[];
  height?: number;
  showValues?: boolean;
}

export default function BarChart({
  bars,
  colorFrom = "#7c3aed",
  colorTo = "#10b981",
  xLabels,
  height = 160,
  showValues,
}: BarChartProps) {
  const max = Math.max(...bars, 1);

  // Y-axis guide values: 0, 50%, 100%
  const yMid = Math.round(max / 2);

  function barColor(i: number) {
    const ratio = bars.length > 1 ? i / (bars.length - 1) : 1;
    const r1 = parseInt(colorFrom.slice(1, 3), 16);
    const g1 = parseInt(colorFrom.slice(3, 5), 16);
    const b1 = parseInt(colorFrom.slice(5, 7), 16);
    const r2 = parseInt(colorTo.slice(1, 3), 16);
    const g2 = parseInt(colorTo.slice(3, 5), 16);
    const b2 = parseInt(colorTo.slice(5, 7), 16);
    return `rgb(${Math.round(r1 + ratio*(r2-r1))},${Math.round(g1 + ratio*(g2-g1))},${Math.round(b1 + ratio*(b2-b1))})`;
  }

  // Show inline value labels when bars are wide enough (few bars) or when explicitly requested
  const showLabels = showValues ?? bars.length <= 24;

  return (
    <div className="flex gap-2">
      {/* Y-axis */}
      <div className="flex flex-col justify-between py-0 text-right" style={{ height }}>
        <span className="text-[9px] tabular-nums text-gray-400 dark:text-gray-600 leading-none">{max}</span>
        <span className="text-[9px] tabular-nums text-gray-400 dark:text-gray-600 leading-none">{yMid}</span>
        <span className="text-[9px] tabular-nums text-gray-400 dark:text-gray-600 leading-none">0</span>
      </div>

      {/* Chart area */}
      <div className="flex-1 min-w-0">
        {/* Grid lines */}
        <div className="relative" style={{ height }}>
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-100 dark:border-gray-800" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100 dark:border-gray-800" />
          <div className="absolute inset-x-0 bottom-0 border-t border-gray-100 dark:border-gray-800" />

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-px">
            {bars.map((val, i) => {
              const color = barColor(i);
              const barH = Math.max(val > 0 ? 2 : 0, Math.round((val / max) * height));
              return (
                <div key={i} className="relative flex flex-1 flex-col items-center justify-end h-full group">
                  {/* Value label — shown on hover always, shown statically when few bars */}
                  {val > 0 && (
                    <span
                      className={`absolute bottom-full mb-1 text-[9px] font-semibold tabular-nums leading-none transition-opacity ${
                        showLabels ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      style={{ color }}
                    >
                      {val}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t-sm transition-all duration-300"
                    style={{ height: barH, backgroundColor: color }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X labels */}
        {xLabels && (
          <div className="mt-1.5 flex">
            {xLabels.map((label, i) => (
              <div key={i} className="flex-1 text-center overflow-hidden">
                {label && (
                  <span className="text-[9px] text-gray-400 dark:text-gray-600 whitespace-nowrap">
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
