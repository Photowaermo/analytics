"use client";

import { useState } from "react";
import Image from "next/image";
import { Trophy, ChevronRight, ArrowLeft, X } from "lucide-react";
import { useDateRange } from "@/lib/date-context";
import { useAttribution } from "@/lib/queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/ui/error-card";
import { formatCurrency, formatNumber, translateToGerman } from "@/lib/utils";

type Level = "campaign" | "adset" | "ad";

interface BreadcrumbItem {
  level: Level;
  name: string;
  value?: string;
}

export default function AttributionPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedAdset, setSelectedAdset] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { dateRange } = useDateRange();

  // Determine current level based on selection
  const currentLevel: Level = selectedAdset ? "ad" : selectedCampaign ? "adset" : "campaign";

  const { data: attribution, isLoading, isError, refetch } = useAttribution(
    dateRange.startDate,
    dateRange.endDate,
    currentLevel,
    selectedCampaign || undefined,
    selectedAdset || undefined
  );

  // Data comes pre-sorted by date (newest first) from backend
  const sortedData = attribution || [];
  const topRoas = sortedData.filter(item => item.roas > 0).sort((a, b) => b.roas - a.roas)[0]?.roas || 0;

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = [
    { level: "campaign", name: "Kampagnen" },
  ];
  if (selectedCampaign) {
    breadcrumbs.push({ level: "adset", name: translateToGerman(selectedCampaign), value: selectedCampaign });
  }
  if (selectedAdset) {
    breadcrumbs.push({ level: "ad", name: translateToGerman(selectedAdset), value: selectedAdset });
  }

  const handleRowClick = (item: { name: string }) => {
    if (currentLevel === "campaign") {
      setSelectedCampaign(item.name);
    } else if (currentLevel === "adset") {
      setSelectedAdset(item.name);
    }
    // At ad level, no further drill-down
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      // Go back to campaigns
      setSelectedCampaign(null);
      setSelectedAdset(null);
    } else if (index === 1) {
      // Go back to ad sets (keep campaign selected)
      setSelectedAdset(null);
    }
    // Index 2 would be current level (ads), no action needed
  };

  const handleBack = () => {
    if (selectedAdset) {
      setSelectedAdset(null);
    } else if (selectedCampaign) {
      setSelectedCampaign(null);
    }
  };

  const getLevelLabel = () => {
    switch (currentLevel) {
      case "campaign":
        return "Kampagnen";
      case "adset":
        return "Anzeigengruppen";
      case "ad":
        return "Anzeigen / Creatives";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attribution</h1>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        {(selectedCampaign || selectedAdset) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>
        )}
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />}
            <button
              onClick={() => handleBreadcrumbClick(index)}
              disabled={index === breadcrumbs.length - 1}
              className={`${
                index === breadcrumbs.length - 1
                  ? "text-gray-900 font-medium cursor-default"
                  : "text-blue-600 hover:text-blue-800 hover:underline"
              }`}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Entry count */}
      {sortedData.length > 0 && (
        <div className="flex justify-end">
          <span className="text-sm text-gray-500">{sortedData.length} Einträge</span>
        </div>
      )}

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
                  {currentLevel === "ad" && <TableHead>Creative</TableHead>}
                  <TableHead className="text-right">Impressionen</TableHead>
                  <TableHead className="text-right">Klicks</TableHead>
                  <TableHead className="text-right">Ausgaben</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Verkäufe</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  {currentLevel !== "ad" && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => {
                  const isTopPerformer = item.roas === topRoas && topRoas > 0;
                  const isClickable = currentLevel !== "ad";

                  return (
                    <TableRow
                      key={item.name}
                      onClick={() => isClickable && handleRowClick(item)}
                      className={isClickable ? "cursor-pointer hover:bg-gray-50" : ""}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {translateToGerman(item.name)}
                          {isTopPerformer && index === sortedData.findIndex(i => i.roas === topRoas) && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              <Trophy className="h-3 w-3 mr-1" />
                              Gewinner
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {currentLevel === "ad" && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {item.creative_thumbnail ? (
                            <button
                              onClick={() => setSelectedImage(item.creative_thumbnail!)}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src={item.creative_thumbnail}
                                alt="Creative"
                                width={48}
                                height={48}
                                className="h-12 w-12 object-cover rounded"
                                unoptimized
                              />
                            </button>
                          ) : (
                            <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                              K.A.
                            </div>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right">{formatNumber(item.impressions || 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.clicks || 0)}</TableCell>
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
                      {currentLevel !== "ad" && (
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {sortedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={currentLevel === "ad" ? 9 : 10} className="text-center py-8 text-gray-500">
                      Keine Daten verfügbar
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Help Text */}
      {currentLevel !== "ad" && sortedData.length > 0 && (
        <p className="text-sm text-gray-500">
          Klicken Sie auf eine Zeile, um {currentLevel === "campaign" ? "die Anzeigengruppen" : "die Anzeigen"} anzuzeigen.
        </p>
      )}

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-none overflow-hidden">
          <DialogTitle className="sr-only">Creative Vorschau</DialogTitle>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          {selectedImage && (
            <div className="flex items-center justify-center p-4">
              <Image
                src={selectedImage}
                alt="Creative Preview"
                width={800}
                height={800}
                className="max-w-full max-h-[85vh] object-contain rounded"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
