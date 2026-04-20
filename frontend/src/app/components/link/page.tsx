"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, ArrowDown, ExternalLink, Link2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getComponents, linkComponents } from "@/lib/api";
import type { ComponentListItem } from "@/types/component";
import type { ComponentLink } from "@/types/link";

type Status = "idle" | "loading" | "success" | "error";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LinkComponentsPage() {
  const [components, setComponents] = useState<ComponentListItem[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ComponentLink | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<{ parent?: string; child?: string }>({});

  useEffect(() => {
    getComponents()
      .then((res) => setComponents(res.components))
      .catch(() => {})
      .finally(() => setLoadingComponents(false));
  }, []);

  function validate(): boolean {
    const next: { parent?: string; child?: string } = {};
    if (!parentId) next.parent = "Select a parent component";
    if (!childId) next.child = "Select a child component";
    if (parentId && childId && parentId === childId)
      next.child = "Parent and child must be different";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await linkComponents({ parentId, childId });
      setResult(res.link);
      setStatus("success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(msg);
      setStatus("error");
    }
  }

  function handleReset() {
    setParentId("");
    setChildId("");
    setErrors({});
    setResult(null);
    setStatus("idle");
    setErrorMessage("");
  }

  const selectCls = (err?: string) =>
    `w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
      err ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <div className="h-full overflow-y-auto mx-auto max-w-xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Link Components</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Establish a supply chain relationship between two components on-chain.
        </p>
      </div>

      {status === "success" && result ? (
        <SuccessCard link={result} onLinkAnother={handleReset} />
      ) : (
        <Card>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Parent */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Parent Component
              </label>
              <p className="text-xs text-gray-400">
                The upstream component that supplies or contains the child.
              </p>
              <select
                value={parentId}
                onChange={(e) => {
                  setParentId(e.target.value);
                  if (errors.parent) setErrors((p) => ({ ...p, parent: undefined }));
                }}
                disabled={loadingComponents || status === "loading"}
                className={selectCls(errors.parent)}
              >
                <option value="" disabled>
                  {loadingComponents ? "Loading components…" : "Select parent…"}
                </option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.type}
                  </option>
                ))}
              </select>
              {errors.parent && (
                <p className="text-xs text-red-500">{errors.parent}</p>
              )}
            </div>

            {/* Connector */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="h-5 w-px bg-gray-200" />
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                  <ArrowDown className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
                  supplies
                </p>
                <div className="h-5 w-px bg-gray-200" />
              </div>
            </div>

            {/* Child */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Child Component
              </label>
              <p className="text-xs text-gray-400">
                The downstream component that depends on or is built from the parent.
              </p>
              <select
                value={childId}
                onChange={(e) => {
                  setChildId(e.target.value);
                  if (errors.child) setErrors((p) => ({ ...p, child: undefined }));
                }}
                disabled={loadingComponents || status === "loading"}
                className={selectCls(errors.child)}
              >
                <option value="" disabled>
                  {loadingComponents ? "Loading components…" : "Select child…"}
                </option>
                {components.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === parentId}>
                    {c.name} — {c.type}
                  </option>
                ))}
              </select>
              {errors.child && (
                <p className="text-xs text-red-500">{errors.child}</p>
              )}
            </div>

            {status === "error" && (
              <div className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={status === "loading"}
              >
                Clear
              </Button>
              <Button
                type="submit"
                loading={status === "loading"}
                disabled={status === "loading" || loadingComponents}
              >
                <Link2 className="h-3.5 w-3.5" />
                {status === "loading" ? "Linking…" : "Link on-chain"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

function SuccessCard({
  link,
  onLinkAnother,
}: {
  link: ComponentLink;
  onLinkAnother: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-800">
          Link established on-chain
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3">
          <Field label="Parent ID" value={link.parentId} mono />
          <Field label="Child ID" value={link.childId} mono />
          <Field label="Transaction Hash" value={link.txHash} mono />
          <Field label="Created At" value={formatDate(link.createdAt)} />
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
          <Button onClick={onLinkAnother}>Link another</Button>
          <a
            href={`https://explorer.solana.com/tx/${link.txHash}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800"
          >
            View on explorer
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className={`break-all text-sm text-gray-800 ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
