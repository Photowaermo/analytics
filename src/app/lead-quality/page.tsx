"use client";

import { useDateRange } from "@/lib/date-context";
import { useProviders } from "@/lib/queries";
import { modeConfig } from "@/lib/mode-context";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { BarChartCard, BarChartSkeleton } from "@/components/charts/bar-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorCard } from "@/components/ui/error-card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Users } from "lucide-react";

export default function LeadQualityPage() {
  const { dateRange } = useDateRange();
  const { data: providers, isLoading, isError, refetch } = useProviders(
    dateRange.startDate,
    dateRange.endDate
  );

  // Filter to purchased providers only
  const purchasedProviders = providers?.filter(p =>
    modeConfig.purchased.providers.includes(p.provider.toLowerCase())
  ) || [];

  const totalLeads = purchasedProviders.reduce((sum, p) => sum + p.leads, 0);
  const totalSales = purchasedProviders.reduce((sum, p) => sum + p.sales, 0);
  const totalCost = purchasedProviders.reduce((sum, p) => sum + p.cost, 0);
  const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

  // Chart data
  const leadsChartData = purchasedProviders.map((p) => ({
    name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    fullName: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    value: p.leads,
  }));

  const cplChartData = purchasedProviders.map((p) => ({
    name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    fullName: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    value: p.cpl,
  }));

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Lead-Qualität</h1>
        <ErrorCard message="Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Lead-Qualität</h1>

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
            <KpiCard
              title="Gekaufte Leads"
              value={formatNumber(totalLeads)}
              icon={Users}
            />
            <KpiCard
              title="Konvertiert"
              value={formatNumber(totalSales)}
              subtitle={`${formatPercent(conversionRate)} Konversionsrate`}
              icon={CheckCircle}
            />
            <KpiCard
              title="Gesamtkosten"
              value={formatCurrency(totalCost)}
            />
            <KpiCard
              title="Ø Kosten pro Lead"
              value={formatCurrency(totalLeads > 0 ? totalCost / totalLeads : 0)}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <BarChartSkeleton />
            <BarChartSkeleton />
          </>
        ) : (
          <>
            <BarChartCard
              data={leadsChartData}
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
              {purchasedProviders.map((provider) => {
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
              {purchasedProviders.length === 0 && (
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

      {/* Info Box */}
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
