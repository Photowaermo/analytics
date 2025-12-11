"use client";

import { QueryProvider } from "@/lib/query-provider";
import { DateProvider } from "@/lib/date-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <DateProvider>{children}</DateProvider>
    </QueryProvider>
  );
}
