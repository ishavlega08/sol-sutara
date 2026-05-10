"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useState, useEffect } from "react";
import { getUnreadCount } from "@/lib/api/notifications";

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
        poll();
        const id = setInterval(poll, 30_000);
        return () => { alive = false; clearInterval(id); };
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

const PAGE_LABELS: Record<string, string> = {
    "/":                        "Dashboard",
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

export default function TopNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname  = usePathname();
    const pageLabel = getPageLabel(pathname);
    const { org }   = useAuth();
    const { canCreate } = useRole();

    return (
        <header className="flex h-11 flex-shrink-0 items-center border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            {/* Brand — same width as desktop sidebar */}
            <div className="flex h-full w-56 flex-shrink-0 items-center gap-2 border-r border-gray-200 px-4 dark:border-gray-800">
                <button onClick={onMenuClick} className="mr-1 rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden">
                    <Menu className="h-4 w-4" />
                </button>
                <svg viewBox="0 0 14 14" className="h-4 w-4 flex-shrink-0" fill="none">
                    <path d="M7 1L13 12H1L7 1Z" fill="currentColor" className="text-gray-900 dark:text-gray-100" />
                </svg>
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
                <div className="hidden w-52 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800 lg:flex">
                    <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    <span className="flex-1 text-xs text-gray-400 dark:text-gray-500">Search components…</span>
                    <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500">⌘K</kbd>
                </div>

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
    );
}
