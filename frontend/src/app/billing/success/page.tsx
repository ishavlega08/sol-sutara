"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

const PLAN_LABELS: Record<string, string> = {
    STARTER:    "Starter",
    GROWTH:     "Growth",
    ENTERPRISE: "Enterprise",
};

// useSearchParams must live inside a Suspense boundary in Next.js 14+
function SuccessContent() {
    const params  = useSearchParams();
    const router  = useRouter();
    const plan    = params.get("plan")    ?? "STARTER";
    const billing = params.get("billing") ?? "monthly";

    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (countdown <= 0) {
            router.replace("/billing/plans");
            return;
        }
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown, router]);

    const planLabel    = PLAN_LABELS[plan] ?? plan;
    const billingLabel = billing === "annual" ? "annual" : "monthly";

    return (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-300 dark:border-emerald-700"
                style={{ background: "color-mix(in oklab, #10b981 10%, transparent)" }}>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                You&apos;re on {planLabel}!
            </h1>
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                Your <strong className="text-gray-700 dark:text-gray-300">{planLabel} · {billingLabel}</strong> subscription is now active.
            </p>
            <p className="mb-6 text-xs text-gray-400 dark:text-gray-500">
                A confirmation receipt has been sent to your email.
            </p>

            <div className="mb-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                Your plan limits and invoices are now available in the billing dashboard.
            </div>

            <div className="flex flex-col gap-3">
                <Link
                    href="/billing/plans"
                    className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                >
                    View billing dashboard
                </Link>
                <Link
                    href="/components"
                    className="rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    Go to components →
                </Link>
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Redirecting to billing in {countdown}s…
            </p>
        </div>
    );
}

export default function BillingSuccessPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 flex justify-center">
                    <div className="flex items-center gap-2">
                        <Logo size={28} />
                        <span className="text-base font-bold text-gray-900 dark:text-gray-100">Sol Sutara</span>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                }>
                    <SuccessContent />
                </Suspense>
            </div>
        </div>
    );
}
