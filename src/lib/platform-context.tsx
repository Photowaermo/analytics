"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export type AdPlatform = "meta" | "google" | "tiktok" | "linkedin" | "pinterest" | "twitter";

export const ALL_PLATFORMS: AdPlatform[] = ["meta", "google", "tiktok", "linkedin", "pinterest", "twitter"];

export const platformConfig: Record<AdPlatform, { label: string; color: string }> = {
  meta: { label: "Meta", color: "bg-blue-500" },
  google: { label: "Google Ads", color: "bg-red-500" },
  tiktok: { label: "TikTok", color: "bg-black" },
  linkedin: { label: "LinkedIn", color: "bg-blue-700" },
  pinterest: { label: "Pinterest", color: "bg-red-600" },
  twitter: { label: "Twitter/X", color: "bg-gray-800" },
};

interface PlatformContextType {
  selectedPlatforms: AdPlatform[];
  setSelectedPlatforms: (platforms: AdPlatform[]) => void;
  togglePlatform: (platform: AdPlatform) => void;
  selectAll: () => void;
  // For API calls - returns undefined if all selected (no filter), or comma-separated string
  platformParam: string | undefined;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Parse platforms from URL on client side
  const getInitialPlatforms = (): AdPlatform[] => {
    if (typeof window === "undefined") return ALL_PLATFORMS;
    const params = new URLSearchParams(window.location.search);
    const param = params.get("platforms");
    if (param) {
      const platforms = param.split(",").filter((p): p is AdPlatform =>
        ALL_PLATFORMS.includes(p as AdPlatform)
      );
      return platforms.length > 0 ? platforms : ALL_PLATFORMS;
    }
    return ALL_PLATFORMS;
  };

  const [selectedPlatforms, setSelectedPlatformsState] = useState<AdPlatform[]>(getInitialPlatforms);

  // Update URL when platforms change
  const setSelectedPlatforms = useCallback((platforms: AdPlatform[]) => {
    setSelectedPlatformsState(platforms);

    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    // If all platforms selected, remove the param (default behavior)
    if (platforms.length === ALL_PLATFORMS.length || platforms.length === 0) {
      params.delete("platforms");
    } else {
      params.set("platforms", platforms.join(","));
    }

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [pathname, router]);

  const togglePlatform = useCallback((platform: AdPlatform) => {
    setSelectedPlatformsState(current => {
      if (current.includes(platform)) {
        // Allow deselecting all platforms
        const newPlatforms = current.filter(p => p !== platform);
        // Update URL
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (newPlatforms.length === 0) {
            params.delete("platforms");
          } else {
            params.set("platforms", newPlatforms.join(","));
          }
          const queryString = params.toString();
          router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
        }
        return newPlatforms;
      } else {
        const newPlatforms = [...current, platform];
        // Update URL
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (newPlatforms.length === ALL_PLATFORMS.length) {
            params.delete("platforms");
          } else {
            params.set("platforms", newPlatforms.join(","));
          }
          const queryString = params.toString();
          router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
        }
        return newPlatforms;
      }
    });
  }, [pathname, router]);

  const selectAll = useCallback(() => {
    const allSelected = selectedPlatforms.length === ALL_PLATFORMS.length;
    const newPlatforms = allSelected ? [] : ALL_PLATFORMS;
    setSelectedPlatformsState(newPlatforms);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (newPlatforms.length === 0 || newPlatforms.length === ALL_PLATFORMS.length) {
        params.delete("platforms");
      } else {
        params.set("platforms", newPlatforms.join(","));
      }
      const queryString = params.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    }
  }, [pathname, router, selectedPlatforms.length]);

  // For API: if all selected, return undefined (no filter)
  // If none selected, return "__none__" to filter to nothing
  // Otherwise return the selected platforms
  const platformParam = selectedPlatforms.length === ALL_PLATFORMS.length
    ? undefined
    : selectedPlatforms.length === 0
      ? "__none__"
      : selectedPlatforms.join(",");

  return (
    <PlatformContext.Provider value={{
      selectedPlatforms,
      setSelectedPlatforms,
      togglePlatform,
      selectAll,
      platformParam
    }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
}
