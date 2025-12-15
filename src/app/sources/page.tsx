"use client";

import { useDateRange } from "@/lib/date-context";
import { useProviders } from "@/lib/queries";
import { modeConfig } from "@/lib/mode-context";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { ErrorCard } from "@/components/ui/error-card";
import { formatNumber, formatPercent } from "@/lib/utils";
import { Users, ShoppingCart, Globe, TrendingUp } from "lucide-react";

export default function SourcesPage() {
  const { dateRange } = useDateRange();
  const { data: providers, isLoading, isError, refetch } = useProviders(
    dateRange.startDate,
    dateRange.endDate
  );

  // Filter to organic providers only (website)
  const organicProviders = providers?.filter(p =>
    modeConfig.organic.providers.includes(p.provider.toLowerCase())
  ) || [];

  const totalLeads = organicProviders.reduce((sum, p) => sum + p.leads, 0);
  const totalSales = organicProviders.reduce((sum, p) => sum + p.sales, 0);
  const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Traffic-Quellen</h1>
        <ErrorCard message="Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Traffic-Quellen</h1>

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
              title="Organische Leads"
              value={formatNumber(totalLeads)}
              icon={Users}
            />
            <KpiCard
              title="Verkäufe"
              value={formatNumber(totalSales)}
              icon={ShoppingCart}
            />
            <KpiCard
              title="Konversionsrate"
              value={formatPercent(conversionRate)}
              icon={TrendingUp}
            />
            <KpiCard
              title="Akquisekosten"
              value="0,00 €"
              subtitle="Kostenlos"
              icon={Globe}
            />
          </>
        )}
      </div>

      {/* Traffic Sources Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Website Traffic Card */}
        <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Website-Traffic</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Direkte Besucher</p>
                  <p className="text-sm text-gray-500">Ohne Werbekampagne</p>
                </div>
              </div>
              <span className="text-xl font-bold text-green-600">{formatNumber(totalLeads)}</span>
            </div>
          </div>
        </div>

        {/* Conversion Info Card */}
        <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Konversion</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Leads generiert</span>
              <span className="font-semibold">{formatNumber(totalLeads)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Verkäufe abgeschlossen</span>
              <span className="font-semibold">{formatNumber(totalSales)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Konversionsrate</span>
              <span className="font-bold text-green-600">{formatPercent(conversionRate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-3">
          <Globe className="h-6 w-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Organischer Traffic ist wertvoll</h3>
            <p className="text-green-800 text-sm mt-1">
              Diese Leads haben keine Akquisekosten und zeigen, dass Ihre Website und SEO-Maßnahmen funktionieren.
              Organische Leads haben oft eine höhere Kaufabsicht, da sie aktiv nach Ihren Produkten gesucht haben.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder for future UTM breakdown */}
      <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic-Quellen Details</h3>
        <p className="text-gray-500 text-center py-8">
          Detaillierte Traffic-Analysen (Referrer, UTM-Parameter) werden in einer zukünftigen Version verfügbar sein.
        </p>
      </div>
    </div>
  );
}
