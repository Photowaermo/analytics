"use client";

import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Eye, Search } from "lucide-react";
import { useJourneys, useJourneyDetail, useLeadRaw } from "@/lib/queries";
import { useDateRange } from "@/lib/date-context";
import { useProduct, getProductParam } from "@/lib/product-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorCard } from "@/components/ui/error-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const sourceOptions = [
  { value: "all", label: "Alle Quellen" },
  { value: "metaleads", label: "Meta" },
  { value: "google", label: "Google" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Website" },
  { value: "bildleads", label: "BildLeads" },
  { value: "wattfox", label: "Wattfox" },
  { value: "eza", label: "EZA" },
  { value: "interleads", label: "Interleads" },
  { value: "offline", label: "Offline" },
];

const formOptions = [
  { value: "all", label: "Alle Formulare" },
  { value: "lead_form", label: "Lead-Formular" },
  { value: "website", label: "Website" },
  { value: "api", label: "API" },
];

const statusOptions = [
  { value: "all", label: "Alle Status" },
  { value: "new", label: "Neu" },
  { value: "contacted", label: "Kontaktiert" },
  { value: "qualified", label: "Qualifiziert" },
  { value: "booked", label: "Termin gebucht" },
  { value: "cancelled_booking", label: "Termin storniert" },
  { value: "won", label: "Gewonnen" },
  { value: "lost", label: "Verloren" },
  { value: "synced", label: "Synchronisiert" },
];

export default function LeadsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [rawLeadId, setRawLeadId] = useState<string | null>(null);
  const [emailFilter, setEmailFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [formFilter, setFormFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { dateRange } = useDateRange();
  const { product } = useProduct();
  const productParam = getProductParam(product) || undefined;
  const { data: leads, isLoading, isError, refetch } = useJourneys(1000, 0, undefined, undefined, dateRange.startDate, dateRange.endDate, productParam);
  const { data: journeyDetail, isLoading: detailLoading, isError: detailError } = useJourneyDetail(selectedLeadId || "");
  const { data: leadRawData, isLoading: rawLoading } = useLeadRaw(rawLeadId || "");

  // Filter leads based on selected filters
  const filteredLeads = useMemo(() => {
    return (leads || []).filter(lead => {
      // Email search (case-insensitive)
      if (emailFilter && !lead.email.toLowerCase().includes(emailFilter.toLowerCase())) {
        return false;
      }
      // Source filter (case-insensitive)
      if (sourceFilter !== "all" && lead.source_name?.toLowerCase() !== sourceFilter.toLowerCase()) {
        return false;
      }
      // Form type filter
      if (formFilter !== "all" && lead.submission_type !== formFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== "all" && lead.crm_status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [leads, emailFilter, sourceFilter, formFilter, statusFilter]);

  const hasActiveFilters = emailFilter || sourceFilter !== "all" || formFilter !== "all" || statusFilter !== "all";

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Neueste Leads</h1>
        <ErrorCard message="Leads konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Neueste Leads</h1>
        {hasActiveFilters && leads && (
          <span className="text-sm text-gray-500">
            {filteredLeads.length} von {leads.length} Leads
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="E-Mail suchen..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Quelle" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {sourceOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formFilter} onValueChange={setFormFilter}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Formular" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {formOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Leads werden geladen...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-Mail</TableHead>
                <TableHead>Quelle</TableHead>
                <TableHead>Formular</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setRawLeadId(lead.id)}>
                  <TableCell className="font-medium">{lead.email}</TableCell>
                  <TableCell className="capitalize">{lead.source_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {lead.submission_type === "lead_form" ? "Lead-Formular" :
                       lead.submission_type === "website" ? "Website" :
                       lead.submission_type === "api" ? "API" : lead.submission_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[lead.crm_status] || "bg-gray-100 text-gray-800"}>
                      {statusLabels[lead.crm_status] || lead.crm_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(lead.created_at), "d. MMM yyyy, HH:mm", { locale: de })}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Verlauf anzeigen
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "Keine Leads mit diesen Filtern gefunden" : "Keine Leads gefunden"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Journey Detail Modal */}
      <Dialog open={!!selectedLeadId} onOpenChange={() => setSelectedLeadId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Lead-Verlauf</DialogTitle>
            <DialogDescription>Timeline und Details des ausgewählten Leads</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 text-center text-gray-500">Verlauf wird geladen...</div>
          ) : detailError ? (
            <div className="py-4">
              <ErrorCard message="Verlaufsdetails konnten nicht geladen werden" />
            </div>
          ) : journeyDetail ? (
            <div className="space-y-6">
              {/* Lead Info */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Lead-Informationen</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">E-Mail:</span>{" "}
                    <span className="font-medium">{journeyDetail.lead.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">UTM-Quelle:</span>{" "}
                    <span className="font-medium">{journeyDetail.lead.utm_source || "K.A."}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-4">Zeitverlauf</h4>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {journeyDetail.timeline.map((event, index) => (
                      <div key={index} className="relative flex items-start gap-4 pl-10">
                        <div
                          className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                            event.type === "sale_won"
                              ? "bg-green-500"
                              : event.type === "lead_submission"
                              ? "bg-blue-500"
                              : "bg-gray-400"
                          }`}
                        />
                        <div className="flex-1 rounded-lg bg-white border border-gray-200 p-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {event.type.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(parseISO(event.timestamp), "d. MMM, HH:mm", { locale: de })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 break-all">{event.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Raw Data Dialog */}
      <Dialog open={!!rawLeadId} onOpenChange={() => setRawLeadId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Rohdaten</DialogTitle>
          </DialogHeader>
          {rawLoading ? (
            <div className="py-8 text-center text-gray-500">Laden...</div>
          ) : leadRawData ? (
            <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-xs overflow-auto max-h-[70vh] font-mono">
              {JSON.stringify(leadRawData, null, 2)}
            </pre>
          ) : (
            <div className="py-8 text-center text-gray-500">Keine Rohdaten verfügbar</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
