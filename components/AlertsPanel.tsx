import { acknowledgeAlert } from "@/app/actions";
import type { Alert } from "@/lib/types";

export default function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="rounded-xl border border-edge bg-card">
      <h2 className="border-b border-edge px-4 py-3 text-sm font-semibold text-white">
        Open alerts
      </h2>
      <div className="max-h-[300px] divide-y divide-edge/60 overflow-y-auto">
        {alerts.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            All clear — no open alerts.
          </p>
        )}
        {alerts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">
                <span className="font-semibold text-red-400">
                  {a.metric}
                </span>{" "}
                {a.value} (limit {a.threshold})
              </p>
              <p className="truncate text-xs text-slate-400">
                {a.devices?.name ?? a.device_id} ·{" "}
                {new Date(a.created_at).toLocaleString()}
              </p>
            </div>
            <form action={acknowledgeAlert}>
              <input type="hidden" name="id" value={a.id} />
              <button className="rounded-lg border border-edge px-2.5 py-1 text-xs text-slate-300 hover:border-accent hover:text-accent">
                Ack
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
