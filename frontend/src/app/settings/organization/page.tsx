"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Copy, Check, Loader2, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { getOrgById, updateOrg } from "@/lib/api/orgs";
import type { OrgDetails } from "@/lib/api/orgs";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import ActionButton from "@/components/ui/ActionButton";

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    function copy() {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    return (
        <button onClick={copy} className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                {label}
            </p>
            <div className="flex items-center gap-1.5">
                <p className={`text-sm text-gray-800 dark:text-gray-200 ${mono ? "font-mono" : ""}`}>
                    {value || "—"}
                </p>
                {value && mono && <CopyButton text={value} />}
            </div>
        </div>
    );
}

export default function OrganizationSettingsPage() {
    const { org } = useAuth();
    const { isOwner } = useRole();

    const [details, setDetails]   = useState<OrgDetails | null>(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);

    // Edit name state
    const [editing, setEditing]   = useState(false);
    const [newName, setNewName]   = useState("");
    const [saving, setSaving]     = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!org?.id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getOrgById(org.id);
            setDetails(res.org);
            setNewName(res.org.name);
        } catch {
            setError("Failed to load organization details");
        } finally {
            setLoading(false);
        }
    }, [org?.id]);

    useEffect(() => { load(); }, [load]);

    async function handleSaveName() {
        if (!org?.id || !newName.trim()) return;
        setSaving(true);
        setSaveError(null);
        try {
            await updateOrg(org.id, newName.trim());
            await load();
            setEditing(false);
        } catch {
            setSaveError("Failed to update org name");
        } finally {
            setSaving(false);
        }
    }

    function orgInitials(name: string) {
        return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

                <PageHeader
                    title="Organization"
                    subtitle={<span>Workspace settings and identifiers</span>}
                    actions={
                        <ActionButton variant="ghost" onClick={load} disabled={loading}>
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </ActionButton>
                    }
                />

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                    {/* Left — main details */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Identity card */}
                        <SectionCard title="Identity">
                            {loading ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="space-y-1.5">
                                            <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                            <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    {/* Name with edit */}
                                    <div className="sm:col-span-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                                            Organization name
                                        </p>
                                        {editing ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    className="flex-1 rounded-md border border-violet-400 dark:border-violet-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-violet-400"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleSaveName}
                                                    disabled={saving || !newName.trim()}
                                                    className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                                    Save
                                                </button>
                                                <button onClick={() => { setEditing(false); setNewName(details?.name ?? ""); }}
                                                    className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{details?.name}</p>
                                                {isOwner && (
                                                    <button onClick={() => setEditing(true)}
                                                        className="text-xs text-violet-600 hover:underline underline-offset-2">
                                                        Edit
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {saveError && <p className="mt-1 text-xs text-red-500">{saveError}</p>}
                                    </div>
                                    <Field label="Org ID"   value={details?.id}   mono />
                                    <Field label="Slug"     value={details?.slug} mono />
                                    <Field label="Created"  value={details?.createdAt ? new Date(details.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : undefined} />
                                    <Field label="Plan"     value={details?.plan ?? "SANDBOX"} />
                                </div>
                            )}
                        </SectionCard>

                        {/* Danger zone */}
                        <div className="overflow-hidden rounded-xl border border-red-200 dark:border-red-900">
                            <div className="border-b border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Danger zone</p>
                            </div>
                            <div className="flex items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Delete organization</p>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                        Permanently delete this workspace and all its data. This cannot be undone.
                                    </p>
                                </div>
                                <button
                                    disabled
                                    className="flex-shrink-0 rounded-md border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Contact support to delete your organization"
                                >
                                    Delete org
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right — avatar/summary */}
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div className="h-0.5 bg-gradient-to-r from-violet-500 to-violet-700" />
                            <div className="flex flex-col items-center gap-3 p-6 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                                    style={{ background: "#7c3aed" }}>
                                    {details ? orgInitials(details.name) : "—"}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                        {loading ? <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /> : details?.name}
                                    </p>
                                    <p className="mt-0.5 font-mono text-xs text-gray-400">
                                        {loading ? <span className="inline-block h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /> : details?.slug}
                                    </p>
                                </div>
                                <span className="rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                                    {details?.plan ?? "SANDBOX"}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Quick links</p>
                            <div className="space-y-1.5">
                                {[
                                    { label: "Team members",    href: "/settings/members" },
                                    { label: "Webhooks",        href: "/settings/webhooks" },
                                    { label: "Plans & billing", href: "/billing/plans" },
                                ].map((link) => (
                                    <a key={link.href} href={link.href}
                                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                        {link.label}
                                        <span className="text-gray-300 dark:text-gray-600">→</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
