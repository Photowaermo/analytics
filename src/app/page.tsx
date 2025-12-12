"use client";

import { Users, ShoppingCart, DollarSign, TrendingUp, Target, Percent } from "lucide-react";
import { useDateRange } from "@/lib/date-context";
import { useOverview, useAttribution } from "@/lib/queries";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { TrendChart, TrendChartSkeleton } from "@/components/charts/trend-chart";
import { BarChartCard, BarChartSkeleton } from "@/components/charts/bar-chart";
import { ErrorCard } from "@/components/ui/error-card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export default function OverviewPage() {
  const { dateRange } = useDateRange();
  const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } = useOverview(
    dateRange.startDate,
    dateRange.endDate
  );
  const { data: attribution, isLoading: attributionLoading, isError: attributionError, refetch: refetchAttribution } = useAttribution(
    dateRange.startDate,
    dateRange.endDate,
    "campaign"
  );

  const campaignData = attribution?.slice(0, 5).map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    value: item.leads,
  })) || [];

  if (overviewError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Übersicht</h1>
        <ErrorCard message="Übersichtsdaten konnten nicht geladen werden" onRetry={() => refetchOverview()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Übersicht</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : overview ? (
          <>
            <KpiCard
              title="Leads gesamt"
              value={formatNumber(overview.total_leads)}
              icon={Users}
            />
            <KpiCard
              title="Verkäufe gesamt"
              value={formatNumber(overview.total_sales)}
              icon={ShoppingCart}
            />
            <KpiCard
              title="Umsatz"
              value={formatCurrency(overview.total_revenue)}
              icon={DollarSign}
            />
            <KpiCard
              title="ROAS"
              value={`${overview.roas.toFixed(2)}x`}
              icon={TrendingUp}
            />
          </>
        ) : null}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overviewLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : overview ? (
          <>
            <KpiCard
              title="Kosten pro Lead"
              value={formatCurrency(overview.cpl)}
              icon={Target}
            />
            <KpiCard
              title="Kosten pro Verkauf"
              value={formatCurrency(overview.cps)}
              icon={Target}
            />
            <KpiCard
              title="Konversionsrate"
              value={formatPercent(overview.conversion_rate)}
              icon={Percent}
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {overviewLoading ? (
          <TrendChartSkeleton />
        ) : overview?.trends ? (
          <TrendChart data={overview.trends} />
        ) : null}

        {attributionLoading ? (
          <BarChartSkeleton />
        ) : attributionError ? (
          <ErrorCard message="Kampagnendaten konnten nicht geladen werden" onRetry={() => refetchAttribution()} />
        ) : campaignData.length > 0 ? (
          <BarChartCard
            data={campaignData}
            title="Leads nach Kampagne"
            horizontal
          />
        ) : null}
      </div>

      {/* Spend Card */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard
            title="Werbeausgaben"
            value={formatCurrency(overview.total_spend)}
            subtitle="Genutztes Marketingbudget"
          />
          <KpiCard
            title="Gewinn"
            value={formatCurrency(overview.profit)}
            subtitle={`${overview.margin.toFixed(1)}% Marge`}
          />
        </div>
      )}
    </div>
  );
}
