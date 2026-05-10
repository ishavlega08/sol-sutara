"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PrivyProvider } from "@privy-io/react-auth";
import TopNavbar from "@/components/TopNavbar";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Pages that render without the sidebar/navbar shell (and without auth guard)
const PUBLIC_PATHS = ["/login", "/onboarding", "/landing", "/devnet-access", "/"];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
        || pathname.startsWith("/invite/");
}

function AppShell({ children }: { children: React.ReactNode }) {
    const pathname    = usePathname();
    const router      = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAuthenticated, isLoading } = useAuth();

    // Client-side auth guard — replaces the broken middleware cookie check
    useEffect(() => {
        if (isPublicPath(pathname)) return;
        if (isLoading) return;
        if (!isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    if (isPublicPath(pathname)) {
        return <>{children}</>;
    }

    // Show nothing while auth loads to avoid a flash of protected content
    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                <svg className="h-6 w-6 animate-spin text-violet-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
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
