"use client";

import { useState } from "react";
import Image from "next/image";
import { Trophy } from "lucide-react";
import { useDateRange } from "@/lib/date-context";
import { useAttribution } from "@/lib/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatCurrency, formatNumber, translateToGerman } from "@/lib/utils";

type Level = "campaign" | "adset" | "ad";

export default function AttributionPage() {
  const [level, setLevel] = useState<Level>("campaign");
  const { dateRange } = useDateRange();
  const { data: attribution, isLoading, isError, refetch } = useAttribution(
    dateRange.startDate,
    dateRange.endDate,
    level
  );

  const sortedData = attribution?.sort((a, b) => b.roas - a.roas) || [];
  const topRoas = sortedData[0]?.roas || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attribution</h1>

      <Tabs value={level} onValueChange={(v) => setLevel(v as Level)}>
        <TabsList>
          <TabsTrigger value="campaign">Kampagnen</TabsTrigger>
          <TabsTrigger value="adset">Anzeigengruppen</TabsTrigger>
          <TabsTrigger value="ad">Anzeigen / Creatives</TabsTrigger>
        </TabsList>

        <TabsContent value={level} className="mt-6">
          {isError ? (
            <ErrorCard message="Attributionsdaten konnten nicht geladen werden" onRetry={() => refetch()} />
          ) : (
            <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Laden...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      {level === "ad" && <TableHead>Creative</TableHead>}
                      <TableHead className="text-right">Ausgaben</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Verkäufe</TableHead>
                      <TableHead className="text-right">CPL</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((item, index) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {translateToGerman(item.name)}
                            {index === 0 && topRoas > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                <Trophy className="h-3 w-3 mr-1" />
                                Gewinner
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {level === "ad" && (
                          <TableCell>
                            {item.creative_thumbnail ? (
                              <Image
                                src={item.creative_thumbnail}
                                alt="Creative"
                                width={48}
                                height={48}
                                className="h-12 w-12 object-cover rounded"
                                unoptimized
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                                K.A.
                              </div>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right">{formatCurrency(item.spend)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.leads)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.sales)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.cpl)}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              item.roas >= 3
                                ? "text-green-600 font-semibold"
                                : item.roas >= 1
                                ? "text-yellow-600"
                                : "text-red-600"
                            }
                          >
                            {item.roas.toFixed(2)}x
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={level === "ad" ? 7 : 6} className="text-center py-8 text-gray-500">
                          Keine Daten verfügbar
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
