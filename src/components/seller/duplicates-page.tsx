"use client";

import { useState, useMemo, useCallback } from "react";
import { usePersistedState } from "@/lib/use-persisted-state";
import { Search, Copy, Users, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { useDuplicates } from "@/lib/queries";
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
import { ErrorCard } from "@/components/ui/error-card";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";

const statusLabels: Record<string, string> = {
  new: "Neu",
  synced: "Synchronisiert",
  booked: "Terminiert",
  cancelled_booking: "Storniert",
  won: "Gewonnen",
  lost: "Verloren",
  archived: "Archiviert",
};

export function DuplicatesPage() {
  const [searchFilter, setSearchFilter] = usePersistedState("duplicates-search", "");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const copyEmail = useCallback((email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  }, []);

  const { data, isLoading, isError, refetch } = useDuplicates(200);

  const groupEntries = useMemo(() => {
    if (!data?.groups) return [];
    let entries = Object.entries(data.groups);
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      entries = entries.filter(([email, leads]) =>
        email.toLowerCase().includes(q) ||
        leads.some(l =>
          l.first_name?.toLowerCase().includes(q) ||
          l.last_name?.toLowerCase().includes(q) ||
          l.seller?.toLowerCase().includes(q)
        )
      );
    }
    return entries;
  }, [data, searchFilter]);

  const filteredLeadCount = useMemo(
    () => groupEntries.reduce((sum, [, leads]) => sum + leads.length, 0),
    [groupEntries]
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Duplikate</h1>
        <ErrorCard message="Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Duplikate</h1>

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
              title="Duplikat-Gruppen"
              value={formatNumber(groupEntries.length)}
              icon={Copy}
            />
            <KpiCard
              title="Betroffene Leads"
              value={formatNumber(filteredLeadCount)}
              icon={Users}
            />
            <KpiCard
              title="Ø Leads pro Gruppe"
              value={
                groupEntries.length > 0
                  ? (filteredLeadCount / groupEntries.length).toFixed(1)
                  : "–"
              }
              icon={Copy}
            />
          </>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="E-Mail, Name oder Verkäufer suchen..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm p-8 text-center text-gray-500">
            Laden...
          </div>
        ) : groupEntries.length === 0 ? (
          <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm p-8 text-center text-gray-500">
            Keine Duplikate gefunden
          </div>
        ) : (
          groupEntries.map(([email, leads]) => (
            <div
              key={email}
              className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden"
            >
              <div className="w-full flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {leads.length}x
                  </Badge>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyEmail(email); }}
                    className="flex items-center gap-1.5 font-medium text-sm hover:text-primary transition-colors cursor-pointer"
                    title="E-Mail kopieren"
                  >
                    {email}
                    {copiedEmail === email ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>
                  {leads[0]?.first_name && (
                    <span className="text-sm text-gray-500">
                      ({leads[0].first_name} {leads[0].last_name})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setExpandedGroup(expandedGroup === email ? null : email)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {expandedGroup === email ? "Einklappen" : "Aufklappen"}
                </button>
              </div>

              {expandedGroup === email && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Quelle</TableHead>
                      <TableHead>CRM-ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verkäufer</TableHead>
                      <TableHead>Pipeline</TableHead>
                      <TableHead>Kanban</TableHead>
                      <TableHead>Erstellt am</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </TableCell>
                        <TableCell className="capitalize text-sm">{lead.source_name}</TableCell>
                        <TableCell className="text-sm font-mono text-gray-500">
                          {lead.crm_id || "–"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-normal",
                              lead.crm_status === "won" && "border-green-300 bg-green-50 text-green-700",
                              lead.crm_status === "lost" && "border-red-300 bg-red-50 text-red-700",
                              lead.crm_status === "cancelled_booking" && "border-orange-300 bg-orange-50 text-orange-700"
                            )}
                          >
                            {statusLabels[lead.crm_status] || lead.crm_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{lead.seller || "–"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {lead.pipeline === "request" ? "Anfrage" : lead.pipeline === "offer" ? "Angebot" : lead.pipeline || "–"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {lead.kanban_status || "–"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(parseISO(lead.created_at), "d. MMM yyyy", { locale: de })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
