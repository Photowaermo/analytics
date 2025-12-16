"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AnalyticsMode = "all" | "ads" | "purchased" | "organic";

interface ModeContextType {
  mode: AnalyticsMode;
  setMode: (mode: AnalyticsMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const STORAGE_KEY = "analytics-mode";
const validModes: AnalyticsMode[] = ["all", "ads", "purchased", "organic"];

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AnalyticsMode>("all");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && validModes.includes(saved as AnalyticsMode)) {
      setModeState(saved as AnalyticsMode);
    }
    setIsLoaded(true);
  }, []);

  // Save mode to localStorage when it changes
  const setMode = (newMode: AnalyticsMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  // Don't render children until we've loaded the mode from localStorage
  if (!isLoaded) {
    return null;
  }

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
  all: {
    label: "Alle",
    description: "Alle Lead-Quellen",
    providers: [],
  },
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
