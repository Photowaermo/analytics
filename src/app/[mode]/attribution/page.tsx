"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Trophy, ChevronRight, ChevronDown, ArrowLeft, X, AlertTriangle, Info, Save, Loader2, Settings } from "lucide-react";
import { useMode } from "@/lib/mode-context";
import { useProduct, getProductParam } from "@/lib/product-context";
import { useDateRange } from "@/lib/date-context";
import { usePlatform } from "@/lib/platform-context";
import { useAttribution, useSettings, useUpdateSettings } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import {
  evaluateAmpel,
  getQuickToggleDates,
  DEFAULT_AMPEL_CONFIG,
  type AmpelConfig,
  type AmpelResult,
  type QuickToggle,
} from "@/lib/ampel";
import { AmpelDot } from "@/components/ui/ampel-dot";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ErrorCard } from "@/components/ui/error-card";
import { cn, formatCurrency, formatNumber, translateToGerman } from "@/lib/utils";

type Level = "campaign" | "adset" | "ad";

interface BreadcrumbItem {
  level: Level;
  name: string;
  value?: string;
}

type SortBy = "roas" | "leads" | "cpl";
type TopCount = 3 | 5 | 10;

// Status colors and labels for campaign/adset/ad status
const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Aktiv", className: "bg-green-100 text-green-800" },
  PAUSED: { label: "Pausiert", className: "bg-yellow-100 text-yellow-800" },
  DELETED: { label: "Gelöscht", className: "bg-red-100 text-red-800" },
  ARCHIVED: { label: "Archiviert", className: "bg-gray-100 text-gray-800" },
  PENDING_REVIEW: { label: "In Prüfung", className: "bg-blue-100 text-blue-800" },
  DISAPPROVED: { label: "Abgelehnt", className: "bg-red-100 text-red-800" },
  PREAPPROVED: { label: "Vorab genehmigt", className: "bg-blue-100 text-blue-800" },
  PENDING_BILLING_INFO: { label: "Zahlung ausstehend", className: "bg-orange-100 text-orange-800" },
  CAMPAIGN_PAUSED: { label: "Kampagne pausiert", className: "bg-yellow-100 text-yellow-800" },
  ADSET_PAUSED: { label: "Anzeigengruppe pausiert", className: "bg-yellow-100 text-yellow-800" },
};

// Campaign objective labels
const objectiveConfig: Record<string, { label: string; className: string }> = {
  OUTCOME_LEADS: { label: "Leads", className: "bg-blue-100 text-blue-800" },
  OUTCOME_ENGAGEMENT: { label: "Interaktion", className: "bg-purple-100 text-purple-800" },
  OUTCOME_TRAFFIC: { label: "Traffic", className: "bg-cyan-100 text-cyan-800" },
  LINK_CLICKS: { label: "Traffic", className: "bg-cyan-100 text-cyan-800" },
  OUTCOME_SALES: { label: "Verkäufe", className: "bg-green-100 text-green-800" },
  OUTCOME_AWARENESS: { label: "Bekanntheit", className: "bg-orange-100 text-orange-800" },
};

export default function AttributionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mode } = useMode();

  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedAdset, setSelectedAdset] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Top Ads panel state
  const [isTopAdsExpanded, setIsTopAdsExpanded] = useState(false);
  const [topAdsCount, setTopAdsCount] = useState<TopCount>(3);
  const [topAdsSortBy, setTopAdsSortBy] = useState<SortBy>("leads");

  // Quick Toggle for attribution-specific date range
  const [quickToggle, setQuickToggle] = useState<QuickToggle>("global");

  const { dateRange } = useDateRange();
  const { platformParam } = usePlatform();
  const { product } = useProduct();

  // Ampel config from settings
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();
  const [showAmpelSettings, setShowAmpelSettings] = useState(false);
  const [editAmpelConfig, setEditAmpelConfig] = useState<Record<string, string>>({});

  const ampelConfig: AmpelConfig = useMemo(() => {
    if (!settingsData?.ampel_config) return DEFAULT_AMPEL_CONFIG;
    const cfg = settingsData.ampel_config;
    return {
      targetCpl: cfg.target_cpl,
      yellowMultiplier: cfg.yellow_multiplier,
      minLeadsAd: cfg.min_leads_ad,
      minLeadsAdset: cfg.min_leads_adset,
      adSpendThreshold: cfg.ad_spend_threshold,
      adsetSpendThreshold: cfg.adset_spend_threshold,
      killThresholdSpend: cfg.kill_threshold_spend,
    };
  }, [settingsData]);

  // Sync edit form with current config
  useEffect(() => {
    setEditAmpelConfig({
      target_cpl: String(ampelConfig.targetCpl),
      yellow_multiplier: String(ampelConfig.yellowMultiplier),
      min_leads_ad: String(ampelConfig.minLeadsAd),
      min_leads_adset: String(ampelConfig.minLeadsAdset),
      ad_spend_threshold: String(ampelConfig.adSpendThreshold),
      adset_spend_threshold: String(ampelConfig.adsetSpendThreshold),
      kill_threshold_spend: String(ampelConfig.killThresholdSpend),
    });
  }, [ampelConfig]);

  const handleAmpelConfigChange = (key: string, value: string) => {
    setEditAmpelConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAmpelConfig = async () => {
    await updateSettings.mutateAsync({
      provider_prices: settingsData?.provider_prices || {},
      active_ad_platforms: settingsData?.active_ad_platforms,
      ampel_config: {
        target_cpl: parseFloat(editAmpelConfig.target_cpl) || 30,
        yellow_multiplier: parseFloat(editAmpelConfig.yellow_multiplier) || 1.2,
        min_leads_ad: parseFloat(editAmpelConfig.min_leads_ad) || 3,
        min_leads_adset: parseFloat(editAmpelConfig.min_leads_adset) || 5,
        ad_spend_threshold: parseFloat(editAmpelConfig.ad_spend_threshold) || 60,
        adset_spend_threshold: parseFloat(editAmpelConfig.adset_spend_threshold) || 150,
        kill_threshold_spend: parseFloat(editAmpelConfig.kill_threshold_spend) || 90,
      },
    });
    setShowAmpelSettings(false);
  };

  // Effective date range (quick toggle overrides global)
  const effectiveDateRange = getQuickToggleDates(quickToggle, dateRange);

  // Only apply platform filter when in ads mode
  const platform = mode === "ads" ? platformParam : undefined;

  const productParam = getProductParam(product) || undefined;

  // Initialize state from URL params on mount
  useEffect(() => {
    const campaign = searchParams.get("campaign");
    const adset = searchParams.get("adset");
    if (campaign) setSelectedCampaign(campaign);
    if (adset) setSelectedAdset(adset);
  }, [searchParams]);

  // Update URL when selection changes
  const updateUrl = (campaign: string | null, adset: string | null) => {
    const params = new URLSearchParams();
    if (campaign) params.set("campaign", campaign);
    if (adset) params.set("adset", adset);
    const queryString = params.toString();
    router.replace(queryString ? `/${mode}/attribution?${queryString}` : `/${mode}/attribution`, { scroll: false });
  };

  // Determine current level based on selection
  const currentLevel: Level = selectedAdset ? "ad" : selectedCampaign ? "adset" : "campaign";

  const { data: attribution, isLoading, isError, refetch } = useAttribution(
    effectiveDateRange.startDate,
    effectiveDateRange.endDate,
    currentLevel,
    selectedCampaign || undefined,
    selectedAdset || undefined,
    platform,
    productParam
  );

  // Fetch ALL items for current level globally (for Top comparison panel)
  const { data: allItemsForLevel, isLoading: allItemsLoading } = useAttribution(
    effectiveDateRange.startDate,
    effectiveDateRange.endDate,
    currentLevel,
    undefined,
    undefined,
    platform,
    productParam
  );

  // Sort and filter top items based on selected metric
  const getTopItems = () => {
    if (!allItemsForLevel) return [];

    let sorted = [...allItemsForLevel];

    switch (topAdsSortBy) {
      case "roas":
        sorted = sorted.filter(a => a.roas > 0).sort((a, b) => b.roas - a.roas);
        break;
      case "leads":
        sorted = sorted.filter(a => a.leads > 0).sort((a, b) => b.leads - a.leads);
        break;
      case "cpl":
        sorted = sorted.filter(a => a.cpl > 0).sort((a, b) => a.cpl - b.cpl);
        break;
    }

    return sorted.slice(0, topAdsCount);
  };

  const topItems = getTopItems();

  // Labels based on current level
  const levelLabels = {
    campaign: { singular: "Kampagne", plural: "Kampagnen", title: "Top Kampagnen Vergleich" },
    adset: { singular: "Anzeigengruppe", plural: "Anzeigengruppen", title: "Top Anzeigengruppen Vergleich" },
    ad: { singular: "Ad", plural: "Ads", title: "Top Ads Vergleich" },
  };
  const currentLevelLabels = levelLabels[currentLevel];

  // Data comes pre-sorted by date (newest first) from backend
  const sortedData = useMemo(() => attribution || [], [attribution]);
  const topRoas = sortedData.filter(item => item.roas > 0).sort((a, b) => b.roas - a.roas)[0]?.roas || 0;

  // Compute Ampel results for each row
  const ampelResults = useMemo(() => {
    const map = new Map<string, AmpelResult>();
    for (const item of sortedData) {
      map.set(item.name, evaluateAmpel(item, currentLevel, ampelConfig));
    }
    return map;
  }, [sortedData, currentLevel, ampelConfig]);

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
      updateUrl(item.name, null);
    } else if (currentLevel === "adset") {
      setSelectedAdset(item.name);
      updateUrl(selectedCampaign, item.name);
    }
    // At ad level, no further drill-down
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      // Go back to campaigns
      setSelectedCampaign(null);
      setSelectedAdset(null);
      updateUrl(null, null);
    } else if (index === 1) {
      // Go back to ad sets (keep campaign selected)
      setSelectedAdset(null);
      updateUrl(selectedCampaign, null);
    }
    // Index 2 would be current level (ads), no action needed
  };

  const handleBack = () => {
    if (selectedAdset) {
      setSelectedAdset(null);
      updateUrl(selectedCampaign, null);
    } else if (selectedCampaign) {
      setSelectedCampaign(null);
      updateUrl(null, null);
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
              className={`${index === breadcrumbs.length - 1
                  ? "text-gray-900 font-medium cursor-default"
                  : "text-blue-600 hover:text-blue-800 hover:underline"
                }`}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Toggle + Ampel Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-1">Zeitraum:</span>
          {(["global", "3d", "7d"] as QuickToggle[]).map((toggle) => (
            <Button
              key={toggle}
              variant={quickToggle === toggle ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickToggle(toggle)}
            >
              {toggle === "global" ? "Global" : toggle}
            </Button>
          ))}
          {quickToggle !== "global" && (
            <span className="text-xs text-gray-400 ml-2">
              {effectiveDateRange.startDate} – {effectiveDateRange.endDate}
            </span>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Info className="h-4 w-4" />
              Ampel-Legende
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 bg-white p-0">
            {/* Legend */}
            <div className="p-4">
              <h4 className="font-semibold text-sm mb-3">Ampel-Bewertung</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Gut</p>
                    <p className="text-xs text-gray-500">CPL ≤ {ampelConfig.targetCpl} € – Halten / skalieren</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Warnung</p>
                    <p className="text-xs text-gray-500">CPL {ampelConfig.targetCpl}–{(ampelConfig.targetCpl * ampelConfig.yellowMultiplier).toFixed(0)} € – Beobachten</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Schlecht</p>
                    <p className="text-xs text-gray-500">CPL &gt; {(ampelConfig.targetCpl * ampelConfig.yellowMultiplier).toFixed(0)} € – Reduzieren / stoppen</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-red-900 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Stoppen</p>
                    <p className="text-xs text-gray-500">0 Leads bei ≥ {ampelConfig.killThresholdSpend} € Ausgaben</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Lernphase</p>
                    <p className="text-xs text-gray-500">Noch zu wenig Daten für Bewertung</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Pausiert</p>
                    <p className="text-xs text-gray-500">Keine Aktion nötig</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 border-t pt-2">
                  <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">CPC-Warnung</p>
                    <p className="text-xs text-gray-500">Klickpreis zu hoch für Ziel-CPL</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings toggle */}
            <div className="border-t">
              <button
                onClick={() => setShowAmpelSettings(!showAmpelSettings)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5" />
                  Schwellenwerte anpassen
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAmpelSettings && "rotate-180")} />
              </button>

              {showAmpelSettings && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Ziel-CPL (€)</label>
                      <Input type="number" step="1" min="1" className="h-8 text-sm mt-1" value={editAmpelConfig.target_cpl} onChange={(e) => handleAmpelConfigChange("target_cpl", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Gelb-Multiplikator</label>
                      <Input type="number" step="0.05" min="1" className="h-8 text-sm mt-1" value={editAmpelConfig.yellow_multiplier} onChange={(e) => handleAmpelConfigChange("yellow_multiplier", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Min. Leads Ad</label>
                      <Input type="number" step="1" min="1" className="h-8 text-sm mt-1" value={editAmpelConfig.min_leads_ad} onChange={(e) => handleAmpelConfigChange("min_leads_ad", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Min. Leads Adset</label>
                      <Input type="number" step="1" min="1" className="h-8 text-sm mt-1" value={editAmpelConfig.min_leads_adset} onChange={(e) => handleAmpelConfigChange("min_leads_adset", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Spend-Schwelle Ad (€)</label>
                      <Input type="number" step="5" min="0" className="h-8 text-sm mt-1" value={editAmpelConfig.ad_spend_threshold} onChange={(e) => handleAmpelConfigChange("ad_spend_threshold", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Spend-Schwelle Adset (€)</label>
                      <Input type="number" step="5" min="0" className="h-8 text-sm mt-1" value={editAmpelConfig.adset_spend_threshold} onChange={(e) => handleAmpelConfigChange("adset_spend_threshold", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Kill-Schwelle (€)</label>
                      <Input type="number" step="5" min="0" className="h-8 text-sm mt-1" value={editAmpelConfig.kill_threshold_spend} onChange={(e) => handleAmpelConfigChange("kill_threshold_spend", e.target.value)} />
                    </div>
                  </div>
                  <Button size="sm" className="w-full" onClick={handleSaveAmpelConfig} disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                    Speichern
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Top Comparison Panel - adapts to current level */}
      <div className="rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* Header - always visible */}
        <button
          onClick={() => setIsTopAdsExpanded(!isTopAdsExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isTopAdsExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <span className="font-semibold text-gray-900">{currentLevelLabels.title}</span>
            {!isTopAdsExpanded && topItems.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {topItems.length} beste {currentLevelLabels.plural}
              </Badge>
            )}
          </div>

          {/* Controls - stop propagation to prevent toggle */}
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Select
              value={String(topAdsCount)}
              onValueChange={(v) => setTopAdsCount(Number(v) as TopCount)}
            >
              <SelectTrigger className="w-24 h-8 text-sm bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="3">Top 3</SelectItem>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={topAdsSortBy}
              onValueChange={(v) => setTopAdsSortBy(v as SortBy)}
            >
              <SelectTrigger className="w-32 h-8 text-sm bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="roas">Nach ROAS</SelectItem>
                <SelectItem value="leads">Nach Leads</SelectItem>
                <SelectItem value="cpl">Nach CPL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </button>

        {/* Expanded Content */}
        {isTopAdsExpanded && (
          <div className="border-t border-gray-200">
            {allItemsLoading ? (
              <div className="p-8 text-center text-gray-500">Laden...</div>
            ) : topItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Keine {currentLevelLabels.plural} mit Daten verfügbar</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {currentLevel === "ad" && <TableHead className="w-16">Creative</TableHead>}
                    <TableHead>Name</TableHead>
                    <TableHead className="w-20">Ampel</TableHead>
                    {currentLevel === "ad" && <TableHead>Kampagne</TableHead>}
                    {currentLevel === "ad" && <TableHead>Anzeigengruppe</TableHead>}
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Verkäufe</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topItems.map((item, index) => (
                    <TableRow key={item.name} className={index === 0 ? "bg-yellow-50" : ""}>
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
                                width={40}
                                height={40}
                                className="h-10 w-10 object-cover rounded"
                                unoptimized
                              />
                            </button>
                          ) : (
                            <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                              K.A.
                            </div>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Trophy className="h-4 w-4 text-yellow-600" />
                          )}
                          {translateToGerman(item.name)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AmpelDot result={evaluateAmpel(item, currentLevel, ampelConfig)} />
                      </TableCell>
                      {currentLevel === "ad" && (
                        <TableCell className="text-gray-600 text-sm">
                          {item.campaign_name ? translateToGerman(item.campaign_name) : "-"}
                        </TableCell>
                      )}
                      {currentLevel === "ad" && (
                        <TableCell className="text-gray-600 text-sm">
                          {item.adset_name ? translateToGerman(item.adset_name) : "-"}
                        </TableCell>
                      )}
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
                </TableBody>
              </Table>
            )}
          </div>
        )}
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
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ampel</TableHead>
                  {currentLevel === "campaign" && <TableHead>Typ</TableHead>}
                  {currentLevel === "ad" && <TableHead>Creative</TableHead>}
                  <TableHead className="text-right">Impressionen</TableHead>
                  <TableHead className="text-right">Klicks</TableHead>
                  <TableHead className="text-right">Ausgaben</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Verkäufe</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead>Empfehlung</TableHead>
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
                      className={cn(
                        isClickable ? "cursor-pointer hover:bg-gray-50" : "",
                        ampelResults.get(item.name)?.status === "kill" ? "bg-red-50/50" : ""
                      )}
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
                      <TableCell>
                        {item.effective_status ? (
                          <Badge className={statusConfig[item.effective_status]?.className || "bg-gray-100 text-gray-800"}>
                            {statusConfig[item.effective_status]?.label || item.effective_status}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const result = ampelResults.get(item.name);
                          return result ? <AmpelDot result={result} showLabel /> : null;
                        })()}
                      </TableCell>
                      {currentLevel === "campaign" && (
                        <TableCell>
                          {item.objective ? (
                            <Badge variant="outline" className={objectiveConfig[item.objective]?.className || "bg-gray-100 text-gray-800"}>
                              {objectiveConfig[item.objective]?.label || item.objective}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      )}
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
                      <TableCell>
                        {(() => {
                          const result = ampelResults.get(item.name);
                          if (!result) return null;
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm text-gray-700">{result.recommendation}</span>
                              {result.budgetSuggestion && (
                                <span className="text-xs text-gray-500">{result.budgetSuggestion}</span>
                              )}
                              {result.impossibleCpcWarning && (
                                <span className="text-xs text-orange-600 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  CPC-Warnung
                                </span>
                              )}
                            </div>
                          );
                        })()}
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
                    <TableCell colSpan={currentLevel === "campaign" ? 14 : currentLevel === "ad" ? 12 : 13} className="text-center py-8 text-gray-500">
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
