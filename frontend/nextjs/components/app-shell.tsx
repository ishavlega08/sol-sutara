"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, Link2, Share2, AlertTriangle, BarChart3,
  CreditCard, FileText, Building2, Users, KeyRound, Moon, Sun, Bell, Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/mock/auth";
import { ORG } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";

const NAV = [
  { section: "Workspace", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/components", label: "Components", icon: Package },
    { href: "/link", label: "Link", icon: Link2 },
    { href: "/trace", label: "Trace", icon: Share2 },
    { href: "/recall", label: "Recall", icon: AlertTriangle, badge: "NEW" },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ]},
  { section: "Billing", items: [
    { href: "/billing", label: "Plans & usage", icon: CreditCard },
    { href: "/billing/invoices", label: "Invoices", icon: FileText },
  ]},
  { section: "Settings", items: [
    { href: "/settings/org", label: "Organization", icon: Building2 },
    { href: "/settings/members", label: "Members", icon: Users },
    { href: "/settings/api-keys", label: "API keys", icon: KeyRound },
  ]},
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = (localStorage.getItem("sutara-theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("light", saved === "light");
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("sutara-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  return (
    <div className="flex min-h-screen relative z-10">
      <aside className="w-60 border-r border-border bg-bg-elev/70 backdrop-blur sticky top-0 h-screen flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-2.5">
          <Logo />
          <span className="font-display font-semibold text-[15px]">Sol Sutara</span>
          <span className="ml-auto font-mono text-[9.5px] text-accent-2 bg-accent-2/15 px-1.5 py-0.5 rounded-sm tracking-wider">DEVNET</span>
        </div>

        <div className="m-3 p-2.5 px-3 rounded-md border border-border bg-bg-elev flex items-center justify-between cursor-pointer hover:border-border-strong">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[5px] bg-gradient-to-br from-accent-2 to-accent text-[#02180e] font-mono text-[11px] font-semibold grid place-items-center">M</div>
            <div>
              <div className="text-[13px] font-medium">{ORG.name}</div>
              <div className="text-[10.5px] text-fg-dim font-mono tracking-wider">{ORG.id.replace("org:", "org_")}…p9Qp</div>
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M8 9l4-4 4 4M8 15l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>

        <nav className="flex-1 overflow-y-auto px-2">
          {NAV.map((sec) => (
            <div key={sec.section}>
              <div className="font-mono text-[10px] tracking-widest uppercase text-fg-dim px-2.5 pt-3.5 pb-1.5">{sec.section}</div>
              {sec.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition",
                      active ? "bg-accent/10 text-fg" : "text-fg-muted hover:bg-bg-elev hover:text-fg"
                    )}>
                    <Icon className={cn("w-4 h-4", active ? "text-accent" : "text-fg-dim")} />
                    {item.label}
                    {"badge" in item && item.badge && (
                      <span className="ml-auto font-mono text-[9.5px] px-1.5 py-0.5 rounded-sm bg-accent-3/20 text-accent-3 tracking-wider">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-3 to-accent-2 text-white font-mono text-[11px] font-semibold grid place-items-center">AP</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-medium">Ava Patel</div>
            <div className="text-[10.5px] text-fg-dim font-mono">Owner</div>
          </div>
          <button onClick={toggleTheme} className="w-8 h-8 rounded-md grid place-items-center text-fg-muted hover:bg-bg-elev hover:text-fg">
            {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-bg/75 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <span>{ORG.name}</span>
            <span className="text-fg-dim">/</span>
            <span className="text-fg font-medium">{titleFor(pathname)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-2.5 py-1.5 border border-border rounded-md bg-bg-elev text-xs text-fg-muted min-w-[240px]">
              <Search className="w-3.5 h-3.5" /> Search components, orgs…
              <span className="ml-auto font-mono text-[10px] px-1.5 py-px rounded bg-bg-elev-2 border border-border-strong text-fg-muted">⌘K</span>
            </div>
            <Button variant="ghost" size="default"><Bell className="w-3.5 h-3.5" /></Button>
            <Link href="/components"><Button variant="primary" size="default">+ Component</Button></Link>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function titleFor(path: string) {
  if (path === "/dashboard") return "Dashboard";
  if (path.startsWith("/components")) return "Components";
  if (path === "/link") return "Link";
  if (path === "/trace") return "Trace";
  if (path === "/recall") return "Recall";
  if (path === "/analytics") return "Analytics";
  if (path === "/billing") return "Billing";
  if (path.startsWith("/billing/checkout")) return "Checkout";
  if (path.startsWith("/billing/invoices")) return "Invoices";
  if (path === "/settings/org") return "Settings / Organization";
  if (path === "/settings/members") return "Settings / Members";
  if (path === "/settings/api-keys") return "Settings / API keys";
  return "";
}
