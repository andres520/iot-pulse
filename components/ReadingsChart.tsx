"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Reading } from "@/lib/types";

type Point = {
  time: string;
  temperature: number;
  vibration: number;
  power: number;
};

function buildSeries(readings: Reading[]): Point[] {
  // Group by minute and average across devices (oldest -> newest)
  const buckets = new Map<
    string,
    { t: number; v: number; p: number; n: number }
  >();

  for (const r of [...readings].reverse()) {
    const key = new Date(r.created_at).toISOString().slice(0, 16);
    const b = buckets.get(key) ?? { t: 0, v: 0, p: 0, n: 0 };
    b.t += r.temperature;
    b.v += r.vibration;
    b.p += r.power;
    b.n += 1;
    buckets.set(key, b);
  }

  return Array.from(buckets.entries()).map(([key, b]) => ({
    time: new Date(key + ":00Z").toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    temperature: +(b.t / b.n).toFixed(1),
    vibration: +(b.v / b.n).toFixed(2),
    power: +(b.p / b.n).toFixed(0),
  }));
}

export default function ReadingsChart({ readings }: { readings: Reading[] }) {
  const data = buildSeries(readings);

  return (
    <div className="rounded-xl border border-edge bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold text-white">
        Fleet telemetry (avg per minute)
      </h2>
      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">
          No readings yet — the Cloudflare Worker will start streaming data
          after deployment.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid stroke="#1e2a44" strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
            <YAxis yAxisId="left" stroke="#64748b" fontSize={11} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              fontSize={11}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111a2e",
                border: "1px solid #1e2a44",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              name="Temp (°C)"
              stroke="#38bdf8"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="vibration"
              name="Vibration (mm/s)"
              stroke="#f472b6"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="power"
              name="Power (W)"
              stroke="#facc15"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
