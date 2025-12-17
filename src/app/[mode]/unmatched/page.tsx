"use client";

import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { useUnmatched } from "@/lib/queries";
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

const reasonLabels: Record<string, string> = {
  lead_not_found: "Lead nicht gefunden",
  email_not_found: "E-Mail nicht gefunden",
  multiple_matches: "Mehrere Treffer",
  unknown: "Unbekannt",
};

export default function UnmatchedPage() {
  const { data: unmatched, isLoading, isError, refetch } = useUnmatched(100);

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Verlorene Signale</h1>
        <ErrorCard message="Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Verlorene Signale</h1>
        {unmatched && unmatched.length > 0 && (
          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
            {unmatched.length} nicht zugeordnet
          </Badge>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900">Was sind verlorene Signale?</h3>
            <p className="text-orange-800 text-sm mt-1">
              Diese Einträge wurden in Monday.com als &quot;Gewonnen&quot; markiert, konnten aber nicht
              mit einem Lead in unserer Datenbank verknüpft werden. Mögliche Gründe:
              Die E-Mail-Adresse wurde geändert, der Lead wurde manuell angelegt, oder
              es gab einen Sync-Fehler.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Daten werden geladen...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-Mail</TableHead>
                <TableHead>Grund</TableHead>
                <TableHead>Monday Pulse ID</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmatched?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {event.email_extracted || "Keine E-Mail"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-700 border-orange-200"
                    >
                      {reasonLabels[event.reason] || event.reason}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {event.pulse_id}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(event.created_at), "d. MMM yyyy, HH:mm", { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`https://photowaermo.monday.com/boards/${event.board_id}/pulses/${event.pulse_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      In Monday öffnen
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {(!unmatched || unmatched.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Keine verlorenen Signale gefunden
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
