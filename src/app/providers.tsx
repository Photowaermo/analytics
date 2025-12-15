"use client";

import { QueryProvider } from "@/lib/query-provider";
import { DateProvider } from "@/lib/date-context";
import { ModeProvider } from "@/lib/mode-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <DateProvider>
        <ModeProvider>{children}</ModeProvider>
      </DateProvider>
    </QueryProvider>
  );
}
