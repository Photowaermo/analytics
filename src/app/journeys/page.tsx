"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Eye } from "lucide-react";
import { useJourneys, useJourneyDetail } from "@/lib/queries";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorCard } from "@/components/ui/error-card";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  new: "Neu",
  contacted: "Kontaktiert",
  qualified: "Qualifiziert",
  won: "Gewonnen",
  lost: "Verloren",
};

export default function JourneysPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { data: leads, isLoading, isError, refetch } = useJourneys(50, 0);
  const { data: journeyDetail, isLoading: detailLoading, isError: detailError } = useJourneyDetail(selectedLeadId || "");

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Lead-Verlauf</h1>
        <ErrorCard message="Leads konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Lead-Verlauf</h1>

      <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Leads werden geladen...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-Mail</TableHead>
                <TableHead>Quelle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads?.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.email}</TableCell>
                  <TableCell>{lead.source_name}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[lead.crm_status] || "bg-gray-100 text-gray-800"}>
                      {statusLabels[lead.crm_status] || lead.crm_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(lead.created_at), "d. MMM yyyy, HH:mm", { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
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
              {leads?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Keine Leads gefunden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Journey Detail Modal */}
      <Dialog open={!!selectedLeadId} onOpenChange={() => setSelectedLeadId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                          <p className="mt-1 text-sm text-gray-600">{event.details}</p>
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
    </div>
  );
}
