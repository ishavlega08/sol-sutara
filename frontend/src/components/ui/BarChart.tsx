// Reusable bar chart — used in Dashboard activity chart + Analytics growth chart

interface BarChartProps {
  bars: number[];
  colorFrom?: string;
  colorTo?: string;
  xLabels?: string[];
  height?: number;
}

export default function BarChart({
  bars,
  colorFrom = "#7c3aed",
  colorTo = "#10b981",
  xLabels,
  height = 160,
}: BarChartProps) {
  const max = Math.max(...bars, 1);
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {bars.map((val, i) => {
          const ratio = bars.length > 1 ? i / (bars.length - 1) : 1;
          const r1 = parseInt(colorFrom.slice(1, 3), 16);
          const g1 = parseInt(colorFrom.slice(3, 5), 16);
          const b1 = parseInt(colorFrom.slice(5, 7), 16);
          const r2 = parseInt(colorTo.slice(1, 3), 16);
          const g2 = parseInt(colorTo.slice(3, 5), 16);
          const b2 = parseInt(colorTo.slice(5, 7), 16);
          const r = Math.round(r1 + ratio * (r2 - r1));
          const g = Math.round(g1 + ratio * (g2 - g1));
          const b = Math.round(b1 + ratio * (b2 - b1));
          const color = `rgb(${r},${g},${b})`;
          return (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t-sm transition-all duration-300"
                style={{ height: `${(val / max) * height}px`, backgroundColor: color }}
              />
            </div>
          );
        })}
      </div>
      {xLabels && (
        <div className="mt-2 flex">
          {xLabels.map((label, i) => (
            <div key={i} className="flex-1 text-center">
              {label && <span className="text-[10px] text-gray-400">{label}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
