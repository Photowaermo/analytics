"use client";

import { useMemo } from "react";
import { Search, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useStaleLeads } from "@/lib/queries";
import { usePersistedState } from "@/lib/use-persisted-state";
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

type SortField = "seller" | "pipeline" | "kanban_status" | "elapsed_hours" | "limit_hours" | "warning_level" | null;
type SortDirection = "asc" | "desc";

function warningColor(level: number) {
  if (level >= 3) return "border-red-300 bg-red-50 text-red-700";
  if (level >= 2) return "border-orange-300 bg-orange-50 text-orange-700";
  return "border-yellow-300 bg-yellow-50 text-yellow-700";
}

function warningLabel(level: number) {
  if (level >= 3) return "Kritisch";
  if (level >= 2) return "Warnung";
  return "Hinweis";
}

function pipelineLabel(p: string) {
  if (p === "request") return "Anfrage";
  if (p === "offer") return "Angebot";
  return p || "–";
}

export function StalePage() {
  const [searchFilter, setSearchFilter] = usePersistedState("stale-search", "");
  const [warningFilter, setWarningFilter] = usePersistedState("stale-warning", "all");
  const [pipelineFilter, setPipelineFilter] = usePersistedState("stale-pipeline", "all");
  const [kanbanFilter, setKanbanFilter] = usePersistedState("stale-kanban", "all");
  const [sortField, setSortField] = usePersistedState<SortField>("stale-sort-field", null);
  const [sortDir, setSortDir] = usePersistedState<SortDirection>("stale-sort-dir", "desc");

  const { data, isLoading, isError, refetch } = useStaleLeads();

  const allLeads = useMemo(() => {
    if (!data?.by_seller) return [];
    return data.by_seller.flatMap(s =>
      s.leads.map(l => ({ ...l, seller: s.seller }))
    );
  }, [data]);

  // Unique values for filter dropdowns
  const pipelineOptions = useMemo(() => {
    const set = new Set(allLeads.map(l => l.pipeline).filter(Boolean));
    return Array.from(set).sort();
  }, [allLeads]);

  const kanbanOptions = useMemo(() => {
    const set = new Set(allLeads.map(l => l.kanban_status).filter(Boolean));
    return Array.from(set).sort();
  }, [allLeads]);

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

  const filteredLeads = useMemo(() => {
    let leads = allLeads;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      leads = leads.filter(l =>
        l.email.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.seller.toLowerCase().includes(q)
      );
    }
    if (warningFilter !== "all") {
      const level = Number(warningFilter);
      leads = leads.filter(l => l.warning_level === level);
    }
    if (pipelineFilter !== "all") {
      leads = leads.filter(l => l.pipeline === pipelineFilter);
    }
    if (kanbanFilter !== "all") {
      leads = leads.filter(l => l.kanban_status === kanbanFilter);
    }
    if (sortField) {
      leads = [...leads].sort((a, b) => {
        const aVal: string | number = a[sortField];
        const bVal: string | number = b[sortField];
        if (typeof aVal === "string") {
          return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
        }
        return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
    }
    return leads;
  }, [allLeads, searchFilter, warningFilter, pipelineFilter, kanbanFilter, sortField, sortDir]);

  const criticalCount = filteredLeads.filter(l => l.warning_level >= 3).length;
  const sellersAffected = new Set(filteredLeads.map(l => l.seller)).size;

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Überfällige Leads</h1>
        <ErrorCard message="Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Überfällige Leads</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard title="Überfällig gesamt" value={formatNumber(filteredLeads.length)} icon={AlertTriangle} />
            <KpiCard title="Kritisch" value={formatNumber(criticalCount)} icon={AlertTriangle} />
            <KpiCard title="Verkäufer betroffen" value={formatNumber(sellersAffected)} icon={AlertTriangle} />
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
        <Select value={warningFilter} onValueChange={setWarningFilter}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Warnung" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">Alle Warnungen</SelectItem>
            <SelectItem value="1">Hinweis</SelectItem>
            <SelectItem value="2">Warnung</SelectItem>
            <SelectItem value="3">Kritisch</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">Alle Pipelines</SelectItem>
            {pipelineOptions.map(p => (
              <SelectItem key={p} value={p}>{pipelineLabel(p)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kanbanFilter} onValueChange={setKanbanFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Kanban-Status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">Alle Kanban-Status</SelectItem>
            {kanbanOptions.map(k => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("pipeline")}>
                  Pipeline <SortIcon field="pipeline" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("kanban_status")}>
                  Kanban-Status <SortIcon field="kanban_status" />
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("elapsed_hours")}>
                  Seit (h) <SortIcon field="elapsed_hours" />
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("limit_hours")}>
                  Limit (h) <SortIcon field="limit_hours" />
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("warning_level")}>
                  Warnung <SortIcon field="warning_level" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="text-sm text-gray-600">{lead.seller}</TableCell>
                  <TableCell className="font-medium text-sm">{lead.name}</TableCell>
                  <TableCell className="text-sm">{lead.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {pipelineLabel(lead.pipeline)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {lead.kanban_status || "–"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{Math.round(lead.elapsed_hours)}</TableCell>
                  <TableCell className="text-right text-sm">{lead.limit_hours}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={cn("text-xs font-normal", warningColor(lead.warning_level))}>
                      {warningLabel(lead.warning_level)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Keine überfälligen Leads gefunden
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
