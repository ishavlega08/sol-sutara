"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, GitBranch, AlertCircle, RefreshCw, ChevronLeft } from "lucide-react";
import { getComponentParents } from "@/lib/api";
import type { ParentLink } from "@/types/link";

function truncate(str: string, start = 6, end = 4) {
  if (!str || str.length <= start + end + 3) return str;
  return `${str.slice(0, start)}…${str.slice(-end)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-2/5 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function ParentsView({
  id,
  componentName,
}: {
  id: string;
  componentName: string;
}) {
  const [parents, setParents] = useState<ParentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const res = await getComponentParents(id);
        setParents(res.parents);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load parents");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const displayName = componentName || `Component ${truncate(id)}`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400 transition hover:text-gray-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All Components
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {!loading &&
                !error &&
                `${parents.length} parent${parents.length !== 1 ? "s" : ""} in supply chain`}
              {loading && "Loading…"}
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => load()}
            className="ml-auto text-sm font-medium text-red-600 underline underline-offset-2 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && parents.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
            <GitBranch className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No parents linked</p>
          <p className="mt-1 text-xs text-gray-400">
            This component has no upstream parents in the supply chain.
          </p>
          <Link
            href="/components/link"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Link a parent
          </Link>
        </div>
      )}

      {/* Parent cards */}
      {!loading && !error && parents.length > 0 && (
        <div className="flex flex-col gap-3">
          {parents.map((item, index) => (
            <ParentCard key={item.linkId} item={item} index={index} total={parents.length} />
          ))}
        </div>
      )}
    </div>
  );
}

function ParentCard({
  item,
  index,
  total,
}: {
  item: ParentLink;
  index: number;
  total: number;
}) {
  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-5 transition hover:border-gray-300">
      {/* Tree connector line */}
      {index < total - 1 && (
        <span className="absolute -bottom-3 left-7 h-3 w-px bg-gray-200" />
      )}

      <div className="flex items-start gap-3">
        {/* Node indicator */}
        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + on-chain ID */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{item.parent.name}</span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
              On-chain #{item.parent.onChainId}
            </span>
          </div>

          {/* Details row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-xs text-gray-400">
              Linked {formatDate(item.createdAt)}
            </span>

            <span className="inline-flex items-center gap-1 font-mono text-xs text-gray-400">
              Addr: {truncate(item.parent.onChainAddress)}
            </span>

            <a
              href={`https://explorer.solana.com/tx/${item.txHash}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-gray-400 transition hover:text-gray-700"
            >
              Tx: {truncate(item.txHash)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
