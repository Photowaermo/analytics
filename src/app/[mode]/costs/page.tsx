"use client";

import { DollarSign, TrendingUp, PiggyBank, Percent, Target } from "lucide-react";
import { useDateRange } from "@/lib/date-context";
import { useMode, modeConfig, getAdProviders } from "@/lib/mode-context";
import { usePlatform } from "@/lib/platform-context";
import { useOverview, useProviders, useSettings } from "@/lib/queries";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { BarChartCard, BarChartSkeleton } from "@/components/charts/bar-chart";
import { ErrorCard } from "@/components/ui/error-card";
import { formatCurrency, formatPercent } from "@/lib/utils";

// Map mode to provider parameter for API
const modeToProvider: Record<string, string> = {
  ads: "ads",
  purchased: "purchased",
  organic: "organic",
};

export default function CostsPage() {
  const { dateRange } = useDateRange();
  const { mode } = useMode();
  const { platformParam } = usePlatform();
  const { data: settings } = useSettings();

  // Get provider for current mode
  const provider = modeToProvider[mode];

  // Only apply platform filter when in ads mode
  const platform = mode === "ads" ? platformParam : undefined;

  // Get dynamic ad providers based on active platforms in settings
  const adProviders = getAdProviders(settings?.active_ad_platforms);

  const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } = useOverview(
    dateRange.startDate,
    dateRange.endDate,
    provider,
    platform
  );
  const { data: providers, isLoading: providersLoading } = useProviders(
    dateRange.startDate,
    dateRange.endDate,
    platform
  );

  const isLoading = overviewLoading || providersLoading;

  // Filter providers by mode (use dynamic adProviders for ads mode)
  const modeProvidersList = mode === "ads" ? adProviders : modeConfig[mode].providers;
  const modeProviders = providers?.filter(p =>
    modeProvidersList.includes(p.provider.toLowerCase())
  ) || [];

  // Calculate mode-specific metrics
  const modeLeads = modeProviders.reduce((sum, p) => sum + p.leads, 0);
  const modeSales = modeProviders.reduce((sum, p) => sum + p.sales, 0);
  const modeCost = modeProviders.reduce((sum, p) => sum + p.cost, 0);
  const modeCpl = modeLeads > 0 ? modeCost / modeLeads : 0;
  const modeCps = modeSales > 0 ? modeCost / modeSales : 0;

  // Calculate mode-specific revenue and ROAS from provider data
  // Revenue = ROAS * Cost (since ROAS = Revenue / Cost)
  const modeRoas = modeProviders.length > 0
    ? modeProviders.reduce((sum, p) => sum + (p.roas * p.cost), 0) / modeCost
    : 0;
  const modeRevenue = modeProviders.reduce((sum, p) => sum + (p.roas * p.cost), 0);
  const modeProfit = modeRevenue - modeCost;
  const modeMargin = modeRevenue > 0 ? (modeProfit / modeRevenue) * 100 : 0;

  // Chart data
  const roasChartData = modeProviders.map((p) => ({
    name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    fullName: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    value: p.roas,
  }));

  if (overviewError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "ads" ? "Kosten & ROAS" : "Kosten"}
        </h1>
        <ErrorCard message="Kostendaten konnten nicht geladen werden" onRetry={() => refetchOverview()} />
      </div>
    );
  }

  // Ads Mode - Full costs & ROAS view
  if (mode === "ads") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Werbekosten & ROAS</h1>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : (
            <>
              <KpiCard
                title="Werbeausgaben"
                value={formatCurrency(modeCost)}
                icon={DollarSign}
              />
              <KpiCard
                title="Umsatz (Ads)"
                value={formatCurrency(modeRevenue)}
                icon={TrendingUp}
              />
              <KpiCard
                title="Gewinn"
                value={formatCurrency(modeProfit)}
                icon={PiggyBank}
              />
              <KpiCard
                title="Marge"
                value={formatPercent(modeMargin)}
                icon={Percent}
              />
            </>
          )}
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : (
            <>
              <KpiCard
                title="ROAS"
                value={`${modeRoas.toFixed(2)}x`}
                subtitle={modeRoas >= 3 ? "Hervorragende Performance" : modeRoas >= 1 ? "Positiver ROI" : "Unter Rentabilität"}
              />
              <KpiCard
                title="Kosten pro Lead"
                value={formatCurrency(modeCpl)}
                icon={Target}
              />
              <KpiCard
                title="Kosten pro Verkauf"
                value={formatCurrency(modeCps)}
                icon={Target}
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {providersLoading ? (
            <BarChartSkeleton />
          ) : roasChartData.length > 0 ? (
            <BarChartCard data={roasChartData} title="ROAS nach Anbieter" horizontal />
          ) : null}

          {/* Profitability Summary */}
          <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Rentabilitätsübersicht</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Umsatz (Ads)</span>
                <span className={`font-semibold ${modeRevenue > 0 ? "text-green-600" : "text-gray-500"}`}>
                  +{formatCurrency(modeRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Werbeausgaben</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(modeCost)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-900 font-medium">Nettogewinn</span>
                <span className={`text-xl font-bold ${modeProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(modeProfit)}
                </span>
              </div>
              {modeRoas > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-500">
                    Für jeden {formatCurrency(1)} Werbeausgabe erhalten Sie {formatCurrency(modeRoas)} zurück.
                  </div>
                </div>
              )}
              {modeRoas === 0 && modeSales === 0 && (
                <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="text-sm text-yellow-800">
                    Noch keine Verkäufe aus Werbeanzeigen. ROAS wird berechnet sobald Leads konvertieren.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This page is only available in ads mode
  return null;
}
