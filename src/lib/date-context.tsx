"use client";

import { createContext, useContext, useState, ReactNode } from "react";
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
    case "yesterday":
      const yesterday = subDays(today, 1);
      return {
        startDate: format(startOfDay(yesterday), formatStr),
        endDate: format(endOfDay(yesterday), formatStr),
      };
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

function getInitialDateRange(): DateRange {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("date-range");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.startDate && parsed.endDate) return parsed;
      } catch { /* ignore */ }
    }
  }
  return getPresetDates("30d");
}

function getInitialPreset(): DatePreset {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("date-preset");
    if (stored && ["today", "yesterday", "7d", "30d", "all", "custom"].includes(stored)) {
      return stored as DatePreset;
    }
  }
  return "30d";
}

export function DateProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRangeState] = useState<DateRange>(getInitialDateRange);
  const [, setActivePreset] = useState<DatePreset>(getInitialPreset);

  const setDateRange = (range: DateRange) => {
    localStorage.setItem("date-range", JSON.stringify(range));
    localStorage.setItem("date-preset", "custom");
    setDateRangeState(range);
    setActivePreset("custom");
  };

  const setPreset = (preset: DatePreset) => {
    if (preset !== "custom") {
      const range = getPresetDates(preset);
      localStorage.setItem("date-range", JSON.stringify(range));
      localStorage.setItem("date-preset", preset);
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
