"use client";
// Mock NextAuth-style session. In real app, replace with useSession from next-auth/react.
import { useEffect, useState } from "react";

export type User = { name: string; email: string; role: "Owner" | "Admin" | "Member"; wallet?: string };

const MOCK_USER: User = { name: "Ava Patel", email: "ava@meridian.ev", role: "Owner", wallet: "8Jk2…p9Qp" };

export function useSession() {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  useEffect(() => {
    const hasAuth = typeof window !== "undefined" && localStorage.getItem("sutara-auth") === "1";
    setStatus(hasAuth ? "authenticated" : "unauthenticated");
  }, []);
  return { status, user: status === "authenticated" ? MOCK_USER : null };
}

export function signIn() {
  localStorage.setItem("sutara-auth", "1");
  window.location.href = "/dashboard";
}

export function signOut() {
  localStorage.removeItem("sutara-auth");
  window.location.href = "/login";
}

// Wallet (mock) — swap for @solana/wallet-adapter-react in production
export function connectWallet(): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve("8Jk2…p9Qp"), 600));
}
