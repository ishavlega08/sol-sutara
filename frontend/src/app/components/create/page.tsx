"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, ExternalLink, PlusCircle, Trash2 } from "lucide-react";
import { createComponent } from "@/lib/api";
import type { CreatedComponent } from "@/types/component";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import ActionButton from "@/components/ui/ActionButton";
import { TypeBadge } from "@/components/ui/Badge";

const COMPONENT_TYPES = ["Raw Material", "Component", "Sub-assembly", "Assembly", "Finished Good"];

interface MetaPair { key: string; value: string }
type Status = "idle" | "loading" | "success" | "error";

function inputCls(err?: string) {
  return `w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-1 focus:ring-violet-300 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${err ? "border-red-400" : "border-gray-200"}`;
}

export default function CreateComponentPage() {
  const [name, setName]         = useState("");
  const [type, setType]         = useState("");
  const [supplier, setSupplier] = useState("");
  const [meta, setMeta]         = useState<MetaPair[]>([]);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [status, setStatus]     = useState<Status>("idle");
  const [result, setResult]     = useState<CreatedComponent | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim())     e.name = "Name is required";
    if (!type.trim())     e.type = "Type is required";
    if (!supplier.trim()) e.supplier = "Supplier / org is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setErrorMsg("");
    const metadataObj = meta.reduce<Record<string, string>>((acc, p) => {
      if (p.key.trim()) acc[p.key.trim()] = p.value;
      return acc;
    }, {});
    try {
      const res = await createComponent({ name: name.trim(), type, supplier: supplier.trim(), metadata: metadataObj });
      setResult(res.component);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function reset() {
    setName(""); setType(""); setSupplier(""); setMeta([]);
    setErrors({}); setResult(null); setStatus("idle"); setErrorMsg("");
  }

  const backLink = (
    <Link href="/components" className="flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-700">
      <ArrowLeft className="h-3.5 w-3.5" /> Components
    </Link>
  );

  if (status === "success" && result) {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
          {backLink}
          <div className="mt-4 mb-4 flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-800">Component registered on-chain</p>
          </div>
          <SectionCard noPadding>
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">{result.name}</h2>
              {type && <div className="mt-1"><TypeBadge type={type} /></div>}
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Component ID",     value: result.id },
                { label: "Transaction Hash", value: result.txHash },
                { label: "On-Chain Address", value: result.onChainAddress },
                { label: "Metadata URI",     value: result.metadataURI },
              ].map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[140px_1fr] gap-3 px-5 py-3 text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="break-all font-mono text-xs text-gray-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-5 py-4">
              <ActionButton variant="gradient" onClick={reset}>Create another</ActionButton>
              <a
                href={`https://explorer.solana.com/tx/${result.txHash}?cluster=devnet`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-700"
              >
                View on explorer <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        {backLink}
        <div className="mt-4">
          <PageHeader
            title="New component"
            subtitle="Register a supply chain component on Solana devnet."
          />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <SectionCard noPadding>

            {/* Name */}
            <div className="border-b border-gray-100 px-5 py-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">Component name</label>
              <input type="text" value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
                placeholder="e.g. Cathode B-18" disabled={status === "loading"} className={inputCls(errors.name)} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Type */}
            <div className="border-b border-gray-100 px-5 py-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-400">Type</label>
              <div className="flex flex-wrap gap-2">
                {COMPONENT_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => { setType(t); if (errors.type) setErrors((p) => ({ ...p, type: "" })); }}
                    disabled={status === "loading"}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      type === t
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
              {errors.type && <p className="mt-2 text-xs text-red-500">{errors.type}</p>}
            </div>

            {/* Supplier */}
            <div className="border-b border-gray-100 px-5 py-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">Supplier / org</label>
              <input type="text" value={supplier}
                onChange={(e) => { setSupplier(e.target.value); if (errors.supplier) setErrors((p) => ({ ...p, supplier: "" })); }}
                placeholder="e.g. org:kaldera" disabled={status === "loading"} className={inputCls(errors.supplier)} />
              {errors.supplier && <p className="mt-1 text-xs text-red-500">{errors.supplier}</p>}
            </div>

            {/* Metadata */}
            <div className="px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Metadata <span className="font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <button type="button" onClick={() => setMeta((p) => [...p, { key: "", value: "" }])}
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800">
                  <PlusCircle className="h-3.5 w-3.5" /> Add field
                </button>
              </div>
              {meta.length === 0 && <p className="text-xs text-gray-400">No extra metadata. Click "Add field" to attach key-value pairs.</p>}
              <div className="flex flex-col gap-2">
                {meta.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={pair.key}
                      onChange={(e) => setMeta((p) => p.map((x, j) => j === i ? { ...x, key: e.target.value } : x))}
                      placeholder="key" className="w-24 flex-shrink-0 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-violet-400" />
                    <input type="text" value={pair.value}
                      onChange={(e) => setMeta((p) => p.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                      placeholder="value" className="flex-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-violet-400" />
                    <button type="button" onClick={() => setMeta((p) => p.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            {status === "error" && (
              <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <ActionButton type="button" variant="ghost" onClick={reset} disabled={status === "loading"}>Clear</ActionButton>
              <ActionButton type="submit" variant="gradient" loading={status === "loading"}>
                {status === "loading" ? "Registering…" : "Register on-chain →"}
              </ActionButton>
            </div>

          </SectionCard>
        </form>
      </div>
    </div>
  );
}
