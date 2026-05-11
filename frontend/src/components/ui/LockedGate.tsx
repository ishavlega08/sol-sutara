"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface LockedGateProps {
    type: "soon" | "paid";
    feature?: string;
    children?: React.ReactNode;
}

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === "true";

export default function LockedGate({ type: _type, feature, children }: LockedGateProps) {
    const router = useRouter();

    useEffect(() => {
        if (DEV_BYPASS) return;
        router.replace("/dashboard");
    }, [router]);

    if (DEV_BYPASS) {
        return (
            <>
                <div className="flex items-center gap-2 border-b border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700 px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <span className="rounded bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 font-bold text-amber-800 dark:text-amber-300">
                        DEV
                    </span>
                    {feature ? `${feature} — ` : ""}Coming soon page bypassed
                </div>
                {children}
            </>
        );
    }

    return null;
}
