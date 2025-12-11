"use client";

import { useDateRange } from "@/lib/date-context";
import { useProviders } from "@/lib/queries";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { BarChartCard, BarChartSkeleton } from "@/components/charts/bar-chart";
import { ErrorCard } from "@/components/ui/error-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function ProvidersPage() {
  const { dateRange } = useDateRange();
  const { data: providers, isLoading, isError, refetch } = useProviders(dateRange.startDate, dateRange.endDate);

  const totalLeads = providers?.reduce((sum, p) => sum + p.leads, 0) || 0;
  const totalSales = providers?.reduce((sum, p) => sum + p.sales, 0) || 0;
  const totalCost = providers?.reduce((sum, p) => sum + p.cost, 0) || 0;
  const avgCpl = totalLeads > 0 ? totalCost / totalLeads : 0;

  const cplChartData = providers?.map((p) => ({
    name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
    value: p.cpl,
  })) || [];

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Provider Performance</h1>
        <ErrorCard message="Failed to load provider data" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Provider Performance</h1>

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
            <KpiCard title="Total Leads (Providers)" value={formatNumber(totalLeads)} />
            <KpiCard title="Total Sales" value={formatNumber(totalSales)} />
            <KpiCard title="Total Cost" value={formatCurrency(totalCost)} />
            <KpiCard title="Avg. CPL" value={formatCurrency(avgCpl)} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPL Comparison Chart */}
        {isLoading ? (
          <BarChartSkeleton />
        ) : cplChartData.length > 0 ? (
          <BarChartCard data={cplChartData} title="Cost Per Lead by Provider" horizontal />
        ) : null}

        {/* Provider Table */}
        <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Provider Details</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers?.map((provider) => (
                  <TableRow key={provider.provider}>
                    <TableCell className="font-medium capitalize">{provider.provider}</TableCell>
                    <TableCell className="text-right">{formatNumber(provider.leads)}</TableCell>
                    <TableCell className="text-right">{formatNumber(provider.sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(provider.cpl)}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          provider.roas >= 3
                            ? "text-green-600 font-semibold"
                            : provider.roas >= 1
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {provider.roas.toFixed(2)}x
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {providers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No provider data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
