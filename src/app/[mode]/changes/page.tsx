"use client";

import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { useDateRange } from "@/lib/date-context";
import { useStatusChanges } from "@/lib/queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ErrorCard } from "@/components/ui/error-card";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  booked: "bg-indigo-100 text-indigo-800",
  cancelled_booking: "bg-orange-100 text-orange-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  synced: "bg-cyan-100 text-cyan-800",
  sync_failed: "bg-red-100 text-red-800",
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
  sync_failed: "Sync Fehler",
};

const triggerLabels: Record<string, string> = {
  create: "Erstellt",
  crm_sync: "CRM-Sync",
  reonic_poll: "Reonic-Abfrage",
  booking_webhook: "Buchungs-Webhook",
  crm_webhook: "CRM-Webhook",
  backfill: "Nacherfassung",
};

export default function ChangesPage() {
  const { dateRange } = useDateRange();
  const { data: changes, isLoading, isError, refetch } = useStatusChanges(
    dateRange.startDate,
    dateRange.endDate,
    200
  );

  // Nur relevante Status: Termin gebucht, storniert, gewonnen, verloren
  const relevantStatuses = ["cancelled_booking", "won", "lost"];
  const filtered = changes?.filter(c => relevantStatuses.includes(c.to_status));

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Neueste Änderungen</h1>
        <ErrorCard message="Statusänderungen konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Neueste Änderungen</h1>
        {filtered && (
          <span className="text-sm text-gray-500">
            {filtered.length} Änderungen
          </span>
        )}
      </div>

      <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Änderungen werden geladen...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-Mail</TableHead>
                <TableHead>Statusänderung</TableHead>
                <TableHead>Auslöser</TableHead>
                <TableHead>Zeitpunkt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((change, index) => (
                <TableRow key={`${change.lead_id}-${index}`}>
                  <TableCell className="font-medium">{change.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs font-normal">
                        {statusLabels[change.from_status] || change.from_status}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                      <Badge className={`text-xs ${statusColors[change.to_status] || "bg-gray-100 text-gray-800"}`}>
                        {statusLabels[change.to_status] || change.to_status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {triggerLabels[change.trigger] || change.trigger}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(parseISO(change.created_at), "d. MMM yyyy, HH:mm", { locale: de })}
                  </TableCell>
                </TableRow>
              ))}
              {(!filtered || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    Keine Statusänderungen im gewählten Zeitraum
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
