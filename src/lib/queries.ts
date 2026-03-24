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
  getStatusHistory,
  getStatusChanges,
  getSettings,
  updateSettings,
  getHealth,
  getUnmatched,
  getSellers,
  getSellerLeads,
  getUncontacted,
  getDuplicates,
  getStaleLeads,
  getResponseTimes,
  getKanbanChanges,
  getKamMismatches,
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
  statusHistory: (id: string) => ["statusHistory", id] as const,
  statusChanges: (startDate: string, endDate: string, limit: number) => ["statusChanges", startDate, endDate, limit] as const,
  settings: ["settings"] as const,
  health: ["health"] as const,
  unmatched: (limit: number) => ["unmatched", limit] as const,
  sellers: (startDate: string, endDate: string) =>
    ["sellers", startDate, endDate] as const,
  sellerLeads: (email: string, startDate: string, endDate: string) =>
    ["sellerLeads", email, startDate, endDate] as const,
  uncontacted: (startDate: string, endDate: string, limit: number, seller?: string) =>
    ["uncontacted", startDate, endDate, limit, seller] as const,
  duplicates: (limit: number) => ["duplicates", limit] as const,
  staleLeads: (seller?: string) => ["staleLeads", seller] as const,
  responseTimes: (startDate: string, endDate: string, seller?: string) =>
    ["responseTimes", startDate, endDate, seller] as const,
  kanbanChanges: (startDate?: string, endDate?: string, seller?: string) =>
    ["kanbanChanges", startDate, endDate, seller] as const,
  kamMismatches: ["kamMismatches"] as const,
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

export function useStatusHistory(leadId: string) {
  return useQuery({
    queryKey: queryKeys.statusHistory(leadId),
    queryFn: () => getStatusHistory(leadId),
    enabled: !!leadId,
  });
}

export function useStatusChanges(startDate: string, endDate: string, limit = 100) {
  return useQuery({
    queryKey: queryKeys.statusChanges(startDate, endDate, limit),
    queryFn: () => getStatusChanges(startDate, endDate, limit),
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

export function useUncontacted(startDate: string, endDate: string, limit = 500, seller?: string) {
  return useQuery({
    queryKey: queryKeys.uncontacted(startDate, endDate, limit, seller),
    queryFn: () => getUncontacted(startDate, endDate, limit, seller),
  });
}

export function useDuplicates(limit = 200) {
  return useQuery({
    queryKey: queryKeys.duplicates(limit),
    queryFn: () => getDuplicates(limit),
  });
}

export function useStaleLeads(seller?: string) {
  return useQuery({
    queryKey: queryKeys.staleLeads(seller),
    queryFn: () => getStaleLeads(seller),
  });
}

export function useResponseTimes(startDate: string, endDate: string, seller?: string) {
  return useQuery({
    queryKey: queryKeys.responseTimes(startDate, endDate, seller),
    queryFn: () => getResponseTimes(startDate, endDate, seller),
  });
}

export function useKanbanChanges(startDate?: string, endDate?: string, seller?: string) {
  return useQuery({
    queryKey: queryKeys.kanbanChanges(startDate, endDate, seller),
    queryFn: () => getKanbanChanges(startDate, endDate, seller),
  });
}

export function useKamMismatches() {
  return useQuery({
    queryKey: queryKeys.kamMismatches,
    queryFn: () => getKamMismatches(),
  });
}

export function useSellerLeads(sellerEmail: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.sellerLeads(sellerEmail, startDate, endDate),
    queryFn: () => getSellerLeads(sellerEmail, startDate, endDate),
    enabled: !!sellerEmail,
  });
}
