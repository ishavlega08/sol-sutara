import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "SolSutara",
  description: "Decentralized supply chain traceability on Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-gray-50 antialiased">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
