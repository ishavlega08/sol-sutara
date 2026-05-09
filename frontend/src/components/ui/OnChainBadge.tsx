"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2, ExternalLink } from "lucide-react";
import { verifyComponent } from "@/lib/api";
import type { VerifyResult } from "@/types/component";

export default function OnChainBadge({ componentId, txHash }: { componentId: string; txHash?: string | null }) {
  const [result, setResult]   = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyComponent(componentId)
      .then((res) => setResult(res))
      .catch(() => setResult({ verified: false, onChainAddress: null, slot: null, lamports: null, error: "Verification failed" }))
      .finally(() => setLoading(false));
  }, [componentId]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verifying on Solana…
      </div>
    );
  }

  if (result?.verified) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-semibold">Verified on Solana devnet</span>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-gray-400 pl-1">
          {result.slot && <span>Slot <span className="font-mono text-gray-600 dark:text-gray-300">{result.slot.toLocaleString()}</span></span>}
          {result.lamports != null && <span>Balance <span className="font-mono text-gray-600 dark:text-gray-300">{(result.lamports / 1e9).toFixed(6)} SOL</span></span>}
          {txHash && (
            <a
              href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-teal-500 hover:text-teal-700"
            >
              Explorer <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">
        <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="font-semibold">Not verified on-chain</span>
      </div>
      {result?.error && (
        <p className="pl-1 text-[11px] text-gray-400">{result.error}</p>
      )}
    </div>
  );
}
