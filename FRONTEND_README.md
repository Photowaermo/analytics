# Analytics Dashboard - Frontend Handover

## Project Overview
**Goal:** Build a premium, high-performance analytics dashboard (`analytics.photowaermo.de`) for a solar lead generation business.
**Users:** Marketing team & Management.
**Key Focus:** Visualization of Leads, Sales, ROAS, and Funnel Drop-offs to optimize ad spend.

## Tech Stack Requirements
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** TailwindCSS (v4 preferred) + ShadcnUI (for premium look)
- **Charts:** Recharts (or similar robust library)
- **Icons:** Lucide React

## Data & API
**Base URL:** `https://leads.photowaermo.de/analytics` (or internal `http://ingestor:8000/analytics`)

### 1. Overview Stats
**Endpoint:** `GET /overview?start_date=2025-12-01&end_date=2025-12-31`
**Response:**
```json
{
  "total_leads": 138,
  "total_sales": 5,
  "total_revenue": 150000.0,
  "total_spend": 6962.36,
  "cpl": 50.45,       // Cost Per Lead
  "cps": 1392.47,     // Cost Per Sale
  "roas": 21.54,      // Return on Ad Spend
  "conversion_rate": 3.62 // %
}
```

### 2. Funnel Analysis
**Endpoint:** `GET /funnel?start_date=...&end_date=...`
**Response:** list of steps
```json
[
  { "step_name": "Page View", "count": 5000, "dropoff_rate": 0 },
  { "step_name": "Form Started", "count": 2500, "dropoff_rate": 50.0 },
  { "step_name": "Lead Submitted", "count": 138, "dropoff_rate": 94.5 },
  { "step_name": "Sale", "count": 5, "dropoff_rate": 96.4 }
]
```

### 3. Attribution / Performance Table
**Endpoint:** `GET /attribution?start_date=...&end_date=...&level={campaign|adset|ad}`
**Response:** list of performance objects
```json
[
  {
    "name": "Solar_Promo_2025",
    "leads": 45,
    "sales": 2,
    "revenue": 60000.0,
    "spend": 1200.50,
    "roas": 49.98,
    "cpl": 26.68
  },
  ...
]
```

### 4. Single Lead Journey
**Endpoint:** `GET /journeys/{lead_id}`
**Response:**
```json
{
  "lead": { "id": "...", "email": "...", "utm_source": "..." },
  "timeline": [
    { "timestamp": "2025-12-01T10:00:00", "type": "page_view", "details": "/" },
    { "timestamp": "2025-12-01T10:05:00", "type": "lead_submission", "details": "Source: website" },
    { "timestamp": "2025-12-15T14:30:00", "type": "sale_won", "details": "Value: 30000" }
  ]
}
```

## UI / UX Requirements & Sitemap

### 1️⃣ Overview (`/`)
*   **Filters:** Date Range (Today/Yesterday/7d/30d/Custom), Channel.
*   **KPI Cards:** Total Leads, Total Sales, Revenue, Total Spend, CPL, CPS, ROAS.
*   **Charts:** 
    *   Trendchart: Leads vs. Sales per Day.
    *   Leads by Channel (Pie/Bar).
    *   Leads by Campaign/AdSet (Bar).
*   **Tables:** Top Landing Pages Performance.

### 2️⃣ Funnel (`/funnel`)
*   **Website Funnel (Top-Down):** Page View → Scroll → CTA Click → Form Started → Form Submitted.
*   **Business Funnel:** Lead Submitted (Server) → Sale / Appointment.
*   **Visuals:** Horizontal Bar Funnel with Drop-off % between steps.
*   **Breakdowns:** Toggle to view Funnel by Channel / Campaign / AdSet.

### 3️⃣ Journeys (`/journeys`)
*   **Goal:** Single User Timeline for debugging & attribution.
*   **List View:** Recent Leads Table (Name, Email, Source, Status, Date).
*   **Detail View (Modal/Page):** 
    *   **Vertical Timeline:** Page View → CTA Click → Form Steps (1-9) → Submitted → Won.
    *   **Session Info:** UTMs, fbclid, Device/Browser.
    *   **Fallback Attribution:** Show what data is missing vs present.

### 4️⃣ Attribution (`/attribution`)
*   **Sub-Tabs:** Campaigns | Ad Sets | Ads / Creatives.
*   **Metrics:** Spend, Leads, Sales, CPL, CPS, ROAS.
*   **Ad/Creative Special:** 
    *   **Gallery Mode:** Show Ad Thumbnail/Video alongside performance metrics.
    *   **Visuals:** "Winner" badges for high ROAS creatives.

### 5️⃣ Provider Performance (`/providers`)
*   **Filters:** Provider (Wattfox, Interleads, EZA, etc), Date.
*   **KPIs:** Leads, Sales, CPL (Fixed prices e.g. Wattfox €76.16), CPS, Conversion Rate, Duplicate Rate.
*   **Visuals:** 
    *   Comparison Chart (Bar): CPL vs Provider.
    *   Time-to-Sale Trend.

### 6️⃣ Costs & ROAS (`/costs`)
*   **Data Sources:** Meta Spend (API) + Provider Costs (Calculated).
*   **KPIs:** Total Marketing Budget, Total Revenue, Profit, Overall ROAS, CAC.
*   **Breakdown:** ROAS per Provider/Channel.

### 7️⃣ Health (`/health`)
*   **CAPI Monitoring:**
    *   Events Sent vs Leads in DB.
    *   Match Quality (estimate based on missing keys).
    *   Missing Param Rates: % missing fbclid / utm.
*   **System Health:** Ingestor Status, Cron Job Success/Fail logs.

### 8️⃣ Settings (`/settings`)
*   **Provider Prices:** Input fields to update cost-per-lead for Wattfox, Interleads, etc.
*   **Mappings:** UTM -> Channel rules.
*   **Credentials:** Input for Meta Token / Ad Account ID.

## Authentication & Security
*   **Method:** Basic Auth (Username/Password) configured at the Docker/Caddy level.
*   **Implementation:** The frontend does *not* need to handle login logic. It will be behind a global protection layer.
*   **Public Access:** The API is public (`https://leads.photowaermo.de`), so the frontend code will fetch data directly.

## Updated API Endpoints
Base URL: `https://leads.photowaermo.de/analytics`

### 1. `GET /overview`
**Params:** `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD)
**Response:**
```json
{
  "total_leads": 120,
  "total_sales": 5,
  "total_revenue": 15000.0,
  "total_spend": 3200.50,
  "profit": 11799.50,
  "margin": 78.66,
  "cpl": 26.67,
  "cps": 640.10,
  "roas": 4.69,
  "conversion_rate": 4.17,
  "trends": [
      { "date": "2023-10-01", "leads": 12, "sales": 1 },
      { "date": "2023-10-02", "leads": 8,  "sales": 0 }
  ]
}
```

### 2. `GET /providers` (New!)
**Params:** `start_date`, `end_date`
**Response:**
```json
[
  {
    "provider": "wattfox",
    "leads": 50,
    "sales": 2,
    "cost": 3808.0,
    "cpl": 76.16,
    "roas": 2.5
  },
  { "provider": "interleads", ... }
]
```

### 3. `GET /attribution`
**Params:** `start_date`, `end_date`, `level` (campaign | adset | ad)
**Response:** List of objects (with `creative_thumbnail` for ads).

### 4. `GET /funnel`
**Params:** `start_date`, `end_date`
**Response:** List of steps with drop-off rates.

### 5. `GET /settings` & `POST /settings` (New!)
**Use:** Manage Provider Prices dynamically.
**Response:**
```json
{
  "provider_prices": {
    "wattfox": 76.16,
    "interleads": 82.11
  }
}
```

### 6. `GET /health` (New!)
**Use:** System Status check.
**Response:** `{ "status": "healthy", "db": "connected" }`

### 7. `GET /journeys/` (List)
**Params:** `limit` (default 50), `offset` (default 0)
**Response:** List of leads (for Table View).
```json
[
  { "id": "uuid...", "email": "...", "source_name": "meta", "crm_status": "new", "created_at": "..." }
]
```

### 8. `GET /journeys/{lead_id}` (Detail)
**Response:** Lead details + Timeline events.

## Design Guidelines
- **Premium Feel:** Glassmorphism card backgrounds.
- **Interactive:** Hover effects on charts (Recharts Tooltips).
- **Responsive:** Mobile-friendly key views.
- **Colors (Company Brand):**
    *   **Background / Surface:** `#F3F5F1`
    *   **Primary / Highlight:** `#A1BF4F`
    *   **Secondary:** `#7BCDA5`
    *   **Accent / Dark:** `#3A9E90`
- **Responsive:** Mobile-friendly key views.
