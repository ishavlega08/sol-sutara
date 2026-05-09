import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sol Sutara — Traceability on Solana",
  description: "Thread every part, batch, and handoff into one tamper-proof graph.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
