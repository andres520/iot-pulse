import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import StatCards from "@/components/StatCards";
import ReadingsChart from "@/components/ReadingsChart";
import DevicesTable from "@/components/DevicesTable";
import AlertsPanel from "@/components/AlertsPanel";
import type { Alert, Device, Reading } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [
    { data: devices },
    { data: readings },
    { data: alerts },
    { data: userData },
  ] = await Promise.all([
    supabase.from("devices").select("*").order("name"),
    supabase
      .from("readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("alerts")
      .select("*, devices(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.auth.getUser(),
  ]);

  const deviceList = (devices ?? []) as Device[];
  const readingList = (readings ?? []) as Reading[];
  const alertList = (alerts ?? []) as Alert[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            IoT <span className="text-accent">Pulse</span>
          </h1>
          <p className="text-xs text-slate-400">
            Industrial telemetry · live from Cloudflare Worker → Supabase
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-400 sm:block">
            {userData.user?.email}
          </span>
          <form action={signOut}>
            <button className="rounded-lg border border-edge px-3 py-1.5 text-xs text-slate-300 hover:border-accent hover:text-accent">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <StatCards devices={deviceList} readings={readingList} alerts={alertList} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReadingsChart readings={readingList} />
        </div>
        <AlertsPanel alerts={alertList} />
      </div>

      <div className="mt-6">
        <DevicesTable devices={deviceList} readings={readingList} />
      </div>
    </main>
  );
}
