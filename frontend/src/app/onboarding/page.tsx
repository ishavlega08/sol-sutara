"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createOrg, joinOrg, getInviteDetails } from "@/lib/api/orgs";
import type { InviteDetails } from "@/lib/api/orgs";
import Logo from "@/components/Logo";
import { apiRefresh } from "@/lib/api/auth";
import type { AuthUser, AuthOrg } from "@/context/AuthContext";

type Tab = "create" | "join";

const ROLE_LABEL: Record<string, string> = {
    OWNER:  "Owner",
    ADMIN:  "Admin",
    MEMBER: "Member",
    VIEWER: "Viewer",
};

function slugPreview(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || "";
}

function extractToken(raw: string): string {
    const trimmed = raw.trim();
    // Support full invite URLs: /orgs/invite/<token> or /invite/<token>
    const match = trimmed.match(/(?:invite|join)[\/=]([a-f0-9]{64})/i);
    if (match) return match[1]!;
    // Bare 64-char hex token
    if (/^[a-f0-9]{64}$/i.test(trimmed)) return trimmed;
    // Last path segment fallback
    return trimmed.split("/").pop() ?? trimmed;
}

function inputCls(hasErr?: boolean) {
    return `w-full rounded-lg border bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-violet-400 focus:ring-1 focus:ring-violet-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${hasErr ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`;
}

export default function OnboardingPage() {
    const { isAuthenticated, isLoading, hasOrg, user, setSession } = useAuth();
    const router = useRouter();

    const [tab,           setTab]           = useState<Tab>("create");
    const [orgName,       setOrgName]       = useState("");
    const [token,         setToken]         = useState("");
    const [error,         setError]         = useState("");
    const [busy,          setBusy]          = useState(false);
    const [invitePreview, setInvitePreview] = useState<InviteDetails | null>(null);
    const [previewState,  setPreviewState]  = useState<"idle" | "loading" | "found" | "error">("idle");

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) router.replace("/login");
        if (hasOrg)           router.replace("/components");
    }, [isAuthenticated, isLoading, hasOrg, router]);

    // Auto-fetch invite details when token input changes
    const fetchInvitePreview = useCallback(async (raw: string) => {
        const extracted = extractToken(raw);
        if (!extracted || extracted.length < 10) {
            setInvitePreview(null);
            setPreviewState("idle");
            return;
        }

        setPreviewState("loading");
        try {
            const { invite } = await getInviteDetails(extracted);
            setInvitePreview(invite);
            setPreviewState("found");
            setError("");
        } catch {
            setInvitePreview(null);
            setPreviewState("error");
        }
    }, []);

    useEffect(() => {
        if (tab !== "join") return;
        const timer = setTimeout(() => fetchInvitePreview(token), 500);
        return () => clearTimeout(timer);
    }, [token, tab, fetchInvitePreview]);

    async function refreshAndNavigate(orgId: string, orgName: string) {
        try {
            const { user: u, org: o, hasOrg: h, role: r } = await apiRefresh();
            setSession(u, h, o, r);
        } catch {
            setSession(user as AuthUser, true, { id: orgId, name: orgName } as AuthOrg, "OWNER");
        }
        router.replace("/components");
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!orgName.trim()) { setError("Organization name is required"); return; }
        setBusy(true);
        setError("");
        try {
            const { org } = await createOrg(orgName.trim());
            await refreshAndNavigate(org.id, org.name);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create organization");
        } finally {
            setBusy(false);
        }
    }

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        const inviteToken = extractToken(token);
        if (!inviteToken) { setError("Invite link or token is required"); return; }
        setBusy(true);
        setError("");
        try {
            const { org } = await joinOrg(inviteToken);
            await refreshAndNavigate(org.id, org.name);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid or expired invite");
        } finally {
            setBusy(false);
        }
    }

    if (isLoading) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
            <div className="w-full max-w-md">

                {/* Brand */}
                <div className="mb-8 flex flex-col items-center gap-2 text-center">
                    <div className="flex items-center gap-2">
                        <Logo size={30} />
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Sol Sutara</span>
                    </div>
                    <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Set up your workspace</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create a new organization or join an existing one.
                    </p>
                </div>

                {/* Tab selector */}
                <div className="mb-4 flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1">
                    {([
                        { key: "create", label: "Create organization", icon: Building2 },
                        { key: "join",   label: "Join via invite",      icon: Users    },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => { setTab(key); setError(""); setInvitePreview(null); setPreviewState("idle"); }}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                                tab === key
                                    ? "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 shadow-sm"
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
                            <div className="mb-5">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    Organization name
                                </label>
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => { setOrgName(e.target.value); setError(""); }}
                                    placeholder="e.g. Meridian EV"
                                    autoFocus
                                    disabled={busy}
                                    className={inputCls(!!error)}
                                />
                                {orgName && (
                                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                                        Slug: <span className="font-mono text-gray-600 dark:text-gray-400">{slugPreview(orgName)}</span>
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-2.5">
                                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={busy || !orgName.trim()}
                                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                            >
                                {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</> : "Create organization →"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleJoin} noValidate>
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    Invite link or token
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={token}
                                        onChange={(e) => { setToken(e.target.value); setError(""); }}
                                        placeholder="Paste invite link or token"
                                        autoFocus
                                        disabled={busy}
                                        className={inputCls(!!error)}
                                    />
                                    {previewState === "loading" && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                                    Ask your organization owner to generate an invite link from Settings → Members.
                                </p>
                            </div>

                            {/* Invite preview card */}
                            {previewState === "found" && invitePreview && (
                                <div className="mb-4 overflow-hidden rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950">
                                    <div className="flex items-center gap-1.5 border-b border-violet-100 dark:border-violet-900 px-3 py-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />
                                        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Valid invite found</span>
                                    </div>
                                    <div className="px-3 py-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Organization</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{invitePreview.orgName}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Invited by</span>
                                            <span className="text-xs text-gray-700 dark:text-gray-300">{invitePreview.inviterEmail ?? "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Your role</span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                                                {ROLE_LABEL[invitePreview.role] ?? invitePreview.role}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Expires</span>
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <Clock className="h-3 w-3" />
                                                {new Date(invitePreview.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewState === "error" && token.trim().length > 10 && (
                                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-3 py-2.5">
                                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                                    <p className="text-xs text-amber-700 dark:text-amber-400">Invite not found or already used — double-check the link.</p>
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-2.5">
                                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={busy || !token.trim()}
                                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                            >
                                {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Joining…</> : "Accept invite →"}
                            </button>
                        </form>
                    )}
                </div>

                <p className="mt-5 text-center text-xs text-gray-400">
                    Need help?{" "}
                    <a href="mailto:mridul@solsutara.com" className="text-violet-500 hover:underline underline-offset-2">
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    );
}
