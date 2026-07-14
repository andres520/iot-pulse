# Guía de despliegue — IoT Pulse (paso a paso)

Tiempo estimado: 1–2 horas. Todo en plan gratuito. Necesitas Node.js 18+ y Git instalados.

---

## Paso 0 — Crear las cuentas (todas gratis)

1. **GitHub** — https://github.com/signup (usa tu usuario andreslq520 si ya la tienes)
2. **Supabase** — https://supabase.com → "Start your project" → regístrate con GitHub
3. **Vercel** — https://vercel.com/signup → regístrate con GitHub (importante: con GitHub, así el deploy es automático)
4. **Cloudflare** — https://dash.cloudflare.com/sign-up → email + contraseña

---

## Paso 1 — Probar la app localmente

```bash
cd iot-pulse
npm install
npm run build   # verifica que compila sin errores
```

Si `npm run build` pasa, todo está bien. (Aún no `npm run dev` — primero necesitas Supabase.)

---

## Paso 2 — Configurar Supabase (base de datos + auth)

1. En https://supabase.com/dashboard → **New project**
   - Name: `iot-pulse` · Database password: guárdala · Region: `East US` (más cerca de US)
2. Espera ~2 min a que el proyecto se cree.
3. Ve a **SQL Editor** → **New query** → pega TODO el contenido de `supabase/schema.sql` → **Run**.
   - Esto crea las tablas `devices`, `readings`, `alerts`, las políticas RLS y datos de ejemplo.
4. Ve a **Authentication → Sign In / Up → Email** y **desactiva "Confirm email"** (para que el registro en la demo sea inmediato).
5. Ve a **Project Settings → API** (o **Data API**) y copia:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → la usarás en el Worker (¡NUNCA en el frontend!)

6. Prueba local:

```bash
cp .env.example .env.local
# edita .env.local con tu URL y anon key
npm run dev
```

Abre http://localhost:3000 → crea una cuenta → deberías ver el dashboard con los 5 dispositivos y la gráfica.

---

## Paso 3 — Subir a GitHub

```bash
cd iot-pulse
git init
git add .
git commit -m "IoT Pulse: telemetry dashboard (Next.js + Supabase + Cloudflare Worker)"
```

Crea el repo en https://github.com/new (nombre: `iot-pulse`, público — así sirve de portafolio) y:

```bash
git remote add origin https://github.com/TU-USUARIO/iot-pulse.git
git branch -M main
git push -u origin main
```

`.gitignore` ya excluye `.env.local` — tus claves no se suben.

---

## Paso 4 — Desplegar en Vercel

1. https://vercel.com/new → **Import** tu repo `iot-pulse`
2. Framework: detecta Next.js automáticamente. NO cambies nada más.
3. En **Environment Variables** agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key
4. **Deploy** → en ~2 min tienes tu URL: `https://iot-pulse-xxxx.vercel.app`
5. Abre la URL, crea tu cuenta y verifica que el dashboard carga.

**Esta URL es la que va en el formulario de la vacante y en tu CV.**

---

## Paso 5 — Desplegar el Cloudflare Worker

```bash
cd worker
npm install
npx wrangler login          # abre el navegador, autoriza
npx wrangler secret put SUPABASE_URL
# pega: https://TU-PROYECTO.supabase.co
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# pega: tu service_role key
npx wrangler secret put INGEST_TOKEN
# pega: una cadena aleatoria larga (invéntala y guárdala)
npm run deploy
```

Te dará una URL tipo `https://iot-pulse-worker.TU-SUBDOMINIO.workers.dev`.

Verifica:

```bash
curl https://iot-pulse-worker.TU-SUBDOMINIO.workers.dev/health
# {"ok":true,"service":"iot-pulse-worker"}

curl -X POST https://iot-pulse-worker.TU-SUBDOMINIO.workers.dev/simulate \
  -H "Authorization: Bearer TU_INGEST_TOKEN"
# {"ok":true,"result":"inserted 4 readings, raised 0 alert(s)"}
```

Recarga el dashboard: verás lecturas nuevas. El cron correrá solo cada 5 minutos desde ahora — el dashboard queda "vivo" sin que hagas nada.

---

## Paso 6 — Actualizar CV y aplicar

1. Dame la URL de Vercel y regenero tu CV con el link real.
2. En el formulario:
   - **Live app link**: tu URL de Vercel
   - **Deployed to production**: marca Next.js/React, Supabase/Postgres, Vercel y Cloudflare Workers ✅ (ahora todas son verdad)
3. Graba el video mostrando la app si quieres puntos extra.

---

## Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| "Invalid login credentials" | Desactiva "Confirm email" en Supabase Auth (Paso 2.4) o revisa tu correo |
| Dashboard vacío | ¿Corriste `schema.sql` completo? Revisa Table Editor → devices |
| Worker 401 | El header debe ser exactamente `Authorization: Bearer TU_TOKEN` |
| Worker 500 | Revisa secrets: `npx wrangler secret list` y logs: `npm run tail` |
| Build falla en Vercel | Asegúrate de haber agregado las 2 variables de entorno antes del deploy |
