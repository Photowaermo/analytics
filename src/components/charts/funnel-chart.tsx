"use client";

import { formatNumber } from "@/lib/utils";

interface FunnelStep {
  step_name: string;
  count: number;
  dropoff_rate: number;
}

interface FunnelChartProps {
  data: FunnelStep[];
}

const COLORS = ["#A1BF4F", "#7BCDA5", "#3A9E90", "#2F4F4F", "#1a3a35"];

// Format percentage with appropriate decimals for small values
function formatFunnelPercent(value: number): string {
  if (value > 0 && value < 0.1) {
    return `${value.toFixed(2)}%`;
  }
  return `${value.toFixed(1)}%`;
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxCount = data[0]?.count || 1;

  return (
    <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">Konversionstrichter</h3>
      <div className="space-y-3">
        {data.map((step, index) => {
          const widthPercent = (step.count / maxCount) * 100;
          const isSmallBar = widthPercent < 15;
          return (
            <div key={step.step_name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{step.step_name}</span>
                <span className="text-sm text-gray-500">
                  {formatNumber(step.count)}
                  {step.dropoff_rate > 0 && (
                    <span className="ml-2 text-red-500">(-{step.dropoff_rate.toFixed(1)}%)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 flex-1 rounded-lg bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                    style={{
                      width: `${Math.max(widthPercent, 5)}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  >
                    {!isSmallBar && (
                      <span className="text-xs font-medium text-white">
                        {formatFunnelPercent(widthPercent)}
                      </span>
                    )}
                  </div>
                </div>
                {isSmallBar && (
                  <span className="text-xs font-medium text-gray-600 w-12">
                    {formatFunnelPercent(widthPercent)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FunnelChartSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
      <div className="space-y-4">
        {[100, 75, 50, 25].map((width, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="h-10 bg-gray-100 rounded-lg">
              <div className="h-full bg-gray-200 rounded-lg" style={{ width: `${width}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
