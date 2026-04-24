import type { Metadata } from "next";
import ClientShell from "@/components/ClientShell";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "SolSutara",
  description: "Decentralized supply chain traceability on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col overflow-hidden bg-white antialiased dark:bg-gray-950">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
