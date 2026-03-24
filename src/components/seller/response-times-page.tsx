"use client";

import { useMemo } from "react";
import { Search, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useDateRange } from "@/lib/date-context";
import { usePersistedState } from "@/lib/use-persisted-state";
import { useResponseTimes } from "@/lib/queries";
import { cn, formatNumber } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ErrorCard } from "@/components/ui/error-card";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";

type SortField = "seller" | "lead_count" | "avg_hours" | "median_hours" | null;
type SortDirection = "asc" | "desc";

function hoursColor(hours: number) {
  if (hours > 24) return "text-red-600";
  if (hours > 8) return "text-orange-600";
  return "text-green-600";
}

export function ResponseTimesPage() {
  const [searchFilter, setSearchFilter] = usePersistedState("response-times-search", "");
  const [sortField, setSortField] = usePersistedState<SortField>("response-times-sort-field", null);
  const [sortDir, setSortDir] = usePersistedState<SortDirection>("response-times-sort-dir", "desc");

  const { dateRange } = useDateRange();
  const { data, isLoading, isError, refetch } = useResponseTimes(dateRange.startDate, dateRange.endDate);

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortDir("asc");
    } else {
      setSortField(null);
    }
  };

  const filtered = useMemo(() => {
    let sellers = data?.by_seller || [];
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      sellers = sellers.filter(s => s.seller.toLowerCase().includes(q));
    }
    if (!sortField) return [...sellers];
    sellers = [...sellers].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return sellers;
  }, [data, searchFilter, sortField, sortDir]);

  const overallMedian = useMemo(() => {
    if (!data?.by_seller?.length) return 0;
    const sorted = [...data.by_seller].sort((a, b) => a.median_hours - b.median_hours);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid].median_hours : (sorted[mid - 1].median_hours + sorted[mid].median_hours) / 2;
  }, [data]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="inline h-3 w-3 ml-1" /> : <ChevronDown className="inline h-3 w-3 ml-1" />;
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reaktionszeiten</h1>
        <ErrorCard message="Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reaktionszeiten</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard title="Gesamt-Leads" value={formatNumber(data?.overall.total_leads || 0)} icon={Clock} />
            <KpiCard
              title="Ø Reaktionszeit"
              value={data?.overall.avg_hours != null ? `${data.overall.avg_hours.toFixed(1)} h` : "–"}
              icon={Clock}
            />
            <KpiCard
              title="Median Reaktionszeit"
              value={overallMedian ? `${overallMedian.toFixed(1)} h` : "–"}
              icon={Clock}
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Verkäufer suchen..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("seller")}>
                  Verkäufer <SortIcon field="seller" />
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("lead_count")}>
                  Leads <SortIcon field="lead_count" />
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("avg_hours")}>
                  Ø Stunden <SortIcon field="avg_hours" />
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("median_hours")}>
                  Median Stunden <SortIcon field="median_hours" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.seller}>
                  <TableCell className="font-medium text-sm">{s.seller}</TableCell>
                  <TableCell className="text-right text-sm">{formatNumber(s.lead_count)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn("font-medium text-sm", hoursColor(s.avg_hours))}>
                      {s.avg_hours.toFixed(1)} h
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn("text-sm", hoursColor(s.median_hours))}>
                      {s.median_hours.toFixed(1)} h
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    Keine Daten gefunden
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
