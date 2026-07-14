# Explicación del código — IoT Pulse

Léela completa antes de la entrevista: te permite defender cada decisión como tuya.

## Arquitectura en una frase

Un Cloudflare Worker escribe telemetría en Supabase cada 5 minutos (o cuando un dispositivo hace POST a `/ingest`), y un dashboard Next.js en Vercel la lee en tiempo real con sesión de usuario y Row Level Security.

## Decisión clave: quién puede escribir y quién puede leer

Es lo más importante que puedes explicar en la entrevista:

- **Escrituras**: solo el Worker, usando la **service_role key** de Supabase guardada como *secret* de Cloudflare. Esa clave se salta RLS y jamás toca el navegador.
- **Lecturas**: el frontend usa la **anon key** + la sesión del usuario. Las políticas RLS (en `supabase/schema.sql`) solo permiten a usuarios autenticados hacer SELECT, y UPDATE únicamente sobre `alerts.status` (para el botón "Ack").
- Resultado: aunque alguien robe la anon key del navegador, no puede escribir ni leer sin iniciar sesión.

## App Next.js (App Router)

**`middleware.ts`** — Corre en cada request. Refresca la sesión de Supabase (cookies) y redirige: sin sesión → `/login`; con sesión en `/login` → `/dashboard`. Este es el patrón oficial de `@supabase/ssr`.

**`lib/supabase/server.ts` y `client.ts`** — Dos clientes: uno para Server Components (lee cookies del request) y otro para el navegador. Nunca se mezclan.

**`app/dashboard/page.tsx`** — Server Component `async`. Hace 4 queries **en paralelo** con `Promise.all` (devices, últimas 300 lecturas, alertas abiertas, usuario) — detalle de performance que vale mencionar. `export const dynamic = "force-dynamic"` evita caché: cada carga trae datos frescos.

**`app/actions.ts`** — Server Actions (`"use server"`): `acknowledgeAlert` actualiza la alerta y llama `revalidatePath("/dashboard")` para refrescar la UI sin JavaScript extra en el cliente; `signOut` cierra sesión y redirige. Sin API routes: menos código, misma seguridad.

**`app/login/page.tsx`** — Client Component con signin/signup contra Supabase Auth. Tras login: `router.push` + `router.refresh()` para que los Server Components re-rendericen con la nueva sesión.

**`components/`**
- `ReadingsChart.tsx` (client) — Recharts. Agrupa las lecturas por minuto y promedia entre dispositivos; dos ejes Y (temperatura/vibración a la izquierda, potencia a la derecha).
- `StatCards.tsx`, `DevicesTable.tsx`, `AlertsPanel.tsx` (server) — solo reciben props ya cargadas; no hacen fetch. Server Components por defecto = menos JS al navegador.

## Cloudflare Worker (`worker/src/index.ts`)

Dos entrypoints:

1. **`scheduled`** (cron `*/5 * * * *` en `wrangler.toml`): consulta dispositivos online, genera lecturas simuladas (con ~8% de probabilidad de "spike" para que se disparen alertas de vez en cuando), las inserta, y crea alertas si algún valor supera los umbrales (`THRESHOLDS`).
2. **`fetch`** (HTTP):
   - `GET /health` — healthcheck.
   - `POST /ingest` — recibe lecturas reales (JSON, single u array), valida el shape y requiere `Authorization: Bearer INGEST_TOKEN`.
   - `POST /simulate` — dispara la simulación a demanda (útil en demos).

Habla con Supabase vía su **REST API (PostgREST)** con `fetch` puro — sin SDK: el Worker pesa menos y arranca más rápido (importa en edge computing).

## Base de datos (`supabase/schema.sql`)

- `devices` (uuid PK), `readings` (identity PK, FK a devices con `on delete cascade`), `alerts`.
- Índices compuestos `(device_id, created_at desc)` — las queries del dashboard siempre piden "lo más reciente".
- Seed: 5 dispositivos + 1 hora de lecturas (con `generate_series`) + 1 alerta abierta, para que la demo se vea viva desde el primer despliegue.

## Preguntas de entrevista que este proyecto te deja responder

1. *¿Cómo protegiste la base de datos?* → RLS + separación anon/service_role + token Bearer en el Worker.
2. *¿Por qué Server Components?* → menos JS al cliente, data fetching en el servidor, `Promise.all` para paralelismo.
3. *¿Por qué un Worker y no un cron en Vercel?* → cron nativo gratis, edge, y un endpoint de ingesta independiente del frontend que escala solo.
4. *¿Cómo lo harías escalar?* → particionar `readings` por tiempo (o TimescaleDB), agregados materializados por minuto, y Supabase Realtime para push en vez de refresh.
