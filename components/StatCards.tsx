import type { Alert, Device, Reading } from "@/lib/types";

export default function StatCards({
  devices,
  readings,
  alerts,
}: {
  devices: Device[];
  readings: Reading[];
  alerts: Alert[];
}) {
  const online = devices.filter((d) => d.status === "online").length;
  const latest = readings.slice(0, devices.length || 1);
  const avgTemp =
    latest.length > 0
      ? latest.reduce((s, r) => s + r.temperature, 0) / latest.length
      : 0;
  const avgPower =
    latest.length > 0
      ? latest.reduce((s, r) => s + r.power, 0) / latest.length
      : 0;

  const cards = [
    { label: "Devices online", value: `${online} / ${devices.length}` },
    { label: "Open alerts", value: String(alerts.length), alert: alerts.length > 0 },
    { label: "Avg temperature", value: `${avgTemp.toFixed(1)} °C` },
    { label: "Avg power draw", value: `${avgPower.toFixed(0)} W` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-edge bg-card p-4"
        >
          <p className="text-xs text-slate-400">{c.label}</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              c.alert ? "text-red-400" : "text-white"
            }`}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
