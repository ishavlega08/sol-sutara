"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const { isAuthenticated, isLoading, hasOrg, login } = useAuth();
    const router       = useRouter();
    const searchParams = useSearchParams();
    const redirect     = searchParams.get("redirect") ?? "/";

    // Redirect if already authenticated
    useEffect(() => {
        if (isLoading) return;
        if (isAuthenticated) {
            router.replace(hasOrg ? redirect : "/onboarding");
        }
    }, [isAuthenticated, isLoading, hasOrg, redirect, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="w-full max-w-sm">

                {/* Logo + brand */}
                <div className="mb-8 flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center gap-2">
                        <svg viewBox="0 0 14 14" className="h-7 w-7" fill="none">
                            <path d="M7 1L13 12H1L7 1Z" fill="currentColor" className="text-gray-900 dark:text-gray-100" />
                        </svg>
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Sol Sutara</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Decentralized supply chain intelligence
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
                    <h1 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Sign in to your workspace
                    </h1>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                        New users are created automatically on first sign-in.
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <svg className="h-5 w-5 animate-spin text-violet-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : (
                        <button
                            onClick={login}
                            className="w-full rounded-md py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                        >
                            Continue →
                        </button>
                    )}

                    <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-600">
                        By continuing you agree to Sol Sutara&apos;s terms of service.
                    </p>
                </div>

                {/* Network badge */}
                <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-600">
                    Connected to{" "}
                    <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Solana Devnet
                    </span>
                </p>
            </div>
        </div>
    );
}
