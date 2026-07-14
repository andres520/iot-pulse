# IoT Pulse

Real-time industrial telemetry dashboard. Built end-to-end with **Claude Code**.

**Live demo:** _add your URL here_

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts |
| Auth + DB | Supabase (Postgres, Auth, Row Level Security) |
| Ingestion | Cloudflare Worker (cron simulation + authenticated `/ingest` API) |
| Hosting | Vercel (app) + Cloudflare (worker) |

## Architecture

```
[Devices / cron simulator]
        │  POST /ingest (Bearer token)
        ▼
Cloudflare Worker ──service_role──▶ Supabase Postgres (readings, alerts)
                                          ▲
                                          │ RLS: authenticated read-only
                                          │
                              Next.js on Vercel (SSR dashboard)
                                          ▲
                                          │ Supabase Auth (email/password)
                                       Browser
```

- The **Worker** owns all writes using the `service_role` key (kept as a Worker secret, never in the browser).
- The **app** reads through the `anon` key + user session; RLS policies allow authenticated users to read telemetry and acknowledge alerts, nothing else.
- A **cron trigger** (every 5 min) simulates fleet telemetry and raises alerts when thresholds are exceeded, so the dashboard is always live.

## Local development

```bash
cp .env.example .env.local   # fill with your Supabase URL + anon key
npm install
npm run dev
```

Run `supabase/schema.sql` in the Supabase SQL Editor first (tables, RLS, seed data).

## Worker

```bash
cd worker
npm install
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put INGEST_TOKEN
npm run deploy
```

Manual test:

```bash
curl -X POST https://<your-worker>.workers.dev/simulate -H "Authorization: Bearer <INGEST_TOKEN>"
```
