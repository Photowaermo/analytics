"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOverview,
  getFunnel,
  getAttribution,
  getProviders,
  getJourneys,
  getJourneyDetail,
  getSettings,
  updateSettings,
  getHealth,
  type Settings,
} from "./api";

// Query Keys
export const queryKeys = {
  overview: (startDate: string, endDate: string, provider?: string) => ["overview", startDate, endDate, provider] as const,
  funnel: (startDate: string, endDate: string, provider?: string) => ["funnel", startDate, endDate, provider] as const,
  attribution: (startDate: string, endDate: string, level: string, campaign?: string, adset?: string) =>
    ["attribution", startDate, endDate, level, campaign, adset] as const,
  providers: (startDate: string, endDate: string) => ["providers", startDate, endDate] as const,
  journeys: (limit: number, offset: number, provider?: string) => ["journeys", limit, offset, provider] as const,
  journeyDetail: (id: string) => ["journey", id] as const,
  settings: ["settings"] as const,
  health: ["health"] as const,
};

// Hooks
export function useOverview(startDate: string, endDate: string, provider?: string) {
  return useQuery({
    queryKey: queryKeys.overview(startDate, endDate, provider),
    queryFn: () => getOverview(startDate, endDate, provider),
  });
}

export function useFunnel(startDate: string, endDate: string, provider?: string) {
  return useQuery({
    queryKey: queryKeys.funnel(startDate, endDate, provider),
    queryFn: () => getFunnel(startDate, endDate, provider),
  });
}

export function useAttribution(
  startDate: string,
  endDate: string,
  level: "campaign" | "adset" | "ad",
  campaign?: string,
  adset?: string
) {
  return useQuery({
    queryKey: queryKeys.attribution(startDate, endDate, level, campaign, adset),
    queryFn: () => getAttribution(startDate, endDate, level, campaign, adset),
  });
}

export function useProviders(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.providers(startDate, endDate),
    queryFn: () => getProviders(startDate, endDate),
  });
}

export function useJourneys(limit = 50, offset = 0, provider?: string) {
  return useQuery({
    queryKey: queryKeys.journeys(limit, offset, provider),
    queryFn: () => getJourneys(limit, offset, provider),
  });
}

export function useJourneyDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.journeyDetail(id),
    queryFn: () => getJourneyDetail(id),
    enabled: !!id,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: getSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Settings) => updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
