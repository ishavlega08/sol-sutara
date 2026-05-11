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

// ─── Shell skeleton shown while auth state is resolving ───────────────────────

function ShellSkeleton() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* Sidebar skeleton */}
            <aside className="hidden h-full w-56 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex flex-col">
                {/* Org header */}
                <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 px-3 py-2.5">
                    <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-2.5 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                </div>
                {/* Nav items */}
                <div className="flex-1 px-2 py-2 space-y-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
                            <div className="h-4 w-4 flex-shrink-0 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                            <div className="h-3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" style={{ width: `${40 + (i % 3) * 20}%` }} />
                        </div>
                    ))}
                </div>
                {/* User footer */}
                <div className="flex items-center gap-2.5 border-t border-gray-100 dark:border-gray-800 px-3 py-2.5">
                    <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-2.5 w-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                </div>
            </aside>

            {/* Main area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Navbar skeleton */}
                <header className="flex h-11 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                </header>
                {/* Page content skeleton */}
                <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950 p-6">
                    <div className="mx-auto max-w-7xl space-y-5">
                        <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-24 animate-pulse rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
                            ))}
                        </div>
                        <div className="h-64 animate-pulse rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
                    </div>
                </main>
            </div>
        </div>
    );
}

// ─── App shell with auth guard ────────────────────────────────────────────────

function AppShell({ children }: { children: React.ReactNode }) {
    const pathname    = usePathname();
    const router      = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAuthenticated, isLoading } = useAuth();

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

    // Show skeleton layout while auth resolves — mirrors the real shell shape
    // so the layout doesn't jump when content loads.
    if (isLoading || !isAuthenticated) {
        return <ShellSkeleton />;
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

// ─── Root shell ───────────────────────────────────────────────────────────────

const isHttps = typeof window !== "undefined"
    ? window.location.protocol === "https:"
    : true;

export default function ClientShell({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ""}
            config={{
                loginMethods: ["email", "wallet"],
                embeddedWallets: {
                    solana:   { createOnLogin: isHttps ? "all-users" : "off" },
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
