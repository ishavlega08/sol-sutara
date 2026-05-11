"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu, Plus, X, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useState, useEffect, useCallback } from "react";
import { getUnreadCount } from "@/lib/api/notifications";

// ─── Notification bell ────────────────────────────────────────────────────────

function NotificationBell() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let alive = true;
        async function poll() {
            try {
                const res = await getUnreadCount();
                if (alive) setCount(res.count);
            } catch { /* silent — no auth yet or network error */ }
        }
        // Delay first poll by 4s to keep it off the critical render path
        const init = setTimeout(() => { if (alive) poll(); }, 4_000);
        const id   = setInterval(poll, 30_000);
        return () => { alive = false; clearTimeout(init); clearInterval(id); };
    }, []);

    return (
        <Link href="/notifications"
            className="relative rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            <Bell className="h-4 w-4" />
            {count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    );
}

// ─── Search coming-soon modal ─────────────────────────────────────────────────

function SearchModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Input bar */}
                <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                    <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <input
                        autoFocus
                        readOnly
                        placeholder="Search components, shipments, suppliers…"
                        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none"
                    />
                    <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Coming soon body */}
                <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950">
                        <Sparkles className="h-6 w-6 text-violet-500" />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            Global search coming soon
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                            Search across all components, shipments, suppliers, and documents in one place.
                            Powered by real-time indexing.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-1">
                        {["Components", "Shipments", "Suppliers", "Documents", "Events"].map((tag) => (
                            <span key={tag} className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Press <kbd className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close</span>
                    <span className="text-[11px] text-violet-500 font-medium">Coming soon</span>
                </div>
            </div>
        </div>
    );
}

// ─── Page labels ──────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
    "/":                        "Dashboard",
    "/dashboard":               "Dashboard",
    "/components":              "Components",
    "/components/create":       "Create Component",
    "/components/link":         "Link Components",
    "/graph":                   "Supply Chain Graph",
    "/trace":                   "Trace",
    "/recall":                  "Recall",
    "/analytics":               "Analytics",
    "/billing/plans":           "Plans & usage",
    "/billing/invoices":        "Invoices",
    "/settings/organization":   "Organization",
    "/settings/members":        "Members",
    "/settings/api-keys":       "API Keys",
    "/settings/webhooks":       "Webhooks",
    "/suppliers":               "Suppliers",
    "/suppliers/create":        "New Supplier",
    "/shipments":               "Shipments",
    "/shipments/create":        "New Shipment",
    "/notifications":           "Notifications",
};

function getPageLabel(pathname: string): string {
    if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
    const componentMatch = pathname.match(/^\/components\/([^/]+)$/);
    if (componentMatch) return `Components / ${componentMatch[1]}`;
    const supplierMatch = pathname.match(/^\/suppliers\/([^/]+)$/);
    if (supplierMatch) return `Suppliers / ${supplierMatch[1]}`;
    const shipmentMatch = pathname.match(/^\/shipments\/([^/]+)$/);
    if (shipmentMatch) return `Shipments / ${shipmentMatch[1]}`;
    return "Dashboard";
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function TopNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname      = usePathname();
    const pageLabel     = getPageLabel(pathname);
    const { org }       = useAuth();
    const { canCreate } = useRole();
    const [searchOpen, setSearchOpen] = useState(false);

    // ⌘K / Ctrl+K global shortcut
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            setSearchOpen(true);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            <header className="flex h-11 flex-shrink-0 items-center border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                {/* Brand */}
                <div className="flex h-full w-56 flex-shrink-0 items-center gap-2 border-r border-gray-200 px-4 dark:border-gray-800">
                    <button onClick={onMenuClick} className="mr-1 rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden">
                        <Menu className="h-4 w-4" />
                    </button>
                    <Logo size={22} className="flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sol Sutara</span>
                    <span className="ml-0.5 hidden rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 sm:inline">
                        Devnet
                    </span>
                </div>

                {/* Breadcrumb */}
                <div className="flex flex-1 items-center px-4">
                    <nav className="flex items-center gap-1.5 text-sm">
                        {org && (
                            <>
                                <span className="hidden text-gray-400 dark:text-gray-600 sm:inline">{org.name}</span>
                                <span className="hidden text-gray-300 dark:text-gray-700 sm:inline">/</span>
                            </>
                        )}
                        <span className="font-medium text-gray-800 dark:text-gray-200">{pageLabel}</span>
                    </nav>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 px-4">
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="hidden w-52 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800 lg:flex hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                    >
                        <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                        <span className="flex-1 text-left text-xs text-gray-400 dark:text-gray-500">Search…</span>
                        <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500">⌘K</kbd>
                    </button>

                    <NotificationBell />

                    {canCreate && (
                        <Link
                            href="/components/create"
                            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                        >
                            <Plus className="h-3 w-3" />
                            <span className="hidden sm:inline">Component</span>
                        </Link>
                    )}
                </div>
            </header>

            {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
        </>
    );
}
