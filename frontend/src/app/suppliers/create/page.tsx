"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { createSupplier } from "@/lib/api/suppliers";

export default function CreateSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name:   "",
    legal_name:     "",
    contact_email:  "",
    contact_phone:  "",
    country:        "",
    address:        "",
    notes:          "",
  });
  const [certInput, setCertInput]       = useState("");
  const [certifications, setCerts]      = useState<string[]>([]);

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addCert() {
    const v = certInput.trim();
    if (v && !certifications.includes(v)) { setCerts((c) => [...c, v]); }
    setCertInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim()) { setError("Company name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      await createSupplier({
        company_name:  form.company_name,
        legal_name:    form.legal_name   || undefined,
        contact_email: form.contact_email || undefined,
        contact_phone: form.contact_phone || undefined,
        country:       form.country      || undefined,
        address:       form.address      || undefined,
        notes:         form.notes        || undefined,
        certifications,
      });
      router.push("/suppliers");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create supplier");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-500 dark:focus:border-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-500";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1";

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        <div className="mb-6 flex items-center gap-3">
          <Link href="/suppliers" className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">New Supplier</h1>
            <p className="text-sm text-gray-400">Add a new supplier to your organisation</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Company details</p>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls}>Company name <span className="text-red-500">*</span></label>
                <input className={inputCls} value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Acme Corp Ltd" required />
              </div>
              <div>
                <label className={labelCls}>Legal name</label>
                <input className={inputCls} value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)} placeholder="Acme Corporation Limited" />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input className={inputCls} value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="United States" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Address</label>
                <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Industrial Rd, Chicago, IL 60601" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Contact</p>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="procurement@acme.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+1 312 555 0100" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Certifications</p>
            </div>
            <div className="p-4">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {certifications.map((c) => (
                  <span key={c} className="flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-950 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                    {c}
                    <button type="button" onClick={() => setCerts((cs) => cs.filter((x) => x !== c))} className="text-violet-400 hover:text-violet-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCert(); } }}
                  placeholder="ISO 9001, FDA, GMP…"
                />
                <button type="button" onClick={addCert}
                  className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Plus className="h-3.5 w-3.5" />Add
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</p>
            </div>
            <div className="p-4">
              <textarea className={`${inputCls} resize-none`} rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal notes about this supplier…" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/suppliers" className="rounded-md border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create supplier
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
