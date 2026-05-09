"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { getActiveRecalls, resolveRecall } from "@/lib/api";
import type { RecallRecord } from "@/types/component";

function relativeTime(iso: string) {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60)  return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)    return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export default function ActiveRecallsWidget() {
  const [recalls, setRecalls]   = useState<RecallRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getActiveRecalls();
      setRecalls(res.recalls);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleResolve(id: string) {
    setResolving(id);
    try {
      await resolveRecall(id);
      setRecalls((prev) => prev.filter((r) => r.id !== id));
    } catch { /* silent */ }
    finally { setResolving(null); }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-gray-100 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  if (recalls.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle className="h-6 w-6 text-emerald-400" />
        <p className="text-sm text-gray-400">No active recalls</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-800">
      {recalls.map((r) => (
        <div key={r.id} className="flex items-start gap-3 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
          <div className="flex-1 min-w-0">
            <Link
              href={`/components/${r.component.id}`}
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-violet-600 truncate block"
            >
              {r.component.name}
            </Link>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{r.reason}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">{r.scope} · {relativeTime(r.issuedAt)}</p>
          </div>
          <button
            onClick={() => handleResolve(r.id)}
            disabled={resolving === r.id}
            className="flex-shrink-0 flex items-center gap-1 rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition"
          >
            <RefreshCw className={`h-3 w-3 ${resolving === r.id ? "animate-spin" : ""}`} />
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}
