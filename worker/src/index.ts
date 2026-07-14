/**
 * IoT Pulse — Cloudflare Worker
 *
 * Two jobs:
 *  1. Cron (every 5 min): simulates telemetry for every online device,
 *     writes readings to Supabase, and opens alerts when thresholds
 *     are exceeded.
 *  2. POST /ingest: authenticated HTTP endpoint so real devices (or a
 *     script) can push readings directly.
 *
 * Uses the Supabase REST API (PostgREST) with the service_role key —
 * kept server-side as a Worker secret, never exposed to the browser.
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  INGEST_TOKEN: string;
}

type Device = { id: string; status: string };
type ReadingInsert = {
  device_id: string;
  temperature: number;
  vibration: number;
  power: number;
};

const THRESHOLDS = { temperature: 80, vibration: 4.5, power: 1450 } as const;

// ---------- Supabase REST helpers ----------

async function sb(
  env: Env,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...init.headers,
    },
  });
}

async function getOnlineDevices(env: Env): Promise<Device[]> {
  const res = await sb(env, "devices?select=id,status&status=eq.online");
  if (!res.ok) throw new Error(`devices fetch failed: ${res.status}`);
  return res.json();
}

async function insertReadings(env: Env, rows: ReadingInsert[]): Promise<void> {
  const res = await sb(env, "readings", {
    method: "POST",
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`readings insert failed: ${res.status}`);
}

async function raiseAlerts(env: Env, rows: ReadingInsert[]): Promise<number> {
  const alerts = rows.flatMap((r) =>
    (Object.keys(THRESHOLDS) as (keyof typeof THRESHOLDS)[])
      .filter((metric) => r[metric] > THRESHOLDS[metric])
      .map((metric) => ({
        device_id: r.device_id,
        metric,
        value: r[metric],
        threshold: THRESHOLDS[metric],
      }))
  );
  if (alerts.length === 0) return 0;

  const res = await sb(env, "alerts", {
    method: "POST",
    body: JSON.stringify(alerts),
  });
  if (!res.ok) throw new Error(`alerts insert failed: ${res.status}`);
  return alerts.length;
}

// ---------- Telemetry simulation ----------

function simulate(deviceId: string): ReadingInsert {
  // Mostly normal values with an occasional spike so alerts fire.
  const spike = Math.random() < 0.08;
  return {
    device_id: deviceId,
    temperature: round(spike ? 80 + Math.random() * 10 : 55 + Math.random() * 20, 1),
    vibration: round(spike ? 4.5 + Math.random() * 2 : 1 + Math.random() * 3, 2),
    power: round(800 + Math.random() * 650, 0),
  };
}

function round(n: number, d: number): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

async function runSimulation(env: Env): Promise<string> {
  const devices = await getOnlineDevices(env);
  if (devices.length === 0) return "no online devices";

  const rows = devices.map((d) => simulate(d.id));
  await insertReadings(env, rows);
  const alerts = await raiseAlerts(env, rows);
  return `inserted ${rows.length} readings, raised ${alerts} alert(s)`;
}

// ---------- Worker entrypoints ----------

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      runSimulation(env).then((msg) => console.log(`[cron] ${msg}`))
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "iot-pulse-worker" });
    }

    if (url.pathname === "/simulate" && request.method === "POST") {
      // Manual trigger (same auth as /ingest) — handy for demos.
      if (!authorized(request, env)) return unauthorized();
      const msg = await runSimulation(env);
      return Response.json({ ok: true, result: msg });
    }

    if (url.pathname === "/ingest" && request.method === "POST") {
      if (!authorized(request, env)) return unauthorized();

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "invalid JSON" }, { status: 400 });
      }

      const rows = (Array.isArray(body) ? body : [body]) as ReadingInsert[];
      const valid = rows.every(
        (r) =>
          typeof r.device_id === "string" &&
          typeof r.temperature === "number" &&
          typeof r.vibration === "number" &&
          typeof r.power === "number"
      );
      if (!valid) {
        return Response.json(
          { error: "each reading needs device_id, temperature, vibration, power" },
          { status: 400 }
        );
      }

      await insertReadings(env, rows);
      const alerts = await raiseAlerts(env, rows);
      return Response.json({ ok: true, inserted: rows.length, alerts });
    }

    return Response.json({ error: "not found" }, { status: 404 });
  },
};

function authorized(request: Request, env: Env): boolean {
  return request.headers.get("Authorization") === `Bearer ${env.INGEST_TOKEN}`;
}

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
