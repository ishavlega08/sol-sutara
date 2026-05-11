"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2, Building2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { createSupplier } from "@/lib/api/suppliers";

const COUNTRIES = [
    "United States","United Kingdom","Germany","France","Japan","China","India",
    "South Korea","Taiwan","Netherlands","Sweden","Switzerland","Canada","Australia",
    "Brazil","Mexico","Italy","Spain","Singapore","Malaysia","Vietnam","Thailand",
    "Indonesia","Bangladesh","Pakistan","Turkey","Poland","Czech Republic","Hungary",
    "Romania","Other",
];

const COMMON_CERTS = [
    "ISO 9001","ISO 14001","ISO 45001","IATF 16949","AS9100","ISO/IEC 27001",
    "REACH","RoHS","UL","CE","FDA","FSSC 22000","GMP","Fair Trade","LEED",
];

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {children}
        </label>
    );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input {...props}
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-violet-400 dark:focus:border-violet-600 transition-colors" />
    );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea {...props}
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-violet-400 dark:focus:border-violet-600 transition-colors resize-none" />
    );
}

export default function CreateSupplierPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        company_name:   "",
        legal_name:     "",
        contact_email:  "",
        contact_phone:  "",
        country:        "",
        address:        "",
        notes:          "",
    });
    const [certifications, setCertifications] = useState<string[]>([]);
    const [certInput,      setCertInput]      = useState("");
    const [busy,           setBusy]           = useState(false);
    const [error,          setError]          = useState<string | null>(null);

    function set(field: string, value: string) {
        setForm((f) => ({ ...f, [field]: value }));
    }

    function addCert(cert: string) {
        const c = cert.trim();
        if (c && !certifications.includes(c)) {
            setCertifications((prev) => [...prev, c]);
        }
        setCertInput("");
    }

    function removeCert(cert: string) {
        setCertifications((prev) => prev.filter((c) => c !== cert));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.company_name.trim()) { setError("Company name is required"); return; }
        setBusy(true);
        setError(null);
        try {
            const res = await createSupplier({
                company_name:   form.company_name.trim(),
                legal_name:     form.legal_name.trim()    || undefined,
                contact_email:  form.contact_email.trim() || undefined,
                contact_phone:  form.contact_phone.trim() || undefined,
                country:        form.country              || undefined,
                address:        form.address.trim()       || undefined,
                certifications: certifications.length > 0 ? certifications : undefined,
                notes:          form.notes.trim()         || undefined,
            });
            router.push(`/suppliers/${res.supplier.id}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create supplier");
            setBusy(false);
        }
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">

                <div className="mb-2">
                    <Link href="/suppliers" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to suppliers
                    </Link>
                </div>

                <PageHeader title="New supplier" subtitle="Register a supply chain partner" />

                {error && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">

                    {/* ── Company identity ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-violet-500" />
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Company details</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>Company name *</Label>
                                <Input
                                    value={form.company_name}
                                    onChange={(e) => set("company_name", e.target.value)}
                                    placeholder="Acme Manufacturing Co."
                                    required
                                />
                            </div>
                            <div>
                                <Label>Legal name</Label>
                                <Input
                                    value={form.legal_name}
                                    onChange={(e) => set("legal_name", e.target.value)}
                                    placeholder="Acme Manufacturing Co. Ltd."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Contact ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-200">Contact information</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Contact email</Label>
                                <Input
                                    type="email"
                                    value={form.contact_email}
                                    onChange={(e) => set("contact_email", e.target.value)}
                                    placeholder="procurement@supplier.com"
                                />
                            </div>
                            <div>
                                <Label>Contact phone</Label>
                                <Input
                                    type="tel"
                                    value={form.contact_phone}
                                    onChange={(e) => set("contact_phone", e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div>
                                <Label>Country</Label>
                                <select
                                    value={form.country}
                                    onChange={(e) => set("country", e.target.value)}
                                    className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-400">
                                    <option value="">Select country…</option>
                                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Address</Label>
                                <Input
                                    value={form.address}
                                    onChange={(e) => set("address", e.target.value)}
                                    placeholder="123 Industrial Park, City"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Certifications ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <h2 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">Certifications</h2>
                        <p className="mb-4 text-xs text-gray-400">Add quality / compliance certifications held by this supplier.</p>

                        {/* Quick-add chips */}
                        <div className="mb-3 flex flex-wrap gap-1.5">
                            {COMMON_CERTS.map((c) => (
                                <button key={c} type="button"
                                    onClick={() => addCert(c)}
                                    disabled={certifications.includes(c)}
                                    className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/40 dark:hover:text-violet-400 disabled:opacity-40 disabled:cursor-default transition-colors">
                                    + {c}
                                </button>
                            ))}
                        </div>

                        {/* Custom cert input */}
                        <div className="flex gap-2">
                            <Input
                                value={certInput}
                                onChange={(e) => setCertInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCert(certInput); } }}
                                placeholder="Custom certification…"
                            />
                            <button type="button" onClick={() => addCert(certInput)}
                                className="flex-shrink-0 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Selected certs */}
                        {certifications.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {certifications.map((c) => (
                                    <span key={c} className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-400">
                                        {c}
                                        <button type="button" onClick={() => removeCert(c)} className="ml-0.5 hover:text-red-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Notes ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <Label>Internal notes</Label>
                        <Textarea
                            value={form.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            placeholder="Any internal notes about this supplier, onboarding steps, special terms…"
                            rows={3}
                        />
                    </div>

                    {/* ── Actions ── */}
                    <div className="flex items-center justify-between pb-6">
                        <Link href="/suppliers" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            Cancel
                        </Link>
                        <button type="submit" disabled={busy}
                            className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors">
                            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create supplier"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
