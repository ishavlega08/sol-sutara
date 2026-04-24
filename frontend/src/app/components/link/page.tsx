"use client";

import { useState } from "react";
import { ArrowDown, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { linkComponents } from "@/lib/api";
import type { ComponentLink } from "@/types/link";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import ActionButton from "@/components/ui/ActionButton";

type Status = "idle" | "loading" | "success" | "error";

const RECENT_LINKS = [
  { parent: "SP-01", child: "CM-24", qty: "840 kg",   org: "org:aster",    when: "2h ago" },
  { parent: "CM-18", child: "AS-07", qty: "48 units", org: "org:meridian", when: "4h" },
  { parent: "CM-31", child: "AS-09", qty: "32 units", org: "org:meridian", when: "6h" },
];

function NodeInput({ label, value, onChange, hint, color, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  hint: string; color: string; disabled?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: color }}>
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
          className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder={hint} />
      </div>
      <p className="mt-2 pl-8 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
    </div>
  );
}

export default function LinkComponentsPage() {
  const [parentVal, setParentVal] = useState("SP-02 · Cobalt DRC batch 881");
  const [childVal, setChildVal]   = useState("CM-18 · Cathode B-18");
  const [qty, setQty]             = useState("");
  const [status, setStatus]       = useState<Status>("idle");
  const [result, setResult]       = useState<ComponentLink | null>(null);
  const [errorMsg, setErrorMsg]   = useState("");

  const parentId = parentVal.split("·")[0].trim() || "SP-02";
  const childId  = childVal.split("·")[0].trim() || "CM-18";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parentVal.trim() || !childVal.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const pId = parentId.replace(/[^a-zA-Z0-9-]/g, "");
      const cId = childId.replace(/[^a-zA-Z0-9-]/g, "");
      const res = await linkComponents({ parentId: pId, childId: cId });
      setResult(res.link);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function reset() {
    setParentVal("SP-02 · Cobalt DRC batch 881");
    setChildVal("CM-18 · Cathode B-18");
    setQty(""); setStatus("idle"); setResult(null); setErrorMsg("");
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">

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

        {/* Two-column layout on md+ */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_300px]">

          {/* Left: form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <NodeInput label="Parent component" value={parentVal} onChange={setParentVal}
              hint="Search by component ID or name · org:kaldera" color="#7c3aed" disabled={status === "loading"} />

            <div className="flex justify-center py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-50">
                <ArrowDown className="h-4 w-4 text-emerald-500" />
              </div>
            </div>

            <NodeInput label="Child component" value={childVal} onChange={setChildVal}
              hint="Search by component ID or name · org:meridian" color="#3b82f6" disabled={status === "loading"} />

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
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
{`› LINK ${parentId} → ${childId}${qty ? ` / ${qty}` : ""}
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
                disabled={status === "loading" || !parentVal.trim() || !childVal.trim()}
                className="flex-1">
                {status === "loading" ? "Signing…" : "Confirm & sign on-chain →"}
              </ActionButton>
            </div>
          </form>

          {/* Right: preview panel */}
          <div className="flex flex-col gap-4">
            <SectionCard title="Preview">
              <div className="flex flex-col items-center gap-0 py-3">
                <div className="flex w-full max-w-[180px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                  <span className="truncate text-xs font-semibold text-gray-800">{parentId}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="my-1 h-5 border-l-2 border-dashed border-gray-300" />
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                    <ArrowDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="my-1 h-5 border-l-2 border-dashed border-gray-300" />
                </div>
                <div className="flex w-full max-w-[180px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  <span className="truncate text-xs font-semibold text-gray-800">{childId}</span>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-gray-400">
                A new edge will be appended to the graph and signed by both orgs.
              </p>
            </SectionCard>

            <SectionCard title="Recent links" noPadding>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left">
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Parent → Child</th>
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Qty</th>
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">When</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_LINKS.map((l, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2">
                        <span className="font-mono text-violet-600">{l.parent}</span>
                        <span className="text-gray-400"> → </span>
                        <span className="font-mono text-blue-600">{l.child}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{l.qty}</td>
                      <td className="px-3 py-2 text-gray-400 dark:text-gray-500">{l.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          </div>

        </div>
      </div>
    </div>
  );
}
