import { format, subDays } from "date-fns";
import type { Attribution } from "./api";

// --- Types ---

export type AmpelStatus = "green" | "yellow" | "red" | "blue" | "gray" | "kill";

export interface AmpelConfig {
  targetCpl: number;
  yellowMultiplier: number;
  minLeadsAd: number;
  minLeadsAdset: number;
  adSpendThreshold: number;
  adsetSpendThreshold: number;
  killThresholdSpend: number;
}

export interface AmpelResult {
  status: AmpelStatus;
  color: string;
  bgColor: string;
  label: string;
  recommendation: string;
  budgetSuggestion?: string;
  budgetDelta?: number;
  impossibleCpcWarning: boolean;
}

export type QuickToggle = "global" | "3d" | "7d";

// --- Defaults ---

export const DEFAULT_AMPEL_CONFIG: AmpelConfig = {
  targetCpl: 30,
  yellowMultiplier: 1.2,
  minLeadsAd: 3,
  minLeadsAdset: 5,
  adSpendThreshold: 60,
  adsetSpendThreshold: 150,
  killThresholdSpend: 90,
};

// --- Color / Label / Recommendation Mappings ---

const ampelMeta: Record<
  AmpelStatus,
  { color: string; bgColor: string; label: string; recommendation: string }
> = {
  green: {
    color: "bg-green-500",
    bgColor: "bg-green-50",
    label: "Gut",
    recommendation: "Halten / +20% skalieren",
  },
  yellow: {
    color: "bg-yellow-400",
    bgColor: "bg-yellow-50",
    label: "Warnung",
    recommendation: "Beobachten / leicht reduzieren",
  },
  red: {
    color: "bg-red-500",
    bgColor: "bg-red-50",
    label: "Schlecht",
    recommendation: "Reduzieren oder stoppen",
  },
  blue: {
    color: "bg-blue-400",
    bgColor: "bg-blue-50",
    label: "Lernphase",
    recommendation: "Weiterlaufen lassen",
  },
  gray: {
    color: "bg-gray-400",
    bgColor: "bg-gray-50",
    label: "Pausiert",
    recommendation: "Pausiert – keine Aktion",
  },
  kill: {
    color: "bg-red-900",
    bgColor: "bg-red-100",
    label: "Stoppen",
    recommendation: "Sofort stoppen",
  },
};

// --- Status priority (higher = takes precedence) ---

const STATUS_PRIORITY: Record<AmpelStatus, number> = {
  green: 1,
  yellow: 2,
  red: 3,
  kill: 4,
  blue: 5,
  gray: 6,
};

export function getWorstStatus(statuses: AmpelStatus[]): AmpelStatus {
  return statuses.reduce(
    (worst, current) =>
      STATUS_PRIORITY[current] > STATUS_PRIORITY[worst] ? current : worst,
    "green" as AmpelStatus
  );
}

// --- Helpers ---

const PAUSED_STATUSES = ["PAUSED", "CAMPAIGN_PAUSED", "ADSET_PAUSED"];

function isWithin72h(createdDate?: string): boolean {
  if (!createdDate) return false;
  const created = new Date(createdDate);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return diffMs / (1000 * 60 * 60) <= 72;
}

function checkImpossibleCpc(item: Attribution, config: AmpelConfig): boolean {
  if (!item.clicks || item.clicks === 0) return false;
  const cpc = item.spend / item.clicks;
  // If CPC > 50% of target CPL, conversion rate would need to be > 50% — improbable
  return cpc > config.targetCpl * 0.5;
}

function buildResult(
  status: AmpelStatus,
  level: "campaign" | "adset" | "ad",
  config: AmpelConfig,
  item: Attribution
): AmpelResult {
  const meta = ampelMeta[status];

  let budgetSuggestion: string | undefined;
  let budgetDelta: number | undefined;

  if (level === "adset") {
    switch (status) {
      case "green":
        budgetSuggestion = "+20% Budget empfohlen";
        budgetDelta = 0.2;
        break;
      case "yellow":
        budgetSuggestion = "Budget beibehalten";
        budgetDelta = 0;
        break;
      case "red":
      case "kill":
        budgetSuggestion = "-20% Budget empfohlen";
        budgetDelta = -0.2;
        break;
    }
  }

  return {
    status,
    color: meta.color,
    bgColor: meta.bgColor,
    label: meta.label,
    recommendation: meta.recommendation,
    budgetSuggestion,
    budgetDelta,
    impossibleCpcWarning: checkImpossibleCpc(item, config),
  };
}

// --- Main evaluation function ---

export function evaluateAmpel(
  item: Attribution,
  level: "campaign" | "adset" | "ad",
  config: AmpelConfig
): AmpelResult {
  // 1. PAUSED check (highest priority)
  if (
    item.effective_status &&
    PAUSED_STATUSES.includes(item.effective_status)
  ) {
    return buildResult("gray", level, config, item);
  }

  // 2. Determine thresholds by level (campaign uses adset thresholds)
  const minLeads = level === "ad" ? config.minLeadsAd : config.minLeadsAdset;
  const spendThreshold =
    level === "ad" ? config.adSpendThreshold : config.adsetSpendThreshold;

  // 3. Flags
  const isNew = isWithin72h(item.created_date);
  const hasEnoughLeads = item.leads >= minLeads;
  const hasEnoughSpend = item.spend >= spendThreshold;

  // 4. Learning phase: not enough leads AND not enough spend
  if (!hasEnoughLeads && !hasEnoughSpend) {
    return buildResult("blue", level, config, item);
  }

  // 5. 72h rule: still new + not enough leads (but has enough spend to evaluate)
  //    After 72h this falls through to kill/red checks below
  if (isNew && !hasEnoughLeads) {
    return buildResult("blue", level, config, item);
  }

  // 6. KILL: 0 leads + spend >= kill threshold
  if (item.leads === 0 && item.spend >= config.killThresholdSpend) {
    return buildResult("kill", level, config, item);
  }

  // 7. Critical: 0-1 leads despite sufficient spend
  if (item.leads <= 1 && hasEnoughSpend) {
    return buildResult("red", level, config, item);
  }

  // 8. If still 0 leads but didn't hit kill threshold
  if (item.leads === 0) {
    return buildResult("blue", level, config, item);
  }

  // 9. CPL-based evaluation
  const yellowThreshold = config.targetCpl * config.yellowMultiplier;

  if (item.cpl <= config.targetCpl) {
    return buildResult("green", level, config, item);
  } else if (item.cpl <= yellowThreshold) {
    return buildResult("yellow", level, config, item);
  } else {
    return buildResult("red", level, config, item);
  }
}

// --- Quick Toggle date helper ---

export function getQuickToggleDates(
  toggle: QuickToggle,
  globalDateRange: { startDate: string; endDate: string }
): { startDate: string; endDate: string } {
  if (toggle === "global") return globalDateRange;

  const today = new Date();
  const days = toggle === "3d" ? 3 : 7;

  return {
    startDate: format(subDays(today, days), "yyyy-MM-dd"),
    endDate: format(today, "yyyy-MM-dd"),
  };
}
