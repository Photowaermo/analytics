"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  setPreset: (preset: DatePreset) => void;
}

export type DatePreset = "today" | "yesterday" | "7d" | "30d" | "all" | "custom";

// Gespeicherter Zeitraum verfällt nach dieser Zeit → Default (30 Tage) greift wieder.
const TTL_MS = 10 * 60 * 1000; // 10 Minuten

const DateContext = createContext<DateContextType | undefined>(undefined);

function getPresetDates(preset: DatePreset): DateRange {
  const today = new Date();
  const formatStr = "yyyy-MM-dd";

  switch (preset) {
    case "today":
      return {
        startDate: format(startOfDay(today), formatStr),
        endDate: format(endOfDay(today), formatStr),
      };
    case "yesterday": {
      const yesterday = subDays(today, 1);
      return {
        startDate: format(startOfDay(yesterday), formatStr),
        endDate: format(endOfDay(yesterday), formatStr),
      };
    }
    case "7d":
      return {
        startDate: format(subDays(today, 7), formatStr),
        endDate: format(today, formatStr),
      };
    case "all":
      return {
        startDate: "2024-01-01",
        endDate: format(today, formatStr),
      };
    case "30d":
    default:
      return {
        startDate: format(subDays(today, 30), formatStr),
        endDate: format(today, formatStr),
      };
  }
}

export function DateProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRangeState] = useState<DateRange>(() => getPresetDates("30d"));
  const [, setActivePreset] = useState<DatePreset>("30d");

  // Restore from localStorage after hydration — nur wenn nicht abgelaufen (10 Min TTL).
  useEffect(() => {
    const ts = parseInt(localStorage.getItem("date-saved-at") || "0", 10);
    const fresh = ts > 0 && Date.now() - ts <= TTL_MS;
    if (!fresh) {
      // Abgelaufen → gespeicherten Filter verwerfen, Default (30d) bleibt aktiv.
      localStorage.removeItem("date-range");
      localStorage.removeItem("date-preset");
      localStorage.removeItem("date-saved-at");
      return;
    }
    const storedRange = localStorage.getItem("date-range");
    if (storedRange) {
      try {
        const parsed = JSON.parse(storedRange);
        if (parsed.startDate && parsed.endDate) setDateRangeState(parsed);
      } catch { /* ignore */ }
    }
    const storedPreset = localStorage.getItem("date-preset");
    if (storedPreset && ["today", "yesterday", "7d", "30d", "all", "custom"].includes(storedPreset)) {
      setActivePreset(storedPreset as DatePreset);
    }
  }, []);

  const persist = (range: DateRange, preset: DatePreset) => {
    localStorage.setItem("date-range", JSON.stringify(range));
    localStorage.setItem("date-preset", preset);
    localStorage.setItem("date-saved-at", String(Date.now()));
  };

  const setDateRange = (range: DateRange) => {
    persist(range, "custom");
    setDateRangeState(range);
    setActivePreset("custom");
  };

  const setPreset = (preset: DatePreset) => {
    if (preset !== "custom") {
      const range = getPresetDates(preset);
      persist(range, preset);
      setDateRangeState(range);
      setActivePreset(preset);
    }
  };

  return (
    <DateContext.Provider value={{ dateRange, setDateRange, setPreset }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error("useDateRange must be used within DateProvider");
  }
  return context;
}
