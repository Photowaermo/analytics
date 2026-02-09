"use client";

import { QueryProvider } from "@/lib/query-provider";
import { DateProvider } from "@/lib/date-context";
import { ModeProvider } from "@/lib/mode-context";
import { PlatformProvider } from "@/lib/platform-context";
import { ProductProvider } from "@/lib/product-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <DateProvider>
        <ModeProvider>
          <PlatformProvider>
            <ProductProvider>{children}</ProductProvider>
          </PlatformProvider>
        </ModeProvider>
      </DateProvider>
    </QueryProvider>
  );
}
