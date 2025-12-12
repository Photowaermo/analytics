"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 lg:px-6 backdrop-blur-sm">
      {/* Spacer for mobile menu button */}
      <div className="w-10 lg:w-0" />
      <h1 className="text-lg lg:text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
      <DateRangePicker />
    </header>
  );
}
