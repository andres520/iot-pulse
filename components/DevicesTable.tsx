import type { Device, Reading } from "@/lib/types";

const statusStyle: Record<Device["status"], string> = {
  online: "bg-emerald-500/15 text-emerald-400",
  offline: "bg-red-500/15 text-red-400",
  maintenance: "bg-amber-500/15 text-amber-400",
};

export default function DevicesTable({
  devices,
  readings,
}: {
  devices: Device[];
  readings: Reading[];
}) {
  const lastByDevice = new Map<string, Reading>();
  for (const r of readings) {
    if (!lastByDevice.has(r.device_id)) lastByDevice.set(r.device_id, r);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-card">
      <h2 className="border-b border-edge px-4 py-3 text-sm font-semibold text-white">
        Devices
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-400">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Location</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Last temp</th>
              <th className="px-4 py-2 font-medium">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const last = lastByDevice.get(d.id);
              return (
                <tr key={d.id} className="border-t border-edge/60">
                  <td className="px-4 py-2.5 font-medium text-white">
                    {d.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{d.type}</td>
                  <td className="px-4 py-2.5 text-slate-300">{d.location}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[d.status]}`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">
                    {last ? `${last.temperature.toFixed(1)} °C` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">
                    {last
                      ? new Date(last.created_at).toLocaleTimeString()
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {devices.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No devices — run supabase/schema.sql to seed the demo fleet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
