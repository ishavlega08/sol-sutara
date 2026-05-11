"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, FileText, Truck, Loader2, ChevronDown, PlusCircle, Upload, X } from "lucide-react";
import { getSupplierById, updateSupplierStatus } from "@/lib/api/suppliers";
import { uploadDocument, fileToBase64, getDocuments, deleteDocument } from "@/lib/api/documents";
import type { SupplierDetail, SupplierStatus } from "@/types/supplier";
import type { Document } from "@/types/shipment";
import { StatusBadge } from "@/components/ui/Badge";
import { useRole } from "@/hooks/useRole";

const STATUS_OPTIONS: { value: SupplierStatus; label: string }[] = [
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "APPROVED",       label: "Approved"       },
  { value: "SUSPENDED",      label: "Suspended"      },
  { value: "REJECTED",       label: "Rejected"       },
];

function statusVariant(s: SupplierStatus): "success" | "warning" | "error" | "default" {
  if (s === "APPROVED")       return "success";
  if (s === "PENDING_REVIEW") return "warning";
  return "error";
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">{value || "—"}</p>
    </div>
  );
}

export default function SupplierDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const { role } = useRole();

  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [docs, setDocs]         = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);

  const canManage = role === "ADMIN" || role === "OWNER";
  const canCreate = role === "MEMBER" || role === "ADMIN" || role === "OWNER";

  async function loadDocs() {
    setDocsLoading(true);
    try {
      const res = await getDocuments({ supplierId: id });
      setDocs(res.documents);
    } catch { /* silently fail */ }
    finally { setDocsLoading(false); }
  }

  useEffect(() => {
    getSupplierById(id)
      .then((r) => setSupplier(r.supplier))
      .catch(() => setError("Supplier not found"))
      .finally(() => setLoading(false));
    loadDocs();
  }, [id]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fileBase64 = await fileToBase64(file);
      await uploadDocument({
        name:       file.name,
        type:       "OTHER",
        fileBase64,
        mimeType:   file.type || "application/octet-stream",
        supplierId: id,
      });
      await loadDocs();
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteDoc(docId: string) {
    setDeleting(docId);
    try {
      await deleteDocument(docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch { /* silently fail */ }
    finally { setDeleting(null); }
  }

  async function handleStatusChange(status: SupplierStatus) {
    if (!supplier) return;
    setUpdating(true);
    try {
      const res = await updateSupplierStatus(id, status);
      setSupplier({ ...supplier, status: res.supplier.status });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );

  if (error || !supplier) return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p className="text-sm text-gray-500">{error ?? "Not found"}</p>
      <Link href="/suppliers" className="text-xs text-violet-600 underline">Back to suppliers</Link>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <Link href="/suppliers" className="mt-0.5 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-1 items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{supplier.company_name}</h1>
                <StatusBadge label={supplier.status.replace("_", " ")} variant={statusVariant(supplier.status)} />
              </div>
              <p className="mt-0.5 text-sm text-gray-400">{supplier.supplier_code} · {supplier.country ?? "Unknown country"}</p>
            </div>

            {canManage && (
              <div className="relative flex items-center gap-2">
                {updating && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
                <div className="relative">
                  <select
                    value={supplier.status}
                    onChange={(e) => handleStatusChange(e.target.value as SupplierStatus)}
                    disabled={updating}
                    className="appearance-none rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 bg-white py-1.5 pl-3 pr-7 text-xs font-medium outline-none hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Details card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Company Details</p>
              </div>
              <div className="grid grid-cols-2 gap-5 p-4 sm:grid-cols-3">
                <Detail label="Legal Name"    value={supplier.legal_name} />
                <Detail label="Country"       value={supplier.country} />
                <Detail label="Risk Level"    value={supplier.risk_level} />
                <Detail label="Contact Email" value={supplier.contact_email} />
                <Detail label="Contact Phone" value={supplier.contact_phone} />
                <Detail label="Added"         value={supplier.created_at.slice(0, 10)} />
                {supplier.address && <div className="col-span-full"><Detail label="Address" value={supplier.address} /></div>}
              </div>
            </div>

            {supplier.certifications.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Certifications</p>
                </div>
                <div className="flex flex-wrap gap-2 p-4">
                  {supplier.certifications.map((c) => (
                    <span key={c} className="rounded-full bg-violet-50 dark:bg-violet-950 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Shipments */}
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Recent Shipments ({supplier._count?.shipments ?? 0})</p>
              </div>
              {supplier.shipments.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400">No shipments yet.</p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {supplier.shipments.map((s) => (
                    <Link key={s.id} href={`/shipments/${s.id}`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{s.shipment_number}</p>
                        <p className="text-xs text-gray-400">{s.origin} → {s.destination}</p>
                      </div>
                      <StatusBadge label={s.status.replace(/_/g, " ")} variant="info" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Documents {!docsLoading && `(${docs.length})`}
                  </p>
                </div>
                {canCreate && (
                  <label className={`flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                    {uploading ? "Uploading…" : "Upload"}
                    <input type="file" className="sr-only" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                )}
              </div>
              {uploadError && (
                <p className="px-4 py-2 text-xs text-red-500">{uploadError}</p>
              )}
              {docsLoading ? (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-4 w-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                      <div className="h-3.5 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                    </div>
                  ))}
                </div>
              ) : docs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Upload className="h-7 w-7 text-gray-200 dark:text-gray-700" />
                  <p className="text-xs text-gray-400">No documents yet</p>
                  {canCreate && <p className="text-xs text-gray-300 dark:text-gray-600">Use Upload to attach certifications, contracts, or compliance docs</p>}
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition group">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                        <span className="truncate font-medium text-gray-800 dark:text-gray-200">{d.name}</span>
                        <span className="flex-shrink-0 text-xs text-gray-400">{d.type}</span>
                      </a>
                      {canManage && (
                        <button onClick={() => handleDeleteDoc(d.id)} disabled={deleting === d.id}
                          className="ml-2 flex-shrink-0 rounded p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400 transition disabled:opacity-50">
                          {deleting === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar stats */}
          <div className="space-y-4">
            {[
              { label: "Total Shipments",  value: supplier._count?.shipments  ?? 0, color: "#7c3aed" },
              { label: "Linked Components", value: supplier._count?.components ?? 0, color: "#06b6d4" },
              { label: "Documents",        value: supplier._count?.documents  ?? 0, color: "#10b981" },
            ].map(({ label, value, color }) => (
              <div key={label} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="h-0.5" style={{ background: color }} />
                <div className="px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
              </div>
            ))}

            {supplier.notes && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{supplier.notes}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
