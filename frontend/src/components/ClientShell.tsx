"use client";

import { useState } from "react";
import TopNavbar from "@/components/TopNavbar";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <ThemeProvider>
      <TopNavbar onMenuClick={() => setMobileOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </ThemeProvider>
  );
}
