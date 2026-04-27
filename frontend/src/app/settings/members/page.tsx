"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Plus, Trash2, RefreshCw, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { getOrgMembers, createInvite, updateMemberRole, removeMember } from "@/lib/api/orgs";
import type { OrgMember } from "@/lib/api/orgs";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import ActionButton from "@/components/ui/ActionButton";

const ROLES     = ["ADMIN", "MEMBER", "VIEWER"] as const;
const ALL_ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
type Role = typeof ALL_ROLES[number];

const ROLE_LABEL: Record<Role, string>  = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member", VIEWER: "Viewer" };
const ROLE_COLOR: Record<Role, string>  = {
    OWNER:  "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    ADMIN:  "bg-blue-50   text-blue-700   dark:bg-blue-950   dark:text-blue-300",
    MEMBER: "bg-gray-100  text-gray-600   dark:bg-gray-800   dark:text-gray-400",
    VIEWER: "bg-gray-50   text-gray-500   dark:bg-gray-800   dark:text-gray-500",
};

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
    const [email, setEmail]   = useState("");
    const [role,  setRole]    = useState<typeof ROLES[number]>("MEMBER");
    const [link,  setLink]    = useState("");
    const [busy,  setBusy]    = useState(false);
    const [error, setError]   = useState("");
    const [copied, setCopied] = useState(false);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) { setError("Email is required"); return; }
        setBusy(true);
        setError("");
        try {
            const { invite } = await createInvite(orgId, email.trim(), role);
            const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
            setLink(`${base}/invite/${invite.token}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create invite");
        } finally {
            setBusy(false);
        }
    }

    function copyLink() {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Invite team member</h2>
                    <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {!link ? (
                    <form onSubmit={handleCreate} noValidate>
                        <div className="mb-3">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Email</label>
                            <input
                                type="email" value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                placeholder="teammate@company.com"
                                className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-400"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Role</label>
                            <div className="relative">
                                <select
                                    value={role} onChange={(e) => setRole(e.target.value as typeof ROLES[number])}
                                    className="w-full appearance-none rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-400"
                                >
                                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
                        <div className="flex justify-end gap-2">
                            <ActionButton variant="ghost" type="button" onClick={onClose}>Cancel</ActionButton>
                            <ActionButton variant="gradient" type="submit" loading={busy}>Generate invite link</ActionButton>
                        </div>
                    </form>
                ) : (
                    <div>
                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                            Share this link with <strong>{email}</strong>. It expires in 7 days.
                        </p>
                        <div className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                            <span className="flex-1 truncate font-mono text-xs text-gray-700 dark:text-gray-300">{link}</span>
                            <button onClick={copyLink} className="flex-shrink-0 text-gray-400 hover:text-violet-600 transition">
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        {copied && <p className="mt-1.5 text-xs text-emerald-600">Copied to clipboard!</p>}
                        <div className="mt-4 flex justify-end gap-2">
                            <ActionButton variant="ghost" onClick={() => { setLink(""); setEmail(""); }}>New invite</ActionButton>
                            <ActionButton variant="gradient" onClick={onClose}>Done</ActionButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MembersPage() {
    const { org, user }          = useAuth();
    const { canManage, isOwner } = useRole();

    const [members,     setMembers]     = useState<OrgMember[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [showInvite,  setShowInvite]  = useState(false);
    const [actionBusy,  setActionBusy]  = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!org?.id) return;
        setLoading(true);
        try {
            const { members: m } = await getOrgMembers(org.id);
            setMembers(m);
        } catch { /* handled silently */ } finally {
            setLoading(false);
        }
    }, [org?.id]);

    useEffect(() => { load(); }, [load]);

    async function handleRoleChange(userId: string, newRole: string) {
        if (!org?.id) return;
        setActionBusy(userId);
        try {
            await updateMemberRole(org.id, userId, newRole);
            await load();
        } catch { /* silent */ } finally {
            setActionBusy(null);
        }
    }

    async function handleRemove(userId: string) {
        if (!org?.id || !confirm("Remove this member?")) return;
        setActionBusy(userId);
        try {
            await removeMember(org.id, userId);
            await load();
        } catch { /* silent */ } finally {
            setActionBusy(null);
        }
    }

    return (
        <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                <PageHeader
                    title="Members"
                    subtitle={`${members.length} member${members.length !== 1 ? "s" : ""} in ${org?.name ?? "your organization"}`}
                    actions={
                        canManage ? (
                            <ActionButton variant="gradient" onClick={() => setShowInvite(true)}>
                                <Plus className="h-3.5 w-3.5" /> Invite member
                            </ActionButton>
                        ) : undefined
                    }
                />

                <SectionCard noPadding>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-left">
                                    {["Email", "Role", "Joined", ""].map((h) => (
                                        <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                                        {[60, 25, 30, 10].map((w, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3.5 animate-pulse rounded bg-gray-100 dark:bg-gray-700" style={{ width: `${w}%` }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                                {!loading && members.map((m) => {
                                    const isMe   = m.userId === user?.id;
                                    const r      = m.role as Role;
                                    const busy   = actionBusy === m.userId;
                                    const canEdit = isOwner && !isMe && r !== "OWNER";
                                    const canDel  = (isOwner && !isMe) || (canManage && !isMe && r !== "OWNER");

                                    return (
                                        <tr key={m.userId} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                            <td className="px-4 py-3">
                                                <span className="text-gray-800 dark:text-gray-200">{m.email ?? "—"}</span>
                                                {isMe && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {canEdit ? (
                                                    <div className="relative inline-block">
                                                        <select
                                                            value={r}
                                                            disabled={busy}
                                                            onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                                                            className={`appearance-none rounded-full border-0 py-0.5 pl-2 pr-6 text-[11px] font-semibold outline-none ${ROLE_COLOR[r]}`}
                                                        >
                                                            {ROLES.map((ro) => <option key={ro} value={ro}>{ROLE_LABEL[ro]}</option>)}
                                                        </select>
                                                        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 opacity-60" />
                                                    </div>
                                                ) : (
                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLOR[r]}`}>
                                                        {ROLE_LABEL[r]}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 dark:text-gray-500">
                                                {new Date(m.joinedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {canDel && (
                                                    <button
                                                        disabled={busy}
                                                        onClick={() => handleRemove(m.userId)}
                                                        className="rounded-md p-1 text-gray-300 dark:text-gray-600 transition hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {!loading && members.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-sm text-gray-400">
                                            No members yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>

                {/* Refresh */}
                <div className="mt-3 flex justify-end">
                    <button
                        onClick={() => load()}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    >
                        <RefreshCw className="h-3 w-3" /> Refresh
                    </button>
                </div>
            </div>

            {showInvite && org && (
                <InviteModal orgId={org.id} onClose={() => { setShowInvite(false); load(); }} />
            )}
        </div>
    );
}
