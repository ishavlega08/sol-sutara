"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PrivyProvider } from "@privy-io/react-auth";
import TopNavbar from "@/components/TopNavbar";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

// Pages that render without the sidebar/navbar shell
const AUTH_PATHS = ["/login", "/onboarding", "/landing", "/devnet-access", "/"];

function isAuthPath(pathname: string): boolean {
    return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
        || pathname.startsWith("/invite/");
}

function AppShell({ children }: { children: React.ReactNode }) {
    const pathname    = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (isAuthPath(pathname)) {
        return <>{children}</>;
    }

    return (
        <>
            <TopNavbar onMenuClick={() => setMobileOpen(true)} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
                <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
            </div>
        </>
    );
}

// Privy embedded wallets require HTTPS — disable on plain HTTP to prevent a hard crash
const isHttps = typeof window !== "undefined"
    ? window.location.protocol === "https:"
    : true; // SSR: assume HTTPS, Privy resolves correctly server-side

export default function ClientShell({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ""}
            config={{
                loginMethods: ["email", "wallet"],
                embeddedWallets: {
                    solana: { createOnLogin: isHttps ? "all-users" : "off" },
                    ethereum: { createOnLogin: "off" },
                },
                appearance: {
                    theme:       "light",
                    accentColor: "#7c3aed",
                },
            }}
        >
            <ThemeProvider>
                <AuthProvider>
                    <AppShell>{children}</AppShell>
                </AuthProvider>
            </ThemeProvider>
        </PrivyProvider>
    );
}
