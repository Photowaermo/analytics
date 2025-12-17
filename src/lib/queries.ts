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
  getUnmatched,
  type Settings,
} from "./api";

// Query Keys
export const queryKeys = {
  overview: (startDate: string, endDate: string, provider?: string, platform?: string) =>
    ["overview", startDate, endDate, provider, platform] as const,
  funnel: (startDate: string, endDate: string, provider?: string, platform?: string) =>
    ["funnel", startDate, endDate, provider, platform] as const,
  attribution: (startDate: string, endDate: string, level: string, campaign?: string, adset?: string, platform?: string) =>
    ["attribution", startDate, endDate, level, campaign, adset, platform] as const,
  providers: (startDate: string, endDate: string, platform?: string) =>
    ["providers", startDate, endDate, platform] as const,
  journeys: (limit: number, offset: number, provider?: string, platform?: string, startDate?: string, endDate?: string) =>
    ["journeys", limit, offset, provider, platform, startDate, endDate] as const,
  journeyDetail: (id: string) => ["journey", id] as const,
  settings: ["settings"] as const,
  health: ["health"] as const,
  unmatched: (limit: number) => ["unmatched", limit] as const,
};

// Hooks
export function useOverview(startDate: string, endDate: string, provider?: string, platform?: string) {
  return useQuery({
    queryKey: queryKeys.overview(startDate, endDate, provider, platform),
    queryFn: () => getOverview(startDate, endDate, provider, platform),
  });
}

export function useFunnel(startDate: string, endDate: string, provider?: string, platform?: string) {
  return useQuery({
    queryKey: queryKeys.funnel(startDate, endDate, provider, platform),
    queryFn: () => getFunnel(startDate, endDate, provider, platform),
  });
}

export function useAttribution(
  startDate: string,
  endDate: string,
  level: "campaign" | "adset" | "ad",
  campaign?: string,
  adset?: string,
  platform?: string
) {
  return useQuery({
    queryKey: queryKeys.attribution(startDate, endDate, level, campaign, adset, platform),
    queryFn: () => getAttribution(startDate, endDate, level, campaign, adset, platform),
  });
}

export function useProviders(startDate: string, endDate: string, platform?: string) {
  return useQuery({
    queryKey: queryKeys.providers(startDate, endDate, platform),
    queryFn: () => getProviders(startDate, endDate, platform),
  });
}

export function useJourneys(limit = 50, offset = 0, provider?: string, platform?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.journeys(limit, offset, provider, platform, startDate, endDate),
    queryFn: () => getJourneys(limit, offset, provider, platform, startDate, endDate),
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

export function useUnmatched(limit = 100) {
  return useQuery({
    queryKey: queryKeys.unmatched(limit),
    queryFn: () => getUnmatched(limit),
  });
}
