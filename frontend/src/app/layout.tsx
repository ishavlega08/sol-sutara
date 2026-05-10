import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import "@/styles/globals.css";

const ClientShell = dynamic(() => import("@/components/ClientShell"), { ssr: false });

export const metadata: Metadata = {
  title: "SolSutara",
  description: "Decentralized supply chain traceability on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-TCNR3052RS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TCNR3052RS');
          `}
        </Script>
      </head>
      <body className="flex h-screen flex-col overflow-hidden antialiased">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
