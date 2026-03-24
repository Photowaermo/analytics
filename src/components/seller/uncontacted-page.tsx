"use client";

import { useMemo } from "react";
import { Search, AlertTriangle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { useDateRange } from "@/lib/date-context";
import { useUncontacted } from "@/lib/queries";
import { cn, formatNumber } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorCard } from "@/components/ui/error-card";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { usePersistedState } from "@/lib/use-persisted-state";

const productLabels: Record<string, string> = {
  pv: "PV",
  heatpump: "Wärmepumpe",
  kombi: "Kombi",
  unknown: "Unbekannt",
};

export function UncontactedPage() {
  const [sellerFilter, setSellerFilter] = usePersistedState("uncontacted-seller", "all");
  const [searchFilter, setSearchFilter] = usePersistedState("uncontacted-search", "");

  const { dateRange } = useDateRange();
  const { data, isLoading, isError, refetch } = useUncontacted(dateRange.startDate, dateRange.endDate, 500);

  const sellerOptions = useMemo(() => {
    if (!data?.by_seller) return [];
    return Object.entries(data.by_seller)
      .sort((a, b) => b[1] - a[1])
      .map(([email, count]) => ({ value: email, label: `${email} (${count})` }));
  }, [data]);

  const filteredLeads = useMemo(() => {
    let leads = data?.leads || [];
    if (sellerFilter !== "all") {
      leads = leads.filter(l => l.seller === sellerFilter);
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      leads = leads.filter(l =>
        l.email.toLowerCase().includes(q) ||
        l.first_name?.toLowerCase().includes(q) ||
        l.last_name?.toLowerCase().includes(q)
      );
    }
    return leads;
  }, [data, sellerFilter, searchFilter]);

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Unkontaktierte Leads</h1>
        <ErrorCard message="Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Unkontaktierte Leads</h1>

      {/* KPI Cards */}
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
              title="Unkontaktiert gesamt"
              value={formatNumber(filteredLeads.length)}
              icon={AlertTriangle}
            />
            <KpiCard
              title="Verkäufer betroffen"
              value={formatNumber(new Set(filteredLeads.map(l => l.seller).filter(Boolean)).size)}
              icon={AlertTriangle}
            />
            <KpiCard
              title="Ø Wartezeit"
              value={
                filteredLeads.length > 0
                  ? `${Math.round(filteredLeads.reduce((s, l) => s + l.days_waiting, 0) / filteredLeads.length)} Tage`
                  : "–"
              }
              icon={Clock}
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Name oder E-Mail suchen..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Select value={sellerFilter} onValueChange={setSellerFilter}>
          <SelectTrigger className="w-[280px] bg-white">
            <SelectValue placeholder="Verkäufer" />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-60">
            <SelectItem value="all">Alle Verkäufer</SelectItem>
            {sellerOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Produkt</TableHead>
                <TableHead>Quelle</TableHead>
                <TableHead>Verkäufer</TableHead>
                <TableHead>Kanban</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead className="text-right">Wartezeit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    {lead.first_name} {lead.last_name}
                  </TableCell>
                  <TableCell className="text-sm">{lead.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-xs">
                      {productLabels[lead.product || ""] || lead.product || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-sm">{lead.source_name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{lead.seller || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {lead.kanban_status || "–"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(parseISO(lead.created_at), "d. MMM yyyy", { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-medium text-sm",
                      lead.days_waiting >= 14 ? "text-red-600" :
                      lead.days_waiting >= 7 ? "text-yellow-600" : "text-gray-600"
                    )}>
                      {lead.days_waiting} Tage
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Keine unkontaktierten Leads gefunden
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
