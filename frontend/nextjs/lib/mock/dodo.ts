// Mock Dodo Payments client. Replace with real @dodopayments/node or REST calls server-side.
export type Plan = {
  id: "starter" | "growth" | "enterprise";
  name: string;
  price: number | null; // null = custom
  period: "mo";
  description: string;
  features: string[];
  featured?: boolean;
};

export const PLANS: Plan[] = [
  { id: "starter", name: "Starter", price: 0, period: "mo",
    description: "For design partners on devnet.",
    features: ["10,000 component writes / mo", "5,000 trace queries", "5 seats", "Devnet only"] },
  { id: "growth", name: "Growth", price: 490, period: "mo", featured: true,
    description: "For teams running production supply chains.",
    features: ["500,000 writes / mo · $0.0008 after", "250,000 trace queries", "25 seats · SSO", "Mainnet · SLA 99.9%", "Priority support"] },
  { id: "enterprise", name: "Enterprise", price: null, period: "mo",
    description: "Dedicated infra, custom indexer.",
    features: ["Unlimited writes & queries", "Dedicated indexer + RPC", "Unlimited seats · SAML", "99.99% SLA + DPO", "On-premise indexer option"] },
];

export type Invoice = { id: string; period: string; plan: string; amount: number; method: string; status: "paid" | "free" };
export const INVOICES: Invoice[] = [
  { id: "INV-2026-0412", period: "Apr 2026", plan: "Growth", amount: 490, method: "Card · 4242", status: "paid" },
  { id: "INV-2026-0312", period: "Mar 2026", plan: "Growth", amount: 490, method: "USDC · Solana", status: "paid" },
  { id: "INV-2026-0212", period: "Feb 2026", plan: "Growth", amount: 490, method: "Card · 4242", status: "paid" },
  { id: "INV-2026-0112", period: "Jan 2026", plan: "Starter", amount: 0, method: "—", status: "free" },
];

export type UsageSnapshot = { writes: { used: number; limit: number; rate: string }; traces: { used: number; limit: number; rate: string }; seats: { used: number; limit: number; rate: string } };
export const USAGE: UsageSnapshot = {
  writes: { used: 4218, limit: 10000, rate: "$0.001 per write after limit" },
  traces: { used: 1842, limit: 5000, rate: "$0.002 per query after limit" },
  seats: { used: 3, limit: 5, rate: "$15 per extra seat / mo" },
};

// Mock checkout — posts to Dodo Payments. Replace with real API.
export async function createCheckout(opts: { planId: Plan["id"]; method: "card" | "crypto"; email: string }): Promise<{ id: string; status: "succeeded" | "requires_action" }> {
  await new Promise((r) => setTimeout(r, 700));
  return { id: "dodo_chk_" + Math.random().toString(36).slice(2, 10), status: "succeeded" };
}
