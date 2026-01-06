# Analytics Dashboard

Premium analytics dashboard for solar lead generation business at `analytics.photowaermo.de`.

## Tech Stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** TailwindCSS v4 + ShadcnUI
- **Charts:** Recharts
- **Icons:** Lucide React
- **State:** TanStack Query (React Query)

## Architecture

### Mode-Based Routing
The dashboard uses mode-based routing with four lead source categories:

| Mode | Route | Description |
|------|-------|-------------|
| Alle | `/all` | All leads across all sources |
| Werbeanzeigen | `/ads` | Ad-generated leads (Meta, Google, TikTok, etc.) |
| Gekaufte Leads | `/purchased` | Purchased leads (BildLeads, Wattfox, EZA, etc.) |
| Organisch | `/organic` | Organic website leads |

### Pages by Mode

```
/all
├── /all              → Overview (all sources)
├── /all/leads        → Newest leads list
└── /all/unmatched    → Lost signals (unmatched CRM events)

/ads
├── /ads              → Overview (ad performance)
├── /ads/funnel       → Website funnel analysis
├── /ads/journeys     → Lead journey timeline
├── /ads/attribution  → Campaign/AdSet/Ad performance
└── /ads/costs        → Costs & ROAS analysis

/purchased
└── /purchased        → Overview (provider comparison)

/organic
├── /organic          → Overview
├── /organic/funnel   → Website funnel
└── /organic/journeys → Lead journeys
```

### Shared Pages
```
/health     → System status
/settings   → Provider prices & platform settings
```

## Features

### Platform Filtering (Ads Mode Only)
Multi-select dropdown to filter by ad platform:
- Meta (Facebook/Instagram)
- Google
- TikTok
- LinkedIn
- Pinterest
- Twitter/X

Selection persists in URL: `?platforms=meta,google`

### Date Range Filter
Global date picker affecting all data queries:
- Preset ranges: Today, Yesterday, 7 Days, 30 Days, This Month, Last Month
- Custom date range picker

## API Endpoints

**Base URL:** `https://leads.photowaermo.de/analytics`

### Overview Stats
```
GET /overview?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&provider={ads|purchased|organic}&platform={meta,google,...}
```
Response:
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
    { "date": "2025-12-01", "leads": 12, "sales": 1 },
    { "date": "2025-12-02", "leads": 8, "sales": 0 }
  ]
}
```

### Funnel Analysis
```
GET /funnel?start_date=...&end_date=...&provider=...&platform=...
```
Response:
```json
[
  { "step_name": "Page View", "count": 5000, "dropoff_rate": 0 },
  { "step_name": "Form Started", "count": 2500, "dropoff_rate": 50.0 },
  { "step_name": "Lead Submitted", "count": 138, "dropoff_rate": 94.5 },
  { "step_name": "Sale", "count": 5, "dropoff_rate": 96.4 }
]
```

### Attribution
```
GET /attribution?start_date=...&end_date=...&level={campaign|adset|ad}&campaign=...&adset=...&platform=...
```
Response:
```json
[
  {
    "name": "Solar_Promo_2025",
    "leads": 45,
    "sales": 2,
    "revenue": 60000.0,
    "spend": 1200.50,
    "roas": 49.98,
    "cpl": 26.68,
    "impressions": 50000,
    "clicks": 1200,
    "creative_thumbnail": "https://...",
    "campaign_name": "...",
    "adset_name": "..."
  }
]
```

### Providers
```
GET /providers?start_date=...&end_date=...&platform=...
```
Response:
```json
[
  {
    "provider": "metaleads",
    "leads": 50,
    "sales": 2,
    "cost": 3808.0,
    "cpl": 76.16,
    "roas": 2.5
  }
]
```

### Journeys (List)
```
GET /journeys/?limit=100&offset=0&provider={ads|purchased|organic}&platform=...&start_date=...&end_date=...
```
Response:
```json
[
  {
    "id": "uuid...",
    "email": "user@example.com",
    "source_name": "metaleads",
    "submission_type": "lead_form",
    "crm_status": "new",
    "created_at": "2025-12-17T10:00:00Z",
    "campaign_name": "...",
    "adset_name": "...",
    "ad_name": "..."
  }
]
```

### Journey Detail
```
GET /journeys/{lead_id}
```
Response:
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

### Unmatched CRM Events
```
GET /unmatched?limit=100
```
Response:
```json
[
  {
    "id": "uuid...",
    "created_at": "2025-12-17T12:00:00Z",
    "pulse_id": "12345",
    "board_id": 987654,
    "email_extracted": "foo@bar.com",
    "reason": "lead_not_found",
    "payload": { ... }
  }
]
```

### Settings
```
GET /settings
POST /settings
```
Response/Body:
```json
{
  "provider_prices": {
    "wattfox": 76.16,
    "interleads": 82.11,
    "bildleads": 65.00,
    "eza": 70.00
  },
  "active_ad_platforms": {
    "meta": true,
    "google": true,
    "tiktok": false,
    "linkedin": false,
    "pinterest": false,
    "twitter": false
  }
}
```

### Health
```
GET /health
```
Response:
```json
{ "status": "healthy", "db": "connected" }
```

## Project Structure

```
src/
├── app/
│   ├── [mode]/
│   │   ├── page.tsx           # Overview (mode-specific)
│   │   ├── funnel/page.tsx
│   │   ├── journeys/page.tsx
│   │   ├── attribution/page.tsx
│   │   ├── costs/page.tsx
│   │   ├── leads/page.tsx
│   │   └── unmatched/page.tsx
│   ├── health/page.tsx
│   ├── settings/page.tsx
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── charts/
│   │   ├── trend-chart.tsx
│   │   ├── bar-chart.tsx
│   │   ├── pie-chart.tsx
│   │   └── funnel-chart.tsx
│   └── ui/                    # ShadcnUI components
├── lib/
│   ├── api.ts                 # API client & types
│   ├── queries.ts             # TanStack Query hooks
│   ├── mode-context.tsx       # Mode state & routing
│   ├── platform-context.tsx   # Platform filter state
│   ├── date-context.tsx       # Date range state
│   └── utils.ts               # Formatting utilities
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://leads.photowaermo.de/analytics
```

## Design System

### Colors (Brand)
- **Background:** `#F3F5F1`
- **Primary:** `#A1BF4F`
- **Secondary:** `#7BCDA5`
- **Accent:** `#3A9E90`

### UI Patterns
- Glassmorphism card backgrounds
- Interactive chart tooltips
- Responsive mobile-first design
- German language UI
