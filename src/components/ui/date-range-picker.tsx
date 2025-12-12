"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useDateRange, type DatePreset } from "@/lib/date-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const presets: { label: string; value: DatePreset }[] = [
  { label: "Heute", value: "today" },
  { label: "Gestern", value: "yesterday" },
  { label: "Letzte 7 Tage", value: "7d" },
  { label: "Letzte 30 Tage", value: "30d" },
];

export function DateRangePicker() {
  const { dateRange, setDateRange, setPreset } = useDateRange();
  const [activePreset, setActivePreset] = useState<DatePreset>("30d");
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (preset: DatePreset) => {
    setActivePreset(preset);
    setPreset(preset);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    return `${format(start, "d. MMM", { locale: de })} - ${format(end, "d. MMM yyyy", { locale: de })}`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        <span>{formatDateRange()}</span>
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetClick(preset.value)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  activePreset === preset.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {preset.label}
              </button>
            ))}
            <hr className="my-2 border-gray-200" />
            <div className="px-3 py-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Startdatum</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => {
                  setActivePreset("custom");
                  setDateRange({ ...dateRange, startDate: e.target.value });
                }}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
              />
            </div>
            <div className="px-3 py-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Enddatum</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => {
                  setActivePreset("custom");
                  setDateRange({ ...dateRange, endDate: e.target.value });
                }}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
