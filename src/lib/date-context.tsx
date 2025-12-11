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

export type DatePreset = "today" | "yesterday" | "7d" | "30d" | "custom";

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
    case "30d":
    default:
      return {
        startDate: format(subDays(today, 30), formatStr),
        endDate: format(today, formatStr),
      };
  }
}

export function DateProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(getPresetDates("30d"));

  const setPreset = (preset: DatePreset) => {
    if (preset !== "custom") {
      setDateRange(getPresetDates(preset));
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
