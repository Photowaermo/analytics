"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOverview,
  getFunnel,
  getAttribution,
  getProviders,
  getJourneys,
  getJourneyDetail,
  getLeadRaw,
  getSettings,
  updateSettings,
  getHealth,
  getUnmatched,
  getSellers,
  getSellerLeads,
  type Settings,
} from "./api";

// Query Keys
export const queryKeys = {
  overview: (startDate: string, endDate: string, provider?: string, platform?: string, product?: string) =>
    ["overview", startDate, endDate, provider, platform, product] as const,
  funnel: (startDate: string, endDate: string, provider?: string, platform?: string, product?: string) =>
    ["funnel", startDate, endDate, provider, platform, product] as const,
  attribution: (startDate: string, endDate: string, level: string, campaign?: string, adset?: string, platform?: string, product?: string) =>
    ["attribution", startDate, endDate, level, campaign, adset, platform, product] as const,
  providers: (startDate: string, endDate: string, platform?: string, product?: string) =>
    ["providers", startDate, endDate, platform, product] as const,
  journeys: (limit: number, offset: number, provider?: string, platform?: string, startDate?: string, endDate?: string, product?: string) =>
    ["journeys", limit, offset, provider, platform, startDate, endDate, product] as const,
  journeyDetail: (id: string) => ["journey", id] as const,
  leadRaw: (id: string) => ["leadRaw", id] as const,
  settings: ["settings"] as const,
  health: ["health"] as const,
  unmatched: (limit: number) => ["unmatched", limit] as const,
  sellers: (startDate: string, endDate: string) =>
    ["sellers", startDate, endDate] as const,
  sellerLeads: (email: string, startDate: string, endDate: string) =>
    ["sellerLeads", email, startDate, endDate] as const,
};

// Hooks
export function useOverview(startDate: string, endDate: string, provider?: string, platform?: string, product?: string) {
  return useQuery({
    queryKey: queryKeys.overview(startDate, endDate, provider, platform, product),
    queryFn: () => getOverview(startDate, endDate, provider, platform, product),
  });
}

export function useFunnel(startDate: string, endDate: string, provider?: string, platform?: string, product?: string) {
  return useQuery({
    queryKey: queryKeys.funnel(startDate, endDate, provider, platform, product),
    queryFn: () => getFunnel(startDate, endDate, provider, platform, product),
  });
}

export function useAttribution(
  startDate: string,
  endDate: string,
  level: "campaign" | "adset" | "ad",
  campaign?: string,
  adset?: string,
  platform?: string,
  product?: string
) {
  return useQuery({
    queryKey: queryKeys.attribution(startDate, endDate, level, campaign, adset, platform, product),
    queryFn: () => getAttribution(startDate, endDate, level, campaign, adset, platform, product),
  });
}

export function useProviders(startDate: string, endDate: string, platform?: string, product?: string) {
  return useQuery({
    queryKey: queryKeys.providers(startDate, endDate, platform, product),
    queryFn: () => getProviders(startDate, endDate, platform, product),
  });
}

export function useJourneys(limit = 50, offset = 0, provider?: string, platform?: string, startDate?: string, endDate?: string, product?: string) {
  return useQuery({
    queryKey: queryKeys.journeys(limit, offset, provider, platform, startDate, endDate, product),
    queryFn: () => getJourneys(limit, offset, provider, platform, startDate, endDate, product),
  });
}

export function useJourneyDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.journeyDetail(id),
    queryFn: () => getJourneyDetail(id),
    enabled: !!id,
  });
}

export function useLeadRaw(id: string) {
  return useQuery({
    queryKey: queryKeys.leadRaw(id),
    queryFn: () => getLeadRaw(id),
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

export function useSellers(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.sellers(startDate, endDate),
    queryFn: () => getSellers(startDate, endDate),
  });
}

export function useSellerLeads(sellerEmail: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.sellerLeads(sellerEmail, startDate, endDate),
    queryFn: () => getSellerLeads(sellerEmail, startDate, endDate),
    enabled: !!sellerEmail,
  });
}
