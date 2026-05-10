"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    LayoutDashboard, Boxes, Link2, GitMerge, AlertOctagon,
    BarChart2, CreditCard, FileText, Building2, Users, Key,
    ChevronDown, Moon, Sun, X, LogOut, Truck, Package, Bell, Webhook,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
    match: (p: string) => boolean;
    badge?: string;
};

const WORKSPACE: NavItem[] = [
    { label: "Dashboard",  href: "/",               icon: LayoutDashboard, match: (p) => p === "/" },
    { label: "Components", href: "/components",      icon: Boxes,           match: (p) => p.startsWith("/components") && !p.startsWith("/components/link") },
    { label: "Link",       href: "/components/link", icon: Link2,           match: (p) => p === "/components/link" },
    { label: "Trace",      href: "/trace",           icon: GitMerge,        match: (p) => p === "/trace" },
    { label: "Recall",     href: "/recall",          icon: AlertOctagon,    match: (p) => p === "/recall", badge: "NEW" },
    { label: "Analytics",  href: "/analytics",       icon: BarChart2,       match: (p) => p === "/analytics" },
    { label: "Suppliers",  href: "/suppliers",       icon: Building2,       match: (p) => p.startsWith("/suppliers") },
    { label: "Shipments",  href: "/shipments",       icon: Truck,           match: (p) => p.startsWith("/shipments") },
    { label: "Notifications", href: "/notifications", icon: Bell,           match: (p) => p.startsWith("/notifications") },
];

const BILLING: NavItem[] = [
    { label: "Plans & usage", href: "/billing/plans",    icon: CreditCard, match: (p) => p.startsWith("/billing/plans") },
    { label: "Invoices",      href: "/billing/invoices", icon: FileText,   match: (p) => p.startsWith("/billing/invoices") },
];

const SETTINGS: NavItem[] = [
    { label: "Organization", href: "/settings/organization", icon: Building2, match: (p) => p.startsWith("/settings/organization") },
    { label: "Members",      href: "/settings/members",      icon: Users,     match: (p) => p.startsWith("/settings/members") },
    { label: "API keys",     href: "/settings/api-keys",     icon: Key,       match: (p) => p.startsWith("/settings/api-keys") },
    { label: "Webhooks",    href: "/settings/webhooks",     icon: Webhook,   match: (p) => p.startsWith("/settings/webhooks") },
];

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                active
                    ? "bg-violet-50 font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            }`}
        >
            <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"}`} />
            <span className="flex-1 leading-none">{item.label}</span>
            {item.badge && (
                <span className="rounded-sm bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-1 px-2.5 pt-4 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {children}
        </p>
    );
}

function orgInitials(name: string): string {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

function userInitials(email: string | null): string {
    if (!email) return "?";
    return email.slice(0, 2).toUpperCase();
}

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
    const { theme, toggle } = useTheme();
    const { org, user, role, logout } = useAuth();
    const router   = useRouter();
    const ThemeIcon = theme === "dark" ? Sun : Moon;

    async function handleLogout() {
        await logout();
        router.push("/login");
    }

    return (
        <>
            {/* Org selector */}
            <div className="flex items-center gap-2.5 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: "#7c3aed" }}>
                    {org ? orgInitials(org.name) : "—"}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
                        {org?.name ?? "No organization"}
                    </p>
                    <p className="truncate text-[11px] leading-tight text-gray-400 dark:text-gray-500">
                        {org ? `org:${org.id.slice(0, 8)}…` : "Set up in settings →"}
                    </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-600" />
                {onClose && (
                    <button onClick={onClose} className="ml-1 rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-2 py-1">
                <SectionHeading>Workspace</SectionHeading>
                {WORKSPACE.map((item) => (
                    <NavLink key={item.href} item={item} active={item.match(pathname)} onClick={onClose} />
                ))}
                <SectionHeading>Billing</SectionHeading>
                {BILLING.map((item) => (
                    <NavLink key={item.href} item={item} active={item.match(pathname)} onClick={onClose} />
                ))}
                <SectionHeading>Settings</SectionHeading>
                {SETTINGS.map((item) => (
                    <NavLink key={item.href} item={item} active={item.match(pathname)} onClick={onClose} />
                ))}
            </nav>

            {/* User */}
            <div className="flex items-center gap-2.5 border-t border-gray-100 px-3 py-2.5 dark:border-gray-800">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                    {userInitials(user?.email ?? null)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
                        {user?.email ?? "—"}
                    </p>
                    <p className="text-[11px] leading-tight capitalize text-gray-400 dark:text-gray-500">
                        {role ? role.charAt(0) + role.slice(1).toLowerCase() : "Member"}
                    </p>
                </div>
                <button
                    onClick={toggle}
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    className="flex-shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800"
                >
                    <ThemeIcon className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={handleLogout}
                    title="Sign out"
                    className="flex-shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-red-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-red-400"
                >
                    <LogOut className="h-3.5 w-3.5" />
                </button>
            </div>
        </>
    );
}

export default function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden h-full w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
                <SidebarContent pathname={pathname} />
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <>
                    <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onMobileClose} />
                    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 md:hidden">
                        <SidebarContent pathname={pathname} onClose={onMobileClose} />
                    </aside>
                </>
            )}
        </>
    );
}
