"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDown, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { linkComponents, getRecentLinks, getComponents } from "@/lib/api";
import type { ComponentLink } from "@/types/link";
import type { RecentLink, ComponentListItem } from "@/types/component";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import ActionButton from "@/components/ui/ActionButton";

type Status = "idle" | "loading" | "success" | "error";

// ── searchable component input ────────────────────────────────────────────────

function ComponentInput({
  label, value, onChange, color, disabled, allComponents,
  onSelect,
}: {
  label: string; value: string; onChange: (v: string) => void;
  color: string; disabled?: boolean;
  allComponents: ComponentListItem[];
  onSelect: (c: ComponentListItem) => void;
}) {
  const [show, setShow] = useState(false);
  const suggestions = value.length >= 2
    ? allComponents
        .filter((c) =>
          c.name.toLowerCase().includes(value.toLowerCase()) ||
          c.id.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: color }}>
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
        <input
          type="text" value={value} disabled={disabled}
          onChange={(e) => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 150)}
          className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="Search by name or ID…"
        />
      </div>
      {show && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          {suggestions.map((c) => (
            <button key={c.id} onMouseDown={() => { onSelect(c); setShow(false); }}
              className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
              <span className="text-gray-800 dark:text-gray-200">{c.name}</span>
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{c.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function LinkComponentsPage() {
  const [allComponents, setAllComponents]   = useState<ComponentListItem[]>([]);
  const [recentLinks, setRecentLinks]       = useState<RecentLink[]>([]);
  const [linksLoading, setLinksLoading]     = useState(true);

  const [parentVal, setParentVal]   = useState("");
  const [childVal, setChildVal]     = useState("");
  const [parentId, setParentId]     = useState("");
  const [childId, setChildId]       = useState("");
  const [qty, setQty]               = useState("");
  const [status, setStatus]         = useState<Status>("idle");
  const [result, setResult]         = useState<ComponentLink | null>(null);
  const [errorMsg, setErrorMsg]     = useState("");

  const loadData = useCallback(async () => {
    setLinksLoading(true);
    const [compRes, linksRes] = await Promise.allSettled([getComponents(), getRecentLinks(5)]);
    if (compRes.status === "fulfilled")  setAllComponents(compRes.value.components);
    if (linksRes.status === "fulfilled") setRecentLinks(linksRes.value.links);
    setLinksLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // refresh recent links after a successful link
  const refreshLinks = useCallback(async () => {
    try {
      const res = await getRecentLinks(5);
      setRecentLinks(res.links);
    } catch { /* silent */ }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parentId || !childId) {
      setErrorMsg("Please select both a parent and child component from the suggestions.");
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

  const previewParent = parentVal || parentId || "Parent";
  const previewChild  = childVal  || childId  || "Child";

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        <PageHeader title="Link Components" subtitle="Establish a supply chain relationship between two components on-chain." />

        {status === "success" && result && (
          <div className="mb-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-800">Link established on-chain</p>
              <a href={`https://explorer.solana.com/tx/${result.txHash}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-emerald-600 underline hover:text-emerald-800">
                View tx <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ActionButton variant="ghost" onClick={reset} className="w-fit">Link another</ActionButton>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_300px]">

          {/* Left: form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <ComponentInput
              label="Parent component"
              value={parentVal}
              onChange={(v) => { setParentVal(v); setParentId(""); }}
              onSelect={(c) => { setParentVal(c.name); setParentId(c.id); }}
              color="#7c3aed"
              disabled={status === "loading"}
              allComponents={allComponents}
            />

            <div className="flex justify-center py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-50">
                <ArrowDown className="h-4 w-4 text-emerald-500" />
              </div>
            </div>

            <ComponentInput
              label="Child component"
              value={childVal}
              onChange={(v) => { setChildVal(v); setChildId(""); }}
              onSelect={(c) => { setChildVal(c.name); setChildId(c.id); }}
              color="#3b82f6"
              disabled={status === "loading"}
              allComponents={allComponents}
            />

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Quantity / batch note <span className="text-gray-400">(optional)</span>
              </label>
              <input type="text" value={qty} onChange={(e) => setQty(e.target.value)}
                placeholder="1,200 kg · batch 881" disabled={status === "loading"}
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
            </div>

            {/* Transaction preview */}
            <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Transaction preview</p>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-600 dark:text-gray-400">
{`› LINK ${previewParent} → ${previewChild}${qty ? ` / ${qty}` : ""}
› fee: ~$0.00025 · confirm: 400ms`}
              </pre>
            </div>

            {status === "error" && (
              <div className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <ActionButton type="button" variant="ghost" onClick={reset} disabled={status === "loading"}>Cancel</ActionButton>
              <ActionButton type="submit" variant="gradient" loading={status === "loading"}
                disabled={status === "loading" || !parentId || !childId}
                className="flex-1">
                {status === "loading" ? "Signing…" : "Confirm & sign on-chain →"}
              </ActionButton>
            </div>
          </form>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            <SectionCard title="Preview">
              <div className="flex flex-col items-center gap-0 py-3">
                <div className="flex w-full max-w-[180px] items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                  <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{previewParent.slice(0, 18)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="my-1 h-5 border-l-2 border-dashed border-gray-300 dark:border-gray-600" />
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <ArrowDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="my-1 h-5 border-l-2 border-dashed border-gray-300 dark:border-gray-600" />
                </div>
                <div className="flex w-full max-w-[180px] items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{previewChild.slice(0, 18)}</span>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
                A new edge will be appended to the graph and signed on-chain.
              </p>
            </SectionCard>

            <SectionCard title="Recent links" noPadding>
              {linksLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-6 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                  ))}
                </div>
              ) : recentLinks.length === 0 ? (
                <p className="px-4 py-4 text-xs text-gray-400">No links yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left">
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Parent → Child</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLinks.map((l) => (
                      <tr key={l.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2">
                          <span className="font-medium text-violet-600 dark:text-violet-400 truncate block max-w-[100px]">{l.parentName}</span>
                          <span className="text-gray-400"> → </span>
                          <span className="font-medium text-blue-600 dark:text-blue-400 truncate block max-w-[100px]">{l.childName}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-400 dark:text-gray-500 whitespace-nowrap">{l.when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>
          </div>

        </div>
      </div>
    </div>
  );
}
