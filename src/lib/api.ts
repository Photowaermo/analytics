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
  creative_thumbnail?: string;
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
  crm_status: string;
  created_at: string;
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
}

export interface HealthStatus {
  status: string;
  db: string;
}

// API Client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://leads.photowaermo.de/analytics";

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
export async function getOverview(startDate: string, endDate: string): Promise<OverviewStats> {
  return fetchAPI(`/overview?start_date=${startDate}&end_date=${endDate}`);
}

export async function getFunnel(startDate: string, endDate: string): Promise<FunnelStep[]> {
  return fetchAPI(`/funnel?start_date=${startDate}&end_date=${endDate}`);
}

export async function getAttribution(
  startDate: string,
  endDate: string,
  level: "campaign" | "adset" | "ad"
): Promise<Attribution[]> {
  return fetchAPI(`/attribution?start_date=${startDate}&end_date=${endDate}&level=${level}`);
}

export async function getProviders(startDate: string, endDate: string): Promise<Provider[]> {
  return fetchAPI(`/providers?start_date=${startDate}&end_date=${endDate}`);
}

export async function getJourneys(limit = 50, offset = 0): Promise<Lead[]> {
  return fetchAPI(`/journeys/?limit=${limit}&offset=${offset}`);
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
