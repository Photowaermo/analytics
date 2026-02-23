"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ChevronRight, Trophy, Users, DollarSign, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { useDateRange } from "@/lib/date-context";
import { useSellers, useSellerLeads } from "@/lib/queries";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ErrorCard } from "@/components/ui/error-card";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import type { Seller } from "@/lib/api";

type SortField = "name" | "leads" | "won" | "revenue" | "conversion_rate" | "avg_deal_value";
type SortDirection = "asc" | "desc";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  booked: "bg-indigo-100 text-indigo-800",
  cancelled_booking: "bg-orange-100 text-orange-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  synced: "bg-cyan-100 text-cyan-800",
};

const statusLabels: Record<string, string> = {
  new: "Neu",
  contacted: "Kontaktiert",
  qualified: "Qualifiziert",
  booked: "Termin gebucht",
  cancelled_booking: "Termin storniert",
  won: "Gewonnen",
  lost: "Verloren",
  synced: "Synchronisiert",
};

const productLabels: Record<string, string> = {
  pv: "PV",
  heatpump: "Wärmepumpe",
  kombi: "Kombi",
  unknown: "Unbekannt",
};

const TOTAL_COLUMNS = 14;

function SellerLeadsRow({ seller }: { seller: Seller }) {
  const { dateRange } = useDateRange();
  const { data: leads, isLoading } = useSellerLeads(
    seller.name,
    dateRange.startDate,
    dateRange.endDate
  );

  return (
    <TableRow>
      <TableCell colSpan={TOTAL_COLUMNS} className="p-0">
        <div className="bg-gray-50 border-t border-gray-200/50">
          <div className="px-6 py-3">
            {isLoading ? (
              <div className="py-4 text-center text-sm text-gray-400">Laden...</div>
            ) : !leads || leads.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-400">Keine Leads</div>
            ) : (
              <div className="rounded-lg border border-gray-200/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Produkt</TableHead>
                      <TableHead>Quelle</TableHead>
                      <TableHead>Formulartyp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead className="text-right">Sale Value</TableHead>
                      <TableHead>Kampagne</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium text-sm">{lead.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-xs">
                            {productLabels[lead.product] || lead.product || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-sm">{lead.source_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-xs">
                            {lead.submission_type === "lead_form" ? "Lead-Formular" :
                             lead.submission_type === "website" ? "Website" :
                             lead.submission_type === "api" ? "API" : lead.submission_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", statusColors[lead.crm_status] || "bg-gray-100 text-gray-800")}>
                            {statusLabels[lead.crm_status] || lead.crm_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(parseISO(lead.created_at), "d. MMM yyyy, HH:mm", { locale: de })}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {lead.sale_value ? formatCurrency(lead.sale_value) : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm" title={lead.campaign_name}>
                          {lead.campaign_name || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SellerPage() {
  const { dateRange } = useDateRange();
  const { data: sellers, isLoading, isError, refetch } = useSellers(
    dateRange.startDate,
    dateRange.endDate
  );

  const [searchFilter, setSearchFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedSeller, setExpandedSeller] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleExpand = (sellerName: string) => {
    setExpandedSeller((prev) => (prev === sellerName ? null : sellerName));
  };

  const filteredAndSorted = useMemo(() => {
    let result = sellers || [];
    if (searchFilter) {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    result = [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return result;
  }, [sellers, searchFilter, sortField, sortDirection]);

  const totalLeads = sellers?.reduce((s, r) => s + r.leads, 0) || 0;
  const totalWon = sellers?.reduce((s, r) => s + r.won, 0) || 0;
  const totalRevenue = sellers?.reduce((s, r) => s + r.revenue, 0) || 0;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-1" />
    );
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Verkäufer-Performance</h1>
        <ErrorCard message="Seller-Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Verkäufer-Performance</h1>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <KpiCard title="Verkäufer" value={formatNumber(sellers?.length || 0)} icon={Users} />
            <KpiCard title="Gesamt Leads" value={formatNumber(totalLeads)} icon={TrendingUp} />
            <KpiCard title="Gesamt Gewonnen" value={formatNumber(totalWon)} icon={Trophy} />
            <KpiCard title="Gesamt Umsatz" value={formatCurrency(totalRevenue)} icon={DollarSign} />
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Verkäufer suchen..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("name")}
                  >
                    Name <SortIcon field="name" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("leads")}
                  >
                    Leads <SortIcon field="leads" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("won")}
                  >
                    Gewonnen <SortIcon field="won" />
                  </TableHead>
                  <TableHead className="text-right">PV</TableHead>
                  <TableHead className="text-right">WP</TableHead>
                  <TableHead className="text-right">Kombi</TableHead>
                  <TableHead className="text-right">Unbek.</TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("revenue")}
                  >
                    Umsatz <SortIcon field="revenue" />
                  </TableHead>
                  <TableHead className="text-right">PV</TableHead>
                  <TableHead className="text-right">WP</TableHead>
                  <TableHead className="text-right">Kombi</TableHead>
                  <TableHead className="text-right">Unbek.</TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("conversion_rate")}
                  >
                    Konversion <SortIcon field="conversion_rate" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("avg_deal_value")}
                  >
                    Ø Deal <SortIcon field="avg_deal_value" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map((seller) => {
                  const isExpanded = expandedSeller === seller.name;
                  return (
                    <>
                      <TableRow
                        key={seller.name}
                        className={cn(
                          "cursor-pointer hover:bg-gray-50 transition-colors",
                          isExpanded && "bg-gray-50"
                        )}
                        onClick={() => toggleExpand(seller.name)}
                      >
                        <TableCell className="w-8 pr-0">
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-gray-400 transition-transform duration-200",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{seller.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(seller.leads)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatNumber(seller.won)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatNumber(seller.won_pv)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatNumber(seller.won_wp)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatNumber(seller.won_kombi)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatNumber(seller.won_unknown)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(seller.revenue)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatCurrency(seller.revenue_pv)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatCurrency(seller.revenue_wp)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatCurrency(seller.revenue_kombi)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatCurrency(seller.revenue_unknown)}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              seller.conversion_rate >= 50
                                ? "text-green-600 font-semibold"
                                : seller.conversion_rate >= 25
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }
                          >
                            {formatPercent(seller.conversion_rate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(seller.avg_deal_value)}</TableCell>
                      </TableRow>
                      {isExpanded && (
                        <SellerLeadsRow key={`${seller.name}-leads`} seller={seller} />
                      )}
                    </>
                  );
                })}
                {filteredAndSorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={TOTAL_COLUMNS + 1} className="text-center py-8 text-gray-500">
                      {searchFilter ? "Keine Verkäufer gefunden" : "Keine Daten verfügbar"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
