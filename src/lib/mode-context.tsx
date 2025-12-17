"use client";

import { createContext, useContext, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

export type AnalyticsMode = "all" | "ads" | "purchased" | "organic";

interface ModeContextType {
  mode: AnalyticsMode;
  setMode: (mode: AnalyticsMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const validModes: AnalyticsMode[] = ["all", "ads", "purchased", "organic"];

// Pages available per mode
export const pagesByMode: Record<AnalyticsMode, string[]> = {
  all: ["", "leads", "unmatched"],
  ads: ["", "funnel", "journeys", "attribution", "costs"],
  purchased: [""],
  organic: ["", "funnel", "journeys"],
};

interface ModeProviderProps {
  children: ReactNode;
  initialMode?: AnalyticsMode;
}

export function ModeProvider({ children, initialMode }: ModeProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Extract mode from URL if not provided
  const pathParts = pathname.split("/").filter(Boolean);
  const urlMode = pathParts[0] as AnalyticsMode;

  // Use initialMode if provided, otherwise try to extract from URL, fallback to "all"
  const mode: AnalyticsMode = initialMode ??
    (validModes.includes(urlMode) ? urlMode : "all");

  // Extract current page from pathname (e.g., /ads/funnel -> funnel)
  const currentPage = pathParts.length > 1 ? pathParts[1] : "";

  const setMode = (newMode: AnalyticsMode) => {
    // Check if current page is available in new mode
    const validPages = pagesByMode[newMode];
    if (validPages.includes(currentPage)) {
      // Navigate to same page in new mode
      router.push(`/${newMode}${currentPage ? `/${currentPage}` : ""}`);
    } else {
      // Navigate to overview in new mode
      router.push(`/${newMode}`);
    }
  };

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
    providers: [], // Dynamic - built from active platforms
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

// Mapping from platform ID to provider name(s) in the database
export const platformToProviders: Record<string, string[]> = {
  meta: ["metaleads", "meta", "facebook", "instagram"],
  google: ["google", "adwords"],
  tiktok: ["tiktok"],
  linkedin: ["linkedin"],
  pinterest: ["pinterest"],
  twitter: ["twitter", "x"],
};

// Get ad providers based on active platforms from settings
export function getAdProviders(activePlatforms: Record<string, boolean> | undefined): string[] {
  const defaultPlatforms = { meta: true }; // Default if no settings
  const platforms = activePlatforms || defaultPlatforms;

  const providers: string[] = [];
  Object.entries(platforms).forEach(([platform, isActive]) => {
    if (isActive && platformToProviders[platform]) {
      providers.push(...platformToProviders[platform]);
    }
  });

  return providers;
}
