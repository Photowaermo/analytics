"use client";

import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Eye, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { useJourneys, useJourneyDetail, useLeadRaw, useStatusHistory } from "@/lib/queries";
import { useMode } from "@/lib/mode-context";
import { usePlatform } from "@/lib/platform-context";
import { useProduct, getProductParam } from "@/lib/product-context";
import { useDateRange } from "@/lib/date-context";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorCard } from "@/components/ui/error-card";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  booked: "bg-indigo-100 text-indigo-800",
  cancelled_booking: "bg-orange-100 text-orange-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  synced: "bg-gray-100 text-gray-800",
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
  // Fallback for English status if needed
  "sync_failed": "Sync Fehler",
};

const productLabels: Record<string, string> = {
  pv: "PV",
  heatpump: "Wärmepumpe",
  kombi: "Kombi",
  unknown: "Unbekannt",
};

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

// Map mode to provider for API filtering
const modeToProvider: Record<string, string | undefined> = {
  all: undefined,
  ads: "ads",
  organic: "organic",
  purchased: "purchased",
};

export default function JourneysPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [rawLeadId, setRawLeadId] = useState<string | null>(null);
  const [statusHistoryLeadId, setStatusHistoryLeadId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const { mode } = useMode();
  const { platformParam } = usePlatform();
  const { product } = useProduct();
  const { dateRange } = useDateRange();

  const provider = modeToProvider[mode];
  // Only apply platform filter when in ads mode
  const platform = mode === "ads" ? platformParam : undefined;

  const productParam = getProductParam(product) || undefined;

  const { data: leads, isLoading, isError, refetch } = useJourneys(1000, 0, provider, platform, dateRange.startDate, dateRange.endDate, productParam);
  const { data: journeyDetail, isLoading: detailLoading, isError: detailError } = useJourneyDetail(selectedLeadId || "");
  const { data: leadRawData, isLoading: rawLoading } = useLeadRaw(rawLeadId || "");
  const { data: statusHistory, isLoading: statusHistoryLoading } = useStatusHistory(statusHistoryLeadId || "");

  // Extract unique campaigns for filter dropdown
  const campaignOptions = useMemo(() => {
    const campaigns = new Set<string>();
    (leads || []).forEach(lead => {
      if (lead.campaign_name) campaigns.add(lead.campaign_name);
    });
    return [
      { value: "all", label: "Alle Kampagnen" },
      ...Array.from(campaigns).sort().map(c => ({ value: c, label: c }))
    ];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return (leads || []).filter(lead => {
      if (statusFilter !== "all" && lead.crm_status !== statusFilter) return false;
      if (campaignFilter !== "all" && lead.campaign_name !== campaignFilter) return false;
      return true;
    });
  }, [leads, statusFilter, campaignFilter]);

  const modeLabels: Record<string, string> = {
    all: "Alle",
    ads: "Werbeanzeigen",
    purchased: "Gekaufte Leads",
    organic: "Organisch",
  };
  const modeLabel = modeLabels[mode] || mode;

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Lead-Verlauf - {modeLabel}</h1>
        <ErrorCard message="Leads konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lead-Verlauf - {modeLabel}</h1>
        <div className="flex items-center gap-2">
          {mode === "ads" && (
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-64 bg-white">
                <SelectValue placeholder="Kampagne filtern" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-60">
                {campaignOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="truncate">{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Leads werden geladen...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-Mail</TableHead>
                <TableHead>Produkt</TableHead>
                <TableHead>Quelle</TableHead>
                <TableHead>Formular</TableHead>
                {mode === "ads" && (
                  <>
                    <TableHead>Kampagne</TableHead>
                    <TableHead>Anzeigengruppe</TableHead>
                    <TableHead>Anzeige</TableHead>
                  </>
                )}
                <TableHead>Status</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setRawLeadId(lead.id)}>
                  <TableCell className="font-medium">{lead.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {productLabels[lead.product || ""] || lead.product || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{lead.source_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {lead.submission_type === "lead_form" ? "Lead-Formular" :
                        lead.submission_type === "website" ? "Website" :
                          lead.submission_type === "api" ? "API" : lead.submission_type}
                    </Badge>
                  </TableCell>
                  {mode === "ads" && (
                    <>
                      <TableCell className="text-sm max-w-[150px]">
                        {lead.campaign_name ? (
                          <Link
                            href={`/${mode}/attribution?campaign=${encodeURIComponent(lead.campaign_name)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline block truncate"
                            title={lead.campaign_name}
                          >
                            {lead.campaign_name}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px]">
                        {lead.adset_name && lead.campaign_name ? (
                          <Link
                            href={`/${mode}/attribution?campaign=${encodeURIComponent(lead.campaign_name)}&adset=${encodeURIComponent(lead.adset_name)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline block truncate"
                            title={lead.adset_name}
                          >
                            {lead.adset_name}
                          </Link>
                        ) : (
                          <span className="truncate block" title={lead.adset_name || undefined}>
                            {lead.adset_name || "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px]">
                        {lead.ad_name && lead.campaign_name && lead.adset_name ? (
                          <Link
                            href={`/${mode}/attribution?campaign=${encodeURIComponent(lead.campaign_name)}&adset=${encodeURIComponent(lead.adset_name)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline block truncate"
                            title={lead.ad_name}
                          >
                            {lead.ad_name}
                          </Link>
                        ) : (
                          <span className="truncate block text-gray-600" title={lead.ad_name || undefined}>
                            {lead.ad_name || "-"}
                          </span>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Badge
                      className={`cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-shadow ${statusColors[lead.crm_status] || "bg-gray-100 text-gray-800"}`}
                      onClick={() => setStatusHistoryLeadId(lead.id)}
                    >
                      <Clock className="h-3 w-3 mr-1" />
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
                  <TableCell colSpan={mode === "ads" ? 10 : 7} className="text-center py-8 text-gray-500">
                    Keine Leads für {modeLabel} gefunden
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
                          className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${event.type === "sale_won"
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

      {/* Status History Dialog */}
      <Dialog open={!!statusHistoryLeadId} onOpenChange={() => setStatusHistoryLeadId(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Status-Verlauf</DialogTitle>
            {statusHistory && (
              <DialogDescription>{statusHistory.email}</DialogDescription>
            )}
          </DialogHeader>
          {statusHistoryLoading ? (
            <div className="py-8 text-center text-gray-500">Laden...</div>
          ) : statusHistory?.history?.length ? (
            <div className="relative py-2">
              <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {statusHistory.history.map((entry, index) => {
                  const isLast = index === statusHistory.history.length - 1;
                  const dotColor = entry.to_status === "won"
                    ? "bg-green-500"
                    : entry.to_status === "lost"
                    ? "bg-red-500"
                    : entry.to_status === "booked"
                    ? "bg-indigo-500"
                    : entry.to_status === "cancelled_booking"
                    ? "bg-orange-500"
                    : entry.to_status === "synced"
                    ? "bg-cyan-500"
                    : "bg-blue-500";
                  const triggerLabels: Record<string, string> = {
                    create: "Erstellt",
                    crm_sync: "CRM-Sync",
                    reonic_poll: "Reonic-Abfrage",
                    booking_webhook: "Buchungs-Webhook",
                    crm_webhook: "CRM-Webhook",
                    backfill: "Nacherfassung",
                  };
                  return (
                    <div key={index} className="relative flex items-start gap-3 pl-10">
                      <div className={`absolute left-2.5 w-[13px] h-[13px] rounded-full border-2 border-white shadow-sm ${dotColor} ${isLast ? "ring-2 ring-offset-1 ring-gray-300" : ""}`} />
                      <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            {entry.from_status ? (
                              <>
                                <Badge variant="outline" className="text-xs font-normal">
                                  {statusLabels[entry.from_status] || entry.from_status}
                                </Badge>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                              </>
                            ) : null}
                            <Badge className={`text-xs ${statusColors[entry.to_status] || "bg-gray-100 text-gray-800"}`}>
                              {statusLabels[entry.to_status] || entry.to_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1.5">
                          <span>{triggerLabels[entry.trigger] || entry.trigger}</span>
                          <span>{format(parseISO(entry.created_at), "d. MMM yyyy, HH:mm", { locale: de })}</span>
                        </div>
                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-400 font-mono bg-white rounded px-2 py-1 border border-gray-100">
                            {Object.entries(entry.metadata).map(([k, v]) => (
                              <div key={k}>{k}: {String(v)}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">Keine Status-Historie verfügbar</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
