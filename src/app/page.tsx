"use client";

import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Users, ShoppingCart, DollarSign, TrendingUp, Target, Percent, AlertTriangle, CheckCircle, XCircle, PiggyBank } from "lucide-react";
import { useDateRange } from "@/lib/date-context";
import { useMode, modeConfig } from "@/lib/mode-context";
import { useOverview, useAttribution, useProviders, useJourneys } from "@/lib/queries";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { TrendChart, TrendChartSkeleton } from "@/components/charts/trend-chart";
import { BarChartCard, BarChartSkeleton } from "@/components/charts/bar-chart";
import { PieChartCard, PieChartSkeleton } from "@/components/charts/pie-chart";
import { ErrorCard } from "@/components/ui/error-card";
import { Badge } from "@/components/ui/badge";
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

  // Get provider for current mode
  const provider = modeToProvider[mode];

  const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } = useOverview(
    dateRange.startDate,
    dateRange.endDate,
    provider
  );
  const { data: attribution, isLoading: attributionLoading, isError: attributionError, refetch: refetchAttribution } = useAttribution(
    dateRange.startDate,
    dateRange.endDate,
    "campaign"
  );
  const { data: providers, isLoading: providersLoading } = useProviders(
    dateRange.startDate,
    dateRange.endDate
  );
  const { data: journeys, isLoading: journeysLoading } = useJourneys(20, 0);

  // Filter providers by mode
  const modeProviders = providers?.filter(p =>
    modeConfig[mode].providers.includes(p.provider.toLowerCase())
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

    // Category breakdown for pie chart
    const adsProviders = ["metaleads"];
    const purchasedProviders = ["bildleads", "wattfox", "eza", "interleads"];
    const organicProviders = ["website"];

    const adsLeads = allProviders.filter(p => adsProviders.includes(p.provider.toLowerCase())).reduce((sum, p) => sum + p.leads, 0);
    const purchasedLeads = allProviders.filter(p => purchasedProviders.includes(p.provider.toLowerCase())).reduce((sum, p) => sum + p.leads, 0);
    const organicLeads = allProviders.filter(p => organicProviders.includes(p.provider.toLowerCase())).reduce((sum, p) => sum + p.leads, 0);

    const categoryData = [
      { name: "Werbeanzeigen", value: adsLeads },
      { name: "Gekaufte Leads", value: purchasedLeads },
      { name: "Organisch", value: organicLeads },
    ].filter(c => c.value > 0);

    // Provider breakdown for bar chart
    const providerData = allProviders
      .filter(p => p.leads > 0)
      .sort((a, b) => b.leads - a.leads)
      .map(p => ({
        name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
        fullName: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
        value: p.leads,
      }));

    // Status colors and labels for leads table
    const statusColors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-purple-100 text-purple-800",
      won: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
    };
    const statusLabels: Record<string, string> = {
      new: "Neu",
      contacted: "Kontaktiert",
      qualified: "Qualifiziert",
      won: "Gewonnen",
      lost: "Verloren",
    };

    const allLoading = overviewLoading || providersLoading || journeysLoading;

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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {providersLoading ? (
            <>
              <PieChartSkeleton />
              <BarChartSkeleton />
            </>
          ) : (
            <>
              {categoryData.length > 0 && (
                <PieChartCard
                  data={categoryData}
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

        {/* Recent Leads Table */}
        <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Neueste Leads</h3>
          </div>
          {journeysLoading ? (
            <div className="p-8 text-center text-gray-500">Laden...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Quelle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journeys?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.email}</TableCell>
                    <TableCell className="capitalize">{lead.source_name}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.crm_status] || "bg-gray-100 text-gray-800"}>
                        {statusLabels[lead.crm_status] || lead.crm_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(lead.created_at), "d. MMM yyyy, HH:mm", { locale: de })}
                    </TableCell>
                  </TableRow>
                ))}
                {(!journeys || journeys.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Keine Leads gefunden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    );
  }

  // Ads Mode Overview
  if (mode === "ads") {
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
