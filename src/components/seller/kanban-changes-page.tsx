"use client";

import { useMemo } from "react";
import { Search, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { useDateRange } from "@/lib/date-context";
import { useKanbanChanges } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
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
import { ArrowRightLeft, Users } from "lucide-react";
import { usePersistedState } from "@/lib/use-persisted-state";

type SortField = "email" | "pipeline" | null;
type SortDirection = "asc" | "desc";

export function KanbanChangesPage() {
  const [searchFilter, setSearchFilter] = usePersistedState("kanban-changes-search", "");
  const [sortField, setSortField] = usePersistedState<SortField>("kanban-changes-sort-field", null);
  const [sortDir, setSortDir] = usePersistedState<SortDirection>("kanban-changes-sort-dir", "desc");

  const { dateRange } = useDateRange();
  const { data, isLoading, isError, refetch } = useKanbanChanges(dateRange.startDate, dateRange.endDate);

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="inline h-3 w-3 ml-1" /> : <ChevronDown className="inline h-3 w-3 ml-1" />;
  };

  const filtered = useMemo(() => {
    let changes = data?.changes || [];
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      changes = changes.filter(c =>
        c.email.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.seller.toLowerCase().includes(q)
      );
    }
    changes = [...changes];
    if (sortField) {
      changes.sort((a, b) => {
        const aVal = a[sortField] || "";
        const bVal = b[sortField] || "";
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    } else {
      // Default: newest first
      changes.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
    }
    return changes;
  }, [data, searchFilter, sortField, sortDir]);

  const sellersInvolved = useMemo(
    () => new Set(filtered.map(c => c.seller).filter(Boolean)).size,
    [filtered]
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Kanban-Verlauf</h1>
        <ErrorCard message="Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Kanban-Verlauf</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard title="Änderungen gesamt" value={formatNumber(filtered.length)} icon={ArrowRightLeft} />
            <KpiCard title="Verkäufer beteiligt" value={formatNumber(sellersInvolved)} icon={Users} />
            <KpiCard title="Leads betroffen" value={formatNumber(new Set(filtered.map(c => c.lead_id)).size)} icon={Users} />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Name, E-Mail oder Verkäufer suchen..."
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
                <TableHead>Zeitpunkt</TableHead>
                <TableHead>Verkäufer</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("email")}>
                  E-Mail <SortIcon field="email" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("pipeline")}>
                  Pipeline <SortIcon field="pipeline" />
                </TableHead>
                <TableHead>Statusänderung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((change, i) => (
                <TableRow key={`${change.lead_id}-${i}`}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {format(parseISO(change.changed_at), "d. MMM yyyy, HH:mm", { locale: de })}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{change.seller || "–"}</TableCell>
                  <TableCell className="font-medium text-sm">{change.name}</TableCell>
                  <TableCell className="text-sm">{change.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {change.pipeline === "request" ? "Anfrage" : change.pipeline === "offer" ? "Angebot" : change.pipeline || "–"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Badge variant="outline" className="text-xs font-normal">
                        {change.from_status || "–"}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                      <Badge variant="outline" className="text-xs font-normal">
                        {change.to_status}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Keine Kanban-Änderungen gefunden
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
