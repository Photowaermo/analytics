"use client";

import { useMemo } from "react";
import { Search, Shuffle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { useKamMismatches } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
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
import { usePersistedState } from "@/lib/use-persisted-state";

export function KamMismatchesPage() {
  const [searchFilter, setSearchFilter] = usePersistedState("kam-mismatches-search", "");

  const { data, isLoading, isError, refetch } = useKamMismatches();

  const filtered = useMemo(() => {
    let mismatches = data?.mismatches || [];
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      mismatches = mismatches.filter(m =>
        m.customerName.toLowerCase().includes(q) ||
        m.customerEmail.toLowerCase().includes(q) ||
        m.bookingKam.name.toLowerCase().includes(q) ||
        m.bookingKam.email.toLowerCase().includes(q) ||
        m.platformKam.toLowerCase().includes(q)
      );
    }
    return mismatches;
  }, [data, searchFilter]);

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">KAM-Mismatch</h1>
        <ErrorCard message="Daten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">KAM-Mismatch</h1>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-xs">
        {isLoading ? (
          <KpiCardSkeleton />
        ) : (
          <KpiCard title="Mismatches" value={formatNumber(filtered.length)} icon={Shuffle} />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Name, E-Mail oder KAM suchen..."
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
                <TableHead>Kunde</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Termin-Datum</TableHead>
                <TableHead>Booking KAM</TableHead>
                <TableHead>Platform KAM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.bookingId}>
                  <TableCell className="font-medium text-sm">{m.customerName}</TableCell>
                  <TableCell className="text-sm">{m.customerEmail}</TableCell>
                  <TableCell className="text-sm">
                    {format(parseISO(m.startAt), "d. MMM yyyy, HH:mm", { locale: de })}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{m.bookingKam.name}</div>
                    <div className="text-xs text-gray-500">{m.bookingKam.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">{m.platformKam}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Keine Mismatches gefunden
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
