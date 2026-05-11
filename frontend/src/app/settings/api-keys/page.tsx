"use client";

import { Key, Lock, Zap, Code2, ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";

export default function ApiKeysPage() {
    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

                <PageHeader
                    title="API keys"
                    subtitle={<span>Programmatic access to your workspace</span>}
                />

                {/* Coming soon banner */}
                <div className="mb-6 overflow-hidden rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40">
                    <div className="p-6 sm:p-8">
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900">
                                <Key className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">API keys</h2>
                                    <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                        Coming soon
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
                                    API keys will let you authenticate programmatically against the Sol Sutara REST API — perfect for CI pipelines, ERP integrations, and custom tooling.
                                </p>
                                <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                                    This feature is available on the <strong className="text-gray-700 dark:text-gray-300">Starter</strong> plan and above. Expected in the next release cycle.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature preview cards */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                        {
                            icon: Lock,
                            color: "#7c3aed",
                            title: "Scoped permissions",
                            desc: "Create keys with read-only, write, or admin scopes. Revoke anytime.",
                        },
                        {
                            icon: Zap,
                            color: "#f59e0b",
                            title: "Rate-limited by plan",
                            desc: "Key usage counts against your plan's write and trace quotas.",
                        },
                        {
                            icon: Code2,
                            color: "#10b981",
                            title: "Same API, zero friction",
                            desc: "Pass your key as a Bearer token — identical endpoints, no SDK required.",
                        },
                    ].map(({ icon: Icon, color, title, desc }) => (
                        <div key={title} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                            <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg"
                                style={{ background: `color-mix(in oklab, ${color} 12%, transparent)` }}>
                                <Icon className="h-4 w-4" style={{ color }} />
                            </span>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>

                {/* Use webhooks in the meantime */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">In the meantime</p>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        <Link href="/settings/webhooks"
                            className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Use webhooks for event-driven integrations</p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Get real-time callbacks when components are created, shipments update, or recalls are issued.
                                </p>
                            </div>
                            <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition" />
                        </Link>
                        <a href="mailto:mridul@solsutara.com?subject=Early API key access"
                            className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Request early access</p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Enterprise and design partners can get early access — reach out and we&apos;ll set you up.
                                </p>
                            </div>
                            <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition" />
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
