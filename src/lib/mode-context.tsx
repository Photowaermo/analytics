"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type AnalyticsMode = "ads" | "purchased" | "organic";

interface ModeContextType {
  mode: AnalyticsMode;
  setMode: (mode: AnalyticsMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AnalyticsMode>("ads");

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}

// Mode configuration
export const modeConfig: Record<AnalyticsMode, {
  label: string;
  description: string;
  providers: string[];
}> = {
  ads: {
    label: "Werbeanzeigen",
    description: "Meta, Google, TikTok Ads",
    providers: ["metaleads"],
  },
  purchased: {
    label: "Gekaufte Leads",
    description: "BildLeads, Wattfox, etc.",
    providers: ["bildleads", "wattfox", "eza", "interleads"],
  },
  organic: {
    label: "Organisch",
    description: "Website & Direct Traffic",
    providers: ["website"],
  },
};
