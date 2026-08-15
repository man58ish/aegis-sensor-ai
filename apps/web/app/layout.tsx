import type { Metadata } from "next";

// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "Aegis Sensor AI",
  description: "Industrial IoT Telemetry Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}