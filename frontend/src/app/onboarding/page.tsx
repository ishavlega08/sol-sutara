"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createOrg, joinOrg } from "@/lib/api/orgs";
import type { AuthUser, AuthOrg } from "@/context/AuthContext";

type Tab = "create" | "join";

function slugPreview(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || "";
}

function inputCls(err?: string) {
    return `w-full rounded-md border bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-violet-400 focus:ring-1 focus:ring-violet-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${err ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`;
}

export default function OnboardingPage() {
    const { isAuthenticated, isLoading, hasOrg, user, setSession } = useAuth();
    const router = useRouter();

    const [tab,     setTab]     = useState<Tab>("create");
    const [orgName, setOrgName] = useState("");
    const [token,   setToken]   = useState("");
    const [error,   setError]   = useState("");
    const [busy,    setBusy]    = useState(false);

    // Redirect if already has org or not authenticated
    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) router.replace("/login");
        if (hasOrg)           router.replace("/components");
    }, [isAuthenticated, isLoading, hasOrg, router]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!orgName.trim()) { setError("Organization name is required"); return; }
        setBusy(true);
        setError("");
        try {
            const { org } = await createOrg(orgName.trim());
            setSession(user as AuthUser, true, { id: org.id, name: org.name } as AuthOrg);
            router.replace("/components");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create organization");
        } finally {
            setBusy(false);
        }
    }

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        const inviteToken = token.trim().split("/").pop() ?? "";
        if (!inviteToken) { setError("Invite token is required"); return; }
        setBusy(true);
        setError("");
        try {
            const { org } = await joinOrg(inviteToken);
            setSession(user as AuthUser, true, { id: org.id, name: org.name } as AuthOrg);
            router.replace("/components");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid or expired invite");
        } finally {
            setBusy(false);
        }
    }

    if (isLoading) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="w-full max-w-md">

                {/* Brand */}
                <div className="mb-8 flex flex-col items-center gap-2 text-center">
                    <div className="flex items-center gap-2">
                        <svg viewBox="0 0 14 14" className="h-6 w-6" fill="none">
                            <path d="M7 1L13 12H1L7 1Z" fill="currentColor" className="text-gray-900 dark:text-gray-100" />
                        </svg>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Sol Sutara</span>
                    </div>
                    <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Set up your workspace</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create a new organization or join an existing one.
                    </p>
                </div>

                {/* Tab selector */}
                <div className="mb-4 flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1">
                    {([
                        { key: "create", label: "Create organization", icon: Building2 },
                        { key: "join",   label: "Join via invite",      icon: Users    },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => { setTab(key); setError(""); }}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition ${
                                tab === key
                                    ? "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Panel */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                    {tab === "create" ? (
                        <form onSubmit={handleCreate} noValidate>
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    Organization name
                                </label>
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => { setOrgName(e.target.value); setError(""); }}
                                    placeholder="e.g. Meridian EV"
                                    disabled={busy}
                                    className={inputCls(error)}
                                />
                                {orgName && (
                                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                                        Slug: <span className="font-mono text-gray-600 dark:text-gray-400">{slugPreview(orgName)}</span>
                                    </p>
                                )}
                            </div>

                            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

                            <button
                                type="submit"
                                disabled={busy || !orgName.trim()}
                                className="w-full rounded-md py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                            >
                                {busy ? "Creating…" : "Create organization →"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleJoin} noValidate>
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    Invite link or token
                                </label>
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => { setToken(e.target.value); setError(""); }}
                                    placeholder="Paste invite link or token"
                                    disabled={busy}
                                    className={inputCls(error)}
                                />
                                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                                    Ask your organization owner to generate an invite link.
                                </p>
                            </div>

                            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

                            <button
                                type="submit"
                                disabled={busy || !token.trim()}
                                className="w-full rounded-md py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                            >
                                {busy ? "Joining…" : "Accept invite →"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
