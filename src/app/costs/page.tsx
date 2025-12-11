"use client";

import { DollarSign, TrendingUp, PiggyBank, Percent } from "lucide-react";
import { useDateRange } from "@/lib/date-context";
import { useOverview, useProviders } from "@/lib/queries";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { BarChartCard, BarChartSkeleton } from "@/components/charts/bar-chart";
import { ErrorCard } from "@/components/ui/error-card";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function CostsPage() {
  const { dateRange } = useDateRange();
  const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } = useOverview(
    dateRange.startDate,
    dateRange.endDate
  );
  const { data: providers, isLoading: providersLoading } = useProviders(
    dateRange.startDate,
    dateRange.endDate
  );

  const isLoading = overviewLoading || providersLoading;

  const roasChartData = providers?.map((p) => ({
    name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    value: p.roas,
  })) || [];

  const cac = overview && overview.total_sales > 0
    ? overview.total_spend / overview.total_sales
    : 0;

  if (overviewError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Costs & ROAS</h1>
        <ErrorCard message="Failed to load cost data" onRetry={() => refetchOverview()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Costs & ROAS</h1>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : overview ? (
          <>
            <KpiCard
              title="Total Marketing Spend"
              value={formatCurrency(overview.total_spend)}
              icon={DollarSign}
            />
            <KpiCard
              title="Total Revenue"
              value={formatCurrency(overview.total_revenue)}
              icon={TrendingUp}
            />
            <KpiCard
              title="Profit"
              value={formatCurrency(overview.profit)}
              icon={PiggyBank}
            />
            <KpiCard
              title="Margin"
              value={formatPercent(overview.margin)}
              icon={Percent}
            />
          </>
        ) : null}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : overview ? (
          <>
            <KpiCard
              title="Overall ROAS"
              value={`${overview.roas.toFixed(2)}x`}
              subtitle={overview.roas >= 3 ? "Excellent performance" : overview.roas >= 1 ? "Positive ROI" : "Below breakeven"}
            />
            <KpiCard
              title="Customer Acquisition Cost"
              value={formatCurrency(cac)}
              subtitle="Cost per sale"
            />
            <KpiCard
              title="Cost Per Lead"
              value={formatCurrency(overview.cpl)}
              subtitle="Average across all channels"
            />
          </>
        ) : null}
      </div>

      {/* ROAS by Provider Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providersLoading ? (
          <BarChartSkeleton />
        ) : roasChartData.length > 0 ? (
          <BarChartCard data={roasChartData} title="ROAS by Provider" />
        ) : null}

        {/* Profitability Summary */}
        {overview && (
          <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Profitability Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-green-600">
                  +{formatCurrency(overview.total_revenue)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Marketing Spend</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(overview.total_spend)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-900 font-medium">Net Profit</span>
                <span className={`text-xl font-bold ${overview.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(overview.profit)}
                </span>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-500">
                  For every {formatCurrency(1)} spent, you earn {formatCurrency(overview.roas)} back.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
