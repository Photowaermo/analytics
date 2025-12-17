// API Types
export interface TrendPoint {
  date: string;
  leads: number;
  sales: number;
}

export interface OverviewStats {
  total_leads: number;
  total_sales: number;
  total_revenue: number;
  total_spend: number;
  profit: number;
  margin: number;
  cpl: number;
  cps: number;
  roas: number;
  conversion_rate: number;
  trends: TrendPoint[];
}

export interface FunnelStep {
  step_name: string;
  count: number;
  dropoff_rate: number;
}

export interface Attribution {
  name: string;
  leads: number;
  sales: number;
  revenue: number;
  spend: number;
  roas: number;
  cpl: number;
  impressions: number;
  clicks: number;
  creative_thumbnail?: string;
  created_date?: string;
  campaign_name?: string;
  adset_name?: string;
}

export interface Provider {
  provider: string;
  leads: number;
  sales: number;
  cost: number;
  cpl: number;
  roas: number;
}

export interface Lead {
  id: string;
  email: string;
  source_name: string;
  submission_type: string;
  crm_status: string;
  created_at: string;
  campaign_name?: string;
  adset_name?: string;
  ad_name?: string;
}

export interface TimelineEvent {
  timestamp: string;
  type: string;
  details: string;
}

export interface LeadJourney {
  lead: {
    id: string;
    email: string;
    utm_source: string;
  };
  timeline: TimelineEvent[];
}

export interface Settings {
  provider_prices: Record<string, number>;
  active_ad_platforms?: Record<string, boolean>;
}

export interface HealthStatus {
  status: string;
  db: string;
}

export interface UnmatchedEvent {
  id: string;
  created_at: string;
  pulse_id: string;
  board_id: number;
  email_extracted: string;
  reason: string;
  payload: Record<string, unknown>;
}

// API Client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://leads.photowaermo.de/analytics";

// Helper to append platform params (handles comma-separated values)
function appendPlatformParams(params: URLSearchParams, platform?: string) {
  if (platform) {
    // Split comma-separated platforms and append each as separate param
    platform.split(",").forEach(p => params.append("platform", p.trim()));
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// API Functions
export async function getOverview(startDate: string, endDate: string, provider?: string, platform?: string): Promise<OverviewStats> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  if (provider) {
    params.append("provider", provider);
  }
  appendPlatformParams(params, platform);
  return fetchAPI(`/overview?${params.toString()}`);
}

export async function getFunnel(startDate: string, endDate: string, provider?: string, platform?: string): Promise<FunnelStep[]> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  if (provider) {
    params.append("provider", provider);
  }
  appendPlatformParams(params, platform);
  return fetchAPI(`/funnel?${params.toString()}`);
}

export async function getAttribution(
  startDate: string,
  endDate: string,
  level: "campaign" | "adset" | "ad",
  campaign?: string,
  adset?: string,
  platform?: string
): Promise<Attribution[]> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    level: level,
  });
  if (campaign) {
    params.append("campaign", campaign);
  }
  if (adset) {
    params.append("adset", adset);
  }
  appendPlatformParams(params, platform);
  return fetchAPI(`/attribution?${params.toString()}`);
}

export async function getProviders(startDate: string, endDate: string, platform?: string): Promise<Provider[]> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  appendPlatformParams(params, platform);
  return fetchAPI(`/providers?${params.toString()}`);
}

export async function getJourneys(limit = 50, offset = 0, provider?: string, platform?: string, startDate?: string, endDate?: string): Promise<Lead[]> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (provider) params.append("provider", provider);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  appendPlatformParams(params, platform);
  return fetchAPI(`/journeys/?${params.toString()}`);
}

export async function getJourneyDetail(leadId: string): Promise<LeadJourney> {
  return fetchAPI(`/journeys/${leadId}`);
}

export async function getSettings(): Promise<Settings> {
  return fetchAPI("/settings");
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  return fetchAPI("/settings", {
    method: "POST",
    body: JSON.stringify(settings),
  });
}

export async function getHealth(): Promise<HealthStatus> {
  return fetchAPI("/health");
}

export async function getUnmatched(limit = 100): Promise<UnmatchedEvent[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  return fetchAPI(`/unmatched?${params.toString()}`);
}
