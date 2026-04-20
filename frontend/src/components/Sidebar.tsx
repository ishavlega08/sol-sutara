"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PlusCircle, Boxes, Link2, Workflow } from "lucide-react";

const NAV = [
  {
    section: "Registry",
    items: [
      {
        label: "Components",
        href: "/",
        icon: LayoutGrid,
        match: (p: string) => p === "/",
      },
      {
        label: "Create Component",
        href: "/components/create",
        icon: PlusCircle,
        match: (p: string) => p === "/components/create",
      },
      {
        label: "Link Components",
        href: "/components/link",
        icon: Link2,
        match: (p: string) => p === "/components/link",
      },
    ],
  },
  {
    section: "Visualize",
    items: [
      {
        label: "Supply Chain Graph",
        href: "/graph",
        icon: Workflow,
        match: (p: string) => p === "/graph",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900">
          <Boxes className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900">SolSutara</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {section}
            </p>
            <div className="space-y-0.5">
              {items.map(({ label, href, icon: Icon, match }) => {
                const active = match(pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-gray-100 font-medium text-gray-900"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${
                        active ? "text-gray-900" : "text-gray-400"
                      }`}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs text-gray-400">Devnet</span>
        </div>
      </div>
    </aside>
  );
}
