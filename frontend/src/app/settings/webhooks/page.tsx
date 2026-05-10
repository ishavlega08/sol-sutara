"use client";

import { useState, useEffect, useCallback } from "react";
import { Webhook as WebhookIcon, Plus, Trash2, RotateCcw, ChevronDown, ChevronUp, Loader2, Copy, Check } from "lucide-react";
import { getWebhooks, createWebhook, deleteWebhook, updateWebhook, getWebhookEvents, rotateWebhookSecret, retryWebhookDeliveries } from "@/lib/api/webhooks";
import type { Webhook } from "@/types/shipment";
import { StatusBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

// ─── Secret display ───────────────────────────────────────────────────────────

function SecretDisplay({ secret }: { secret: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied]   = useState(false);

  function copy() {
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
        {visible ? secret : "••••••••••••••••••••••••"}
      </span>
      <button onClick={() => setVisible((v) => !v)} className="text-xs text-gray-400 hover:text-gray-600">
        {visible ? "Hide" : "Show"}
      </button>
      <button onClick={copy} className="text-gray-400 hover:text-gray-600">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

// ─── Webhook row ──────────────────────────────────────────────────────────────

function WebhookRow({
  webhook,
  onDelete,
  onRotate,
  onToggle,
}: {
  webhook: Webhook;
  onDelete: (id: string) => void;
  onRotate: (id: string) => void;
  onToggle: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-xs font-medium text-gray-800 dark:text-gray-200">{webhook.url}</span>
            <StatusBadge label={webhook.status} variant={webhook.status === "ACTIVE" ? "success" : "default"} />
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            {webhook.events.length} event{webhook.events.length !== 1 ? "s" : ""} · {webhook._count?.deliveries ?? 0} deliveries
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onToggle(webhook.id, webhook.status === "ACTIVE" ? "DISABLED" : "ACTIVE")}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs">
            {webhook.status === "ACTIVE" ? "Disable" : "Enable"}
          </button>
          <button onClick={() => onRotate(webhook.id)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Rotate secret">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(webhook.id)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setExpanded((e) => !e)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Signing Secret</p>
            <SecretDisplay secret={webhook.secret} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Subscribed Events</p>
            <div className="flex flex-wrap gap-1.5">
              {webhook.events.map((e) => (
                <span key={e} className="rounded-full bg-violet-50 dark:bg-violet-950 px-2.5 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                  {e}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Verify signature: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">X-Sutara-Signature: sha256=HMAC_SHA256(secret, body)</code>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────

function CreateForm({ availableEvents, onCreate }: { availableEvents: string[]; onCreate: () => void }) {
  const [url, setUrl]           = useState("");
  const [events, setEvents]     = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function toggleEvent(e: string) {
    setEvents((es) => es.includes(e) ? es.filter((x) => x !== e) : [...es, e]);
  }

  async function handleCreate() {
    if (!url.trim())    { setError("URL is required"); return; }
    if (events.length === 0) { setError("Select at least one event"); return; }
    setLoading(true);
    setError(null);
    try {
      await createWebhook({ url, events });
      setUrl("");
      setEvents([]);
      onCreate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create webhook");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-violet-500 placeholder:text-gray-400";

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">New Webhook</p>
      </div>
      <div className="p-4 space-y-4">
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Endpoint URL *</label>
          <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-app.com/webhooks/solsutara" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Events to subscribe *</label>
          <div className="flex flex-wrap gap-2">
            {availableEvents.map((e) => (
              <button key={e} onClick={() => toggleEvent(e)} type="button"
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                  events.includes(e)
                    ? "border-violet-300 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                }`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleCreate} disabled={loading}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create webhook
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const [webhooks, setWebhooks]             = useState<Webhook[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [loading, setLoading]               = useState(true);
  const [retrying, setRetrying]             = useState(false);

  const load = useCallback(async () => {
    try {
      const [wRes, eRes] = await Promise.allSettled([getWebhooks(), getWebhookEvents()]);
      if (wRes.status === "fulfilled") setWebhooks(wRes.value.webhooks);
      if (eRes.status === "fulfilled") setAvailableEvents(eRes.value.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    try {
      await deleteWebhook(id);
      setWebhooks((ws) => ws.filter((w) => w.id !== id));
    } catch (err) { console.error(err); }
  }

  async function handleRotate(id: string) {
    try {
      const res = await rotateWebhookSecret(id);
      setWebhooks((ws) => ws.map((w) => w.id === id ? { ...w, secret: res.webhook.secret } : w));
    } catch (err) { console.error(err); }
  }

  async function handleToggle(id: string, status: string) {
    try {
      await updateWebhook(id, { status });
      setWebhooks((ws) => ws.map((w) => w.id === id ? { ...w, status: status as "ACTIVE" | "DISABLED" } : w));
    } catch (err) { console.error(err); }
  }

  async function handleRetry() {
    setRetrying(true);
    try {
      await retryWebhookDeliveries();
    } catch (err) { console.error(err); }
    finally { setRetrying(false); }
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">

        <PageHeader
          title="Webhooks"
          subtitle={<span>Receive real-time events at your endpoints</span>}
          actions={
            <button onClick={handleRetry} disabled={retrying}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60">
              {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Retry failed
            </button>
          }
        />

        <div className="mb-6">
          <CreateForm availableEvents={availableEvents} onCreate={load} />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <WebhookIcon className="h-6 w-6 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">No webhooks registered yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((w) => (
              <WebhookRow key={w.id} webhook={w} onDelete={handleDelete} onRotate={handleRotate} onToggle={handleToggle} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
