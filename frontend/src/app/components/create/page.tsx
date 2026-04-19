"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MetadataInput, { MetadataPair } from "@/components/MetadataInput";
import { createComponent } from "@/lib/api";
import type { CreatedComponent } from "@/types/component";

const COMPONENT_TYPES = [
  "Component",
  "Assembly",
  "Raw Material",
  "Sub-assembly",
  "Finished Good",
];

interface FormState {
  name: string;
  type: string;
  supplier: string;
}

interface FormErrors {
  name?: string;
  type?: string;
  supplier?: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function CreateComponentPage() {
  const [form, setForm] = useState<FormState>({ name: "", type: "", supplier: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [metadata, setMetadata] = useState<MetadataPair[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<CreatedComponent | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.type.trim()) next.type = "Type is required";
    if (!form.supplier.trim()) next.supplier = "Supplier is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setErrorMessage("");

    const metadataObj = metadata.reduce<Record<string, string>>((acc, pair) => {
      if (pair.key.trim()) acc[pair.key.trim()] = pair.value;
      return acc;
    }, {});

    try {
      const response = await createComponent({
        name: form.name.trim(),
        type: form.type.trim(),
        supplier: form.supplier.trim(),
        metadata: metadataObj,
      });
      setResult(response.component);
      setStatus("success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(msg);
      setStatus("error");
    }
  }

  function handleReset() {
    setForm({ name: "", type: "", supplier: "" });
    setMetadata([]);
    setErrors({});
    setResult(null);
    setStatus("idle");
    setErrorMessage("");
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Create Component</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Register a new supply chain component on-chain.
        </p>
      </div>

      {status === "success" && result ? (
        <SuccessCard component={result} onCreateAnother={handleReset} />
      ) : (
        <Card>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Input
              label="Component Name"
              placeholder="e.g. Battery Pack"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              error={errors.name}
              disabled={status === "loading"}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
                disabled={status === "loading"}
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
                  errors.type ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="" disabled>
                  Select a type…
                </option>
                {COMPONENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
            </div>

            <Input
              label="Supplier"
              placeholder="e.g. ABC Corp"
              value={form.supplier}
              onChange={(e) => setField("supplier", e.target.value)}
              error={errors.supplier}
              disabled={status === "loading"}
            />

            <div className="border-t border-gray-100 pt-4">
              <MetadataInput pairs={metadata} onChange={setMetadata} />
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
                disabled={status === "loading"}
              >
                {status === "loading" ? "Registering…" : "Register Component"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

function SuccessCard({
  component,
  onCreateAnother,
}: {
  component: CreatedComponent;
  onCreateAnother: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-800">
          Component registered successfully
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-gray-900">{component.name}</h2>
        <div className="flex flex-col gap-3">
          <Field label="Component ID" value={component.id} mono />
          <Field label="Transaction Hash" value={component.txHash} mono />
          <Field label="On-Chain Address" value={component.onChainAddress} mono />
          <Field label="Metadata URI" value={component.metadataURI} mono />
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
          <Button onClick={onCreateAnother}>Create another</Button>
          <a
            href={`https://explorer.solana.com/tx/${component.txHash}?cluster=devnet`}
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

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
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
