"use client";

import { Users, ShoppingCart, DollarSign, TrendingUp, Target, Percent, AlertTriangle, CheckCircle, XCircle, PiggyBank } from "lucide-react";
import { useDateRange } from "@/lib/date-context";
import { useMode, modeConfig, getAdProviders } from "@/lib/mode-context";
import { usePlatform } from "@/lib/platform-context";
import { useOverview, useAttribution, useProviders, useJourneys, useSettings } from "@/lib/queries";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { TrendChart, TrendChartSkeleton } from "@/components/charts/trend-chart";
import { BarChartCard, BarChartSkeleton } from "@/components/charts/bar-chart";
import { PieChartCard, PieChartSkeleton } from "@/components/charts/pie-chart";
import { ErrorCard } from "@/components/ui/error-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, formatPercent, translateToGerman } from "@/lib/utils";

// Map mode to provider parameter for API
const modeToProvider: Record<string, string> = {
  ads: "ads",
  purchased: "purchased",
  organic: "organic",
};

export default function OverviewPage() {
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
  const { data: attribution, isLoading: attributionLoading, isError: attributionError, refetch: refetchAttribution } = useAttribution(
    dateRange.startDate,
    dateRange.endDate,
    "campaign",
    undefined,
    undefined,
    platform
  );
  const { data: providers, isLoading: providersLoading } = useProviders(
    dateRange.startDate,
    dateRange.endDate,
    platform
  );

  // Fetch leads for ads mode submission type breakdown
  const { data: adsLeads, isLoading: adsLeadsLoading } = useJourneys(500, 0, "ads", platform, dateRange.startDate, dateRange.endDate);

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

  // Calculate mode-specific revenue and ROAS from provider data
  const modeRoas = modeCost > 0
    ? modeProviders.reduce((sum, p) => sum + (p.roas * p.cost), 0) / modeCost
    : 0;
  const modeRevenue = modeProviders.reduce((sum, p) => sum + (p.roas * p.cost), 0);
  const modeProfit = modeRevenue - modeCost;
  const modeMargin = modeRevenue > 0 ? (modeProfit / modeRevenue) * 100 : 0;

  // Campaign data for ads mode (filter campaigns with leads, sort by leads, take top 5)
  const campaignData = attribution
    ?.filter((item) => item.leads > 0)
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5)
    .map((item) => {
      const translatedName = translateToGerman(item.name);
      return {
        name: translatedName.length > 25 ? translatedName.substring(0, 25) + "..." : translatedName,
        fullName: translatedName,
        value: item.leads,
      };
    }) || [];

  // Provider data for purchased mode
  const purchasedData = modeProviders.map((p) => ({
    name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    fullName: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    value: p.leads,
  }));

  const isLoading = overviewLoading || providersLoading;

  if (overviewError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Übersicht - {modeConfig[mode].label}</h1>
        <ErrorCard message="Übersichtsdaten konnten nicht geladen werden" onRetry={() => refetchOverview()} />
      </div>
    );
  }

  // All Mode Overview
  if (mode === "all") {
    // Use overview data for accurate global KPIs (includes revenue from all sources)
    const totalLeads = overview?.total_leads || 0;
    const totalSales = overview?.total_sales || 0;
    const totalCost = overview?.total_spend || 0;
    const totalRevenue = overview?.total_revenue || 0;
    const totalProfit = overview?.profit || 0;
    const conversionRate = overview?.conversion_rate || 0;
    const overallRoas = overview?.roas || 0;

    // Provider data for charts
    const allProviders = providers || [];

    // Category breakdown (use dynamic adProviders for ads)
    const purchasedProviders = ["bildleads", "wattfox", "eza", "interleads"];
    const organicProviders = ["website"];

    const getProvidersByCategory = (categoryProviders: string[]) =>
      allProviders.filter(p => categoryProviders.includes(p.provider.toLowerCase()));

    const adsData = getProvidersByCategory(adProviders);
    const purchasedData = getProvidersByCategory(purchasedProviders);
    const organicData = getProvidersByCategory(organicProviders);

    // Calculate category metrics
    const categoryMetrics = [
      {
        name: "Werbeanzeigen",
        leads: adsData.reduce((sum, p) => sum + p.leads, 0),
        sales: adsData.reduce((sum, p) => sum + p.sales, 0),
        cost: adsData.reduce((sum, p) => sum + p.cost, 0),
        revenue: adsData.reduce((sum, p) => sum + (p.roas * p.cost), 0),
      },
      {
        name: "Gekaufte Leads",
        leads: purchasedData.reduce((sum, p) => sum + p.leads, 0),
        sales: purchasedData.reduce((sum, p) => sum + p.sales, 0),
        cost: purchasedData.reduce((sum, p) => sum + p.cost, 0),
        revenue: purchasedData.reduce((sum, p) => sum + (p.roas * p.cost), 0),
      },
      {
        name: "Organisch",
        leads: organicData.reduce((sum, p) => sum + p.leads, 0),
        sales: organicData.reduce((sum, p) => sum + p.sales, 0),
        cost: 0, // Organic has no cost
        revenue: organicData.reduce((sum, p) => sum + (p.roas * p.cost), 0),
      },
    ].map(cat => ({
      ...cat,
      conversion: cat.leads > 0 ? (cat.sales / cat.leads) * 100 : 0,
      profit: cat.revenue - cat.cost,
    }));

    // Pie chart data for leads
    const categoryLeadsData = categoryMetrics
      .filter(c => c.leads > 0)
      .map(c => ({ name: c.name, value: c.leads }));

    // Pie chart data for revenue
    const categoryRevenueData = categoryMetrics
      .filter(c => c.revenue > 0)
      .map(c => ({ name: c.name, value: c.revenue }));

    // Provider breakdown for bar chart
    const providerData = allProviders
      .filter(p => p.leads > 0)
      .sort((a, b) => b.leads - a.leads)
      .map(p => ({
        name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
        fullName: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
        value: p.leads,
      }));

    const allLoading = overviewLoading || providersLoading;

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Gesamtübersicht - Alle Quellen</h1>

        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allLoading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : (
            <>
              <KpiCard
                title="Gesamt Leads"
                value={formatNumber(totalLeads)}
                icon={Users}
              />
              <KpiCard
                title="Gesamt Verkäufe"
                value={formatNumber(totalSales)}
                icon={ShoppingCart}
              />
              <KpiCard
                title="Konversionsrate"
                value={formatPercent(conversionRate)}
                icon={Percent}
              />
              <KpiCard
                title="Gesamtkosten"
                value={formatCurrency(totalCost)}
                icon={DollarSign}
              />
              <KpiCard
                title="Umsatz"
                value={formatCurrency(totalRevenue)}
                icon={TrendingUp}
              />
              <KpiCard
                title="Gewinn"
                value={formatCurrency(totalProfit)}
                subtitle={overallRoas > 0 ? `ROAS: ${overallRoas.toFixed(2)}x` : ""}
                icon={PiggyBank}
              />
            </>
          )}
        </div>

        {/* Charts Row - Leads by Category & Provider */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {providersLoading ? (
            <>
              <PieChartSkeleton />
              <BarChartSkeleton />
            </>
          ) : (
            <>
              {categoryLeadsData.length > 0 && (
                <PieChartCard
                  data={categoryLeadsData}
                  title="Leads nach Kategorie"
                />
              )}
              {providerData.length > 0 && (
                <BarChartCard
                  data={providerData}
                  title="Leads nach Anbieter"
                  horizontal
                />
              )}
            </>
          )}
        </div>

        {/* Trend Chart */}
        {overviewLoading ? (
          <TrendChartSkeleton />
        ) : overview?.trends ? (
          <TrendChart data={overview.trends} />
        ) : null}

        {/* Revenue by Category */}
        {!providersLoading && categoryRevenueData.length > 0 && (
          <PieChartCard
            data={categoryRevenueData}
            title="Umsatz nach Kategorie"
          />
        )}

        {/* Category Comparison Table */}
        <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Kategorie-Vergleich</h3>
          </div>
          {providersLoading ? (
            <div className="p-8 text-center text-gray-500">Laden...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategorie</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Verkäufe</TableHead>
                  <TableHead className="text-right">Konversion</TableHead>
                  <TableHead className="text-right">Kosten</TableHead>
                  <TableHead className="text-right">Umsatz</TableHead>
                  <TableHead className="text-right">Gewinn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryMetrics.map((cat) => (
                  <TableRow key={cat.name}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-right">{formatNumber(cat.leads)}</TableCell>
                    <TableCell className="text-right">{formatNumber(cat.sales)}</TableCell>
                    <TableCell className="text-right">{formatPercent(cat.conversion)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cat.cost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cat.revenue)}</TableCell>
                    <TableCell className={`text-right font-medium ${cat.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(cat.profit)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell>Gesamt</TableCell>
                  <TableCell className="text-right">{formatNumber(totalLeads)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totalSales)}</TableCell>
                  <TableCell className="text-right">{formatPercent(conversionRate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell>
                  <TableCell className={`text-right ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(totalProfit)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    );
  }

  // Ads Mode Overview
  if (mode === "ads") {
    // Calculate submission type breakdown
    const leadFormCount = adsLeads?.filter(l => l.submission_type === "lead_form").length || 0;
    const websiteCount = adsLeads?.filter(l => l.submission_type === "website").length || 0;

    const submissionTypeData = [
      { name: "Lead-Formular", value: leadFormCount },
      { name: "Website", value: websiteCount },
    ].filter(d => d.value > 0);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Werbeanzeigen - Übersicht</h1>

        {/* KPI Cards */}
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
                title="Ad Leads"
                value={formatNumber(modeLeads)}
                icon={Users}
              />
              <KpiCard
                title="Ad Verkäufe"
                value={formatNumber(modeSales)}
                icon={ShoppingCart}
              />
              <KpiCard
                title="Werbeausgaben"
                value={formatCurrency(modeCost)}
                icon={DollarSign}
              />
              <KpiCard
                title="ROAS"
                value={`${modeRoas.toFixed(2)}x`}
                icon={TrendingUp}
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
                title="Kosten pro Lead (Ads)"
                value={formatCurrency(modeCpl)}
                icon={Target}
              />
              <KpiCard
                title="Kosten pro Verkauf"
                value={modeSales > 0 ? formatCurrency(modeCost / modeSales) : formatCurrency(0)}
                icon={Target}
              />
              <KpiCard
                title="Konversionsrate"
                value={formatPercent(modeLeads > 0 ? (modeSales / modeLeads) * 100 : 0)}
                icon={Percent}
              />
            </>
          )}
        </div>

        {/* Charts Row - Submission Type & Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {adsLeadsLoading ? (
            <PieChartSkeleton />
          ) : submissionTypeData.length > 0 ? (
            <PieChartCard
              data={submissionTypeData}
              title="Leads nach Formular-Typ"
            />
          ) : null}

          {overviewLoading ? (
            <TrendChartSkeleton />
          ) : overview?.trends ? (
            <TrendChart data={overview.trends} />
          ) : null}
        </div>

        {/* Profit Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard
            title="Umsatz (Ads)"
            value={formatCurrency(modeRevenue)}
            subtitle={modeSales > 0 ? "Aus Ad-generierten Verkäufen" : "Noch keine Ad-Verkäufe"}
          />
          <KpiCard
            title="Gewinn"
            value={formatCurrency(modeProfit)}
            subtitle={modeRevenue > 0 ? `${modeMargin.toFixed(1)}% Marge` : ""}
          />
        </div>
      </div>
    );
  }

  // Purchased Leads Mode Overview
  if (mode === "purchased") {
    // CPL chart data
    const cplChartData = modeProviders.map((p) => ({
      name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
      fullName: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
      value: p.cpl,
    }));

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Gekaufte Leads - Übersicht</h1>

        {/* KPI Cards */}
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
                title="Gekaufte Leads"
                value={formatNumber(modeLeads)}
                icon={Users}
              />
              <KpiCard
                title="Verkäufe"
                value={formatNumber(modeSales)}
                subtitle={`${formatPercent(modeLeads > 0 ? (modeSales / modeLeads) * 100 : 0)} Konversion`}
                icon={ShoppingCart}
              />
              <KpiCard
                title="Gesamtkosten"
                value={formatCurrency(modeCost)}
                icon={DollarSign}
              />
              <KpiCard
                title="Ø Kosten pro Lead"
                value={formatCurrency(modeCpl)}
                icon={Target}
              />
            </>
          )}
        </div>

        {/* Revenue & Profit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard
            title="Umsatz"
            value={formatCurrency(overview?.total_revenue || 0)}
            subtitle={modeSales > 0 ? "Aus gekauften Leads" : "Noch keine Verkäufe"}
            icon={TrendingUp}
          />
          <KpiCard
            title="Gewinn"
            value={formatCurrency((overview?.total_revenue || 0) - modeCost)}
            subtitle={(overview?.total_revenue || 0) > 0 ? `${(((overview?.total_revenue || 0) - modeCost) / (overview?.total_revenue || 1) * 100).toFixed(1)}% Marge` : ""}
            icon={PiggyBank}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {providersLoading ? (
            <>
              <BarChartSkeleton />
              <BarChartSkeleton />
            </>
          ) : (
            <>
              <BarChartCard
                data={purchasedData}
                title="Leads nach Anbieter"
                horizontal
              />
              <BarChartCard
                data={cplChartData}
                title="Kosten pro Lead nach Anbieter"
                horizontal
              />
            </>
          )}
        </div>

        {/* Provider Details Table */}
        <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Anbieter-Details</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Laden...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anbieter</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Verkäufe</TableHead>
                  <TableHead className="text-right">Konversion</TableHead>
                  <TableHead className="text-right">Kosten</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">Qualität</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modeProviders.map((provider) => {
                  const providerConversion = provider.leads > 0
                    ? (provider.sales / provider.leads) * 100
                    : 0;
                  const qualityScore = providerConversion >= 5 ? "gut" : providerConversion >= 2 ? "mittel" : "niedrig";

                  return (
                    <TableRow key={provider.provider}>
                      <TableCell className="font-medium capitalize">{provider.provider}</TableCell>
                      <TableCell className="text-right">{formatNumber(provider.leads)}</TableCell>
                      <TableCell className="text-right">{formatNumber(provider.sales)}</TableCell>
                      <TableCell className="text-right">{formatPercent(providerConversion)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(provider.cost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(provider.cpl)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          qualityScore === "gut"
                            ? "bg-green-100 text-green-800"
                            : qualityScore === "mittel"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {qualityScore === "gut" && <CheckCircle className="h-3 w-3" />}
                          {qualityScore === "mittel" && <AlertTriangle className="h-3 w-3" />}
                          {qualityScore === "niedrig" && <XCircle className="h-3 w-3" />}
                          {qualityScore.charAt(0).toUpperCase() + qualityScore.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {modeProviders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Keine Anbieter-Daten verfügbar
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Quality Info */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Qualitätsbewertung</h4>
              <p className="text-sm text-blue-800 mt-1">
                Die Qualität wird basierend auf der Konversionsrate bewertet:
                <span className="font-medium"> Gut</span> (≥5%),
                <span className="font-medium"> Mittel</span> (2-5%),
                <span className="font-medium"> Niedrig</span> (&lt;2%).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Organic Mode Overview
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Organisch - Übersicht</h1>

      {/* KPI Cards */}
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
              title="Organische Leads"
              value={formatNumber(modeLeads)}
              icon={Users}
            />
            <KpiCard
              title="Verkäufe"
              value={formatNumber(modeSales)}
              icon={ShoppingCart}
            />
            <KpiCard
              title="Konversionsrate"
              value={formatPercent(modeLeads > 0 ? (modeSales / modeLeads) * 100 : 0)}
              icon={Percent}
            />
            <KpiCard
              title="Umsatz"
              value={formatCurrency(overview?.total_revenue || 0)}
              subtitle="Keine Akquisekosten = 100% Gewinn"
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Organische Leads</h3>
            <p className="text-blue-800 text-sm mt-1">
              Diese Leads kommen direkt über die Website ohne bezahlte Werbung.
              Sie haben keine Akquisekosten und sind daher besonders wertvoll.
            </p>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="grid grid-cols-1 gap-6">
        {overviewLoading ? (
          <TrendChartSkeleton />
        ) : overview?.trends ? (
          <TrendChart data={overview.trends} />
        ) : null}
      </div>
    </div>
  );
}
