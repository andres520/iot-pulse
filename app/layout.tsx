import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IoT Pulse — Industrial Telemetry Dashboard",
  description:
    "Real-time monitoring of industrial IoT devices. Next.js + Supabase + Cloudflare Workers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
