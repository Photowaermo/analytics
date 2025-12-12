"use client";

import { useDateRange } from "@/lib/date-context";
import { useFunnel } from "@/lib/queries";
import { FunnelChart, FunnelChartSkeleton } from "@/components/charts/funnel-chart";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { ErrorCard } from "@/components/ui/error-card";
import { formatNumber, formatPercent } from "@/lib/utils";

export default function FunnelPage() {
  const { dateRange } = useDateRange();
  const { data: funnel, isLoading, isError, refetch } = useFunnel(dateRange.startDate, dateRange.endDate);

  const totalVisitors = funnel?.[0]?.count || 0;
  const totalLeads = funnel?.find((s) => s.step_name.toLowerCase().includes("lead"))?.count || 0;
  const totalSales = funnel?.[funnel.length - 1]?.count || 0;
  const overallConversion = totalVisitors > 0 ? (totalSales / totalVisitors) * 100 : 0;

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Funnel-Analyse</h1>
        <ErrorCard message="Funnel-Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Funnel-Analyse</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard title="Seitenaufrufe" value={formatNumber(totalVisitors)} />
            <KpiCard title="Generierte Leads" value={formatNumber(totalLeads)} />
            <KpiCard title="Abgeschlossene Verkäufe" value={formatNumber(totalSales)} />
            <KpiCard title="Gesamtkonversion" value={formatPercent(overallConversion)} />
          </>
        )}
      </div>

      {/* Funnel Visualization */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? <FunnelChartSkeleton /> : funnel ? <FunnelChart data={funnel} /> : null}
      </div>

      {/* Drop-off Analysis */}
      {funnel && funnel.length > 1 && (
        <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Absprung-Analyse</h3>
          <div className="space-y-3">
            {funnel.slice(1).map((step, index) => {
              const prevStep = funnel[index];
              const dropoffCount = prevStep.count - step.count;
              return (
                <div
                  key={step.step_name}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
                >
                  <div>
                    <span className="text-sm text-gray-500">{prevStep.step_name}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="text-sm font-medium text-gray-700">{step.step_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-red-500 font-medium">
                      -{formatNumber(dropoffCount)} ({step.dropoff_rate.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
