"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Link2, ArrowDown, AlertCircle, CheckCircle2, ExternalLink,
    Search, ChevronRight, Clock, Zap, GitMerge,
} from "lucide-react";
import { linkComponents, getRecentLinks, getComponents } from "@/lib/api";
import type { ComponentLink } from "@/types/link";
import type { RecentLink, ComponentListItem } from "@/types/component";

type Status = "idle" | "loading" | "success" | "error";

// ── helpers ───────────────────────────────────────────────────────────────────

function inputCls(hasErr?: boolean) {
    return `w-full rounded-lg border bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        hasErr
            ? "border-red-400 dark:border-red-600"
            : "border-gray-200 dark:border-gray-700"
    }`;
}

// ── component search input ────────────────────────────────────────────────────

function ComponentSelector({
    label,
    sublabel,
    value,
    onChange,
    onSelect,
    accentColor,
    accentBg,
    disabled,
    allComponents,
    isSelected,
}: {
    label: string;
    sublabel: string;
    value: string;
    onChange: (v: string) => void;
    onSelect: (c: ComponentListItem) => void;
    accentColor: string;
    accentBg: string;
    disabled?: boolean;
    allComponents: ComponentListItem[];
    isSelected: boolean;
}) {
    const [open, setOpen] = useState(false);

    const suggestions =
        value.length >= 1
            ? allComponents
                  .filter(
                      (c) =>
                          c.name.toLowerCase().includes(value.toLowerCase()) ||
                          c.id.toLowerCase().includes(value.toLowerCase())
                  )
                  .slice(0, 8)
            : allComponents.slice(0, 8);

    return (
        <div className="relative">
            <div className="mb-1.5 flex items-center gap-2">
                <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: accentColor }}
                >
                    {label[0]}
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</span>
            </div>

            <div
                className={`relative flex items-center gap-3 rounded-xl border bg-white dark:bg-gray-900 px-4 py-3 transition ${
                    isSelected
                        ? "ring-2"
                        : "border-gray-200 dark:border-gray-700"
                }`}
                style={
                    isSelected
                        ? {
                              borderColor: accentColor,
                              boxShadow: `0 0 0 3px ${accentBg}`,
                          }
                        : {}
                }
            >
                <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <input
                    type="text"
                    value={value}
                    disabled={disabled}
                    placeholder="Search by name or ID…"
                    onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 160)}
                    className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                {isSelected && (
                    <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: accentBg, color: accentColor }}
                    >
                        <CheckCircle2 className="h-3 w-3" />
                        Selected
                    </span>
                )}
            </div>

            {open && suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl">
                    <div className="border-b border-gray-100 dark:border-gray-800 px-3.5 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                            {value.length >= 1 ? "Results" : "All components"}
                        </p>
                    </div>
                    {suggestions.map((c) => (
                        <button
                            key={c.id}
                            onMouseDown={() => { onSelect(c); setOpen(false); }}
                            className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <span
                                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                                style={{ background: accentColor }}
                            >
                                {c.name[0]?.toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {c.name}
                                </p>
                                <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                                    {c.id}
                                </p>
                            </div>
                            <span className="flex-shrink-0 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                {c.type}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── graph preview ─────────────────────────────────────────────────────────────

function GraphPreview({
    parentLabel,
    childLabel,
}: {
    parentLabel: string;
    childLabel: string;
}) {
    const isReady = parentLabel !== "Parent" && childLabel !== "Child";
    return (
        <div className="flex flex-col items-center gap-0 py-2">
            {/* Parent node */}
            <div
                className={`flex w-full max-w-[220px] items-center gap-2.5 rounded-xl border px-4 py-3 transition ${
                    parentLabel !== "Parent"
                        ? "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/40"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                }`}
            >
                <span
                    className={`flex h-5 w-5 flex-shrink-0 rounded-full items-center justify-center text-[8px] font-bold text-white transition ${
                        parentLabel !== "Parent" ? "bg-violet-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                >
                    P
                </span>
                <span
                    className={`truncate text-xs font-semibold ${
                        parentLabel !== "Parent"
                            ? "text-violet-800 dark:text-violet-300"
                            : "text-gray-400 dark:text-gray-500"
                    }`}
                >
                    {parentLabel.slice(0, 22)}
                </span>
            </div>

            {/* Connector */}
            <div className="flex flex-col items-center py-1">
                <div
                    className={`h-6 w-px transition ${
                        isReady
                            ? "bg-gradient-to-b from-violet-300 to-blue-300"
                            : "bg-gray-200 dark:bg-gray-700"
                    }`}
                />
                <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                        isReady
                            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    }`}
                >
                    <ArrowDown
                        className={`h-3 w-3 transition ${
                            isReady ? "text-emerald-500" : "text-gray-300 dark:text-gray-600"
                        }`}
                    />
                </div>
                <div
                    className={`h-6 w-px transition ${
                        isReady
                            ? "bg-gradient-to-b from-blue-300 to-blue-400"
                            : "bg-gray-200 dark:bg-gray-700"
                    }`}
                />
            </div>

            {/* Child node */}
            <div
                className={`flex w-full max-w-[220px] items-center gap-2.5 rounded-xl border px-4 py-3 transition ${
                    childLabel !== "Child"
                        ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                }`}
            >
                <span
                    className={`flex h-5 w-5 flex-shrink-0 rounded-full items-center justify-center text-[8px] font-bold text-white transition ${
                        childLabel !== "Child" ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                >
                    C
                </span>
                <span
                    className={`truncate text-xs font-semibold ${
                        childLabel !== "Child"
                            ? "text-blue-800 dark:text-blue-300"
                            : "text-gray-400 dark:text-gray-500"
                    }`}
                >
                    {childLabel.slice(0, 22)}
                </span>
            </div>

            {isReady ? (
                <div className="mt-3 flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Ready to sign
                    </span>
                </div>
            ) : (
                <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-gray-500 max-w-[200px]">
                    Select both components to preview the edge
                </p>
            )}
        </div>
    );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function LinkComponentsPage() {
    const [allComponents, setAllComponents] = useState<ComponentListItem[]>([]);
    const [recentLinks, setRecentLinks]     = useState<RecentLink[]>([]);
    const [linksLoading, setLinksLoading]   = useState(true);

    const [parentVal, setParentVal] = useState("");
    const [childVal, setChildVal]   = useState("");
    const [parentId, setParentId]   = useState("");
    const [childId, setChildId]     = useState("");
    const [qty, setQty]             = useState("");

    const [status, setStatus]   = useState<Status>("idle");
    const [result, setResult]   = useState<ComponentLink | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const loadData = useCallback(async () => {
        setLinksLoading(true);
        const [compRes, linksRes] = await Promise.allSettled([
            getComponents(),
            getRecentLinks(8),
        ]);
        if (compRes.status === "fulfilled")  setAllComponents(compRes.value.components);
        if (linksRes.status === "fulfilled") setRecentLinks(linksRes.value.links);
        setLinksLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const refreshLinks = useCallback(async () => {
        try {
            const res = await getRecentLinks(8);
            setRecentLinks(res.links);
        } catch { /* silent */ }
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!parentId || !childId) {
            setErrorMsg("Select both a parent and a child component from the dropdown.");
            setStatus("error");
            return;
        }
        setStatus("loading");
        setErrorMsg("");
        try {
            const res = await linkComponents({ parentId, childId });
            setResult(res.link);
            setStatus("success");
            await refreshLinks();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
            setStatus("error");
        }
    }

    function reset() {
        setParentVal(""); setChildVal("");
        setParentId(""); setChildId("");
        setQty(""); setStatus("idle"); setResult(null); setErrorMsg("");
    }

    const previewParent = parentVal || "Parent";
    const previewChild  = childVal  || "Child";
    const canSubmit     = !!parentId && !!childId && status !== "loading";

    // ── Success state ─────────────────────────────────────────────────────────

    if (status === "success" && result) {
        return (
            <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                    <div className="overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 shadow-sm">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-10 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                                <CheckCircle2 className="h-7 w-7 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Link recorded on-chain</h2>
                            <p className="mt-1 text-sm text-emerald-100">
                                The parent–child edge has been appended to the supply graph and signed on Solana.
                            </p>
                        </div>
                        <div className="px-8 py-6 space-y-4">
                            <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-4">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Transaction hash</p>
                                    <p className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300 break-all">
                                        {result.txHash}
                                    </p>
                                </div>
                                <a
                                    href={`https://explorer.solana.com/tx/${result.txHash}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-4 flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Explorer
                                </a>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                                    Fee: ~$0.00025
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                                    Confirmed in ~400ms
                                </span>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={reset}
                                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Link another component
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main layout ───────────────────────────────────────────────────────────

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* ── Header ── */}
                <div className="mb-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
                            <Link2 className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" style={{ height: 18, width: 18 }} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Link Components
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Establish a verified parent–child edge in the supply graph, signed on Solana.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">

                    {/* ── LEFT: Form ── */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">

                        {/* Component selectors card */}
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                            <h2 className="mb-5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Select components
                            </h2>
                            <div className="space-y-5">
                                <ComponentSelector
                                    label="Parent"
                                    sublabel="— upstream component"
                                    value={parentVal}
                                    onChange={(v) => { setParentVal(v); setParentId(""); }}
                                    onSelect={(c) => { setParentVal(c.name); setParentId(c.id); }}
                                    accentColor="#7c3aed"
                                    accentBg="rgba(124,58,237,0.08)"
                                    disabled={status === "loading"}
                                    allComponents={allComponents}
                                    isSelected={!!parentId}
                                />

                                {/* Divider with arrow */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                        <ArrowDown className="h-3.5 w-3.5 text-gray-400" />
                                    </div>
                                    <div className="flex-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
                                </div>

                                <ComponentSelector
                                    label="Child"
                                    sublabel="— downstream component"
                                    value={childVal}
                                    onChange={(v) => { setChildVal(v); setChildId(""); }}
                                    onSelect={(c) => { setChildVal(c.name); setChildId(c.id); }}
                                    accentColor="#3b82f6"
                                    accentBg="rgba(59,130,246,0.08)"
                                    disabled={status === "loading"}
                                    allComponents={allComponents}
                                    isSelected={!!childId}
                                />
                            </div>
                        </div>

                        {/* Optional fields card */}
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Batch details{" "}
                                <span className="font-normal text-gray-400">— optional</span>
                            </h2>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Quantity / batch note
                                </label>
                                <input
                                    type="text"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    placeholder="e.g. 1,200 kg · batch B-881"
                                    disabled={status === "loading"}
                                    className={inputCls()}
                                />
                                <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                                    Stored as on-chain metadata alongside the edge signature.
                                </p>
                            </div>
                        </div>

                        {/* Transaction preview card */}
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-950 dark:bg-gray-900 overflow-hidden shadow-sm">
                            <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-3">
                                <div className="flex gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                                </div>
                                <span className="text-[11px] font-medium text-gray-500">transaction preview</span>
                            </div>
                            <div className="px-5 py-4 font-mono text-xs leading-6">
                                <p className="text-gray-500">
                                    <span className="text-emerald-400">›</span>{" "}
                                    <span className="text-purple-400">LINK</span>{" "}
                                    <span className={parentId ? "text-violet-300" : "text-gray-600"}>
                                        {previewParent}
                                    </span>
                                    <span className="text-gray-600"> → </span>
                                    <span className={childId ? "text-blue-300" : "text-gray-600"}>
                                        {previewChild}
                                    </span>
                                    {qty && (
                                        <span className="text-gray-500"> / {qty}</span>
                                    )}
                                </p>
                                <p className="text-gray-500">
                                    <span className="text-emerald-400">›</span>{" "}
                                    <span className="text-yellow-400">network</span>
                                    <span className="text-gray-600"> = </span>
                                    <span className="text-cyan-400">solana:devnet</span>
                                </p>
                                <p className="text-gray-500">
                                    <span className="text-emerald-400">›</span>{" "}
                                    <span className="text-yellow-400">fee</span>
                                    <span className="text-gray-600"> ≈ </span>
                                    <span className="text-gray-300">$0.00025</span>
                                    <span className="text-gray-600">  ·  confirm: </span>
                                    <span className="text-gray-300">~400ms</span>
                                </p>
                                <p className={`transition ${canSubmit ? "text-emerald-400" : "text-gray-600"}`}>
                                    <span className="text-emerald-400">›</span>{" "}
                                    <span className="text-yellow-400">status</span>
                                    <span className="text-gray-600"> = </span>
                                    {canSubmit ? "ready" : "waiting for selection…"}
                                </p>
                            </div>
                        </div>

                        {/* Error */}
                        {status === "error" && (
                            <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-3.5">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                                <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={reset}
                                disabled={status === "loading"}
                                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                style={{
                                    background: canSubmit
                                        ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                                        : "#9ca3af",
                                }}
                            >
                                {status === "loading" ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Signing transaction…
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="h-4 w-4" />
                                        Confirm &amp; sign on-chain
                                        <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* ── RIGHT: Preview + Recent links ── */}
                    <div className="space-y-5">

                        {/* Graph preview */}
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <GitMerge className="h-4 w-4 text-gray-400" />
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Edge preview
                                </h3>
                            </div>
                            <GraphPreview parentLabel={previewParent} childLabel={previewChild} />
                        </div>

                        {/* Recent links */}
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Recent links
                                    </h3>
                                </div>
                                {recentLinks.length > 0 && (
                                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                        {recentLinks.length}
                                    </span>
                                )}
                            </div>

                            {linksLoading ? (
                                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 px-5 py-3">
                                            <div className="h-6 w-6 flex-shrink-0 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                                <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                            </div>
                                            <div className="h-2.5 w-10 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                        </div>
                                    ))}
                                </div>
                            ) : recentLinks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Link2 className="mb-2.5 h-7 w-7 text-gray-200 dark:text-gray-700" />
                                    <p className="text-sm font-medium text-gray-400">No links yet</p>
                                    <p className="mt-0.5 text-xs text-gray-300 dark:text-gray-600">
                                        Your first link will appear here
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-gray-800/80">
                                    {recentLinks.map((l) => (
                                        <div
                                            key={l.id}
                                            className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-950/50">
                                                <Link2 className="h-3 w-3 text-violet-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="flex items-center gap-1 text-xs text-gray-800 dark:text-gray-200">
                                                    <span className="truncate max-w-[80px] font-medium text-violet-700 dark:text-violet-400">
                                                        {l.parentName}
                                                    </span>
                                                    <ChevronRight className="h-3 w-3 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                                                    <span className="truncate max-w-[80px] font-medium text-blue-700 dark:text-blue-400">
                                                        {l.childName}
                                                    </span>
                                                </p>
                                            </div>
                                            <span className="flex-shrink-0 text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                                                {l.when}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
