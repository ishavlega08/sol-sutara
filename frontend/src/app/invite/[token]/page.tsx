"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { getInviteDetails, joinOrg } from "@/lib/api/orgs";
import type { InviteDetails } from "@/lib/api/orgs";
import type { AuthUser, AuthOrg } from "@/context/AuthContext";

type PageState = "loading" | "preview" | "accepting" | "success" | "error";

const ROLE_LABELS: Record<string, string> = {
    OWNER:  "Owner",
    ADMIN:  "Admin",
    MEMBER: "Member",
    VIEWER: "Viewer",
};

export default function InvitePage() {
    const { token }                  = useParams<{ token: string }>();
    const router                     = useRouter();
    const { isAuthenticated, isLoading, user, setSession, login } = useAuth();

    const [state,   setState]   = useState<PageState>("loading");
    const [invite,  setInvite]  = useState<InviteDetails | null>(null);
    const [errMsg,  setErrMsg]  = useState("");

    // Load invite details
    useEffect(() => {
        async function load() {
            try {
                const data = await getInviteDetails(token);
                setInvite(data.invite);
                setState("preview");
            } catch (err: unknown) {
                setErrMsg(err instanceof Error ? err.message : "This invite is invalid or has expired.");
                setState("error");
            }
        }
        load();
    }, [token]);

    async function handleAccept() {
        if (!isAuthenticated) {
            // Redirect to login then back
            router.push(`/login?redirect=/invite/${token}`);
            return;
        }
        setState("accepting");
        try {
            const { org } = await joinOrg(token);
            setSession(user as AuthUser, true, { id: org.id, name: org.name } as AuthOrg);
            setState("success");
        } catch (err: unknown) {
            setErrMsg(err instanceof Error ? err.message : "Failed to accept invite.");
            setState("error");
        }
    }

    if (isLoading || state === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                <svg className="h-5 w-5 animate-spin text-violet-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="w-full max-w-sm">

                {/* Brand */}
                <div className="mb-8 flex justify-center">
                    <div className="flex items-center gap-2">
                        <Logo size={30} />
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Sol Sutara</span>
                    </div>
                </div>

                {state === "error" && (
                    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 p-6 text-center">
                        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
                        <h2 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">Invite unavailable</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{errMsg}</p>
                    </div>
                )}

                {state === "success" && (
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 p-6 text-center">
                        <CheckCircle className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
                        <h2 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">Welcome aboard!</h2>
                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            You&apos;ve joined <strong>{invite?.orgName}</strong>.
                        </p>
                        <button
                            onClick={() => router.replace("/")}
                            className="w-full rounded-md py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                        >
                            Go to dashboard →
                        </button>
                    </div>
                )}

                {(state === "preview" || state === "accepting") && invite && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                        <h1 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                            You&apos;ve been invited
                        </h1>
                        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                            {invite.inviterEmail ? (
                                <><strong className="text-gray-700 dark:text-gray-300">{invite.inviterEmail}</strong> invited you to join </>
                            ) : (
                                "You&apos;ve been invited to join "
                            )}
                            <strong className="text-gray-900 dark:text-gray-100">{invite.orgName}</strong>
                            {" "}as a{" "}
                            <span className="rounded bg-violet-50 dark:bg-violet-950 px-1.5 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                                {ROLE_LABELS[invite.role] ?? invite.role}
                            </span>.
                        </p>

                        {!isAuthenticated && (
                            <p className="mb-4 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                                You need to sign in before accepting this invite.
                            </p>
                        )}

                        <button
                            onClick={isAuthenticated ? handleAccept : () => login()}
                            disabled={state === "accepting"}
                            className="w-full rounded-md py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                        >
                            {state === "accepting" ? "Joining…" : isAuthenticated ? "Accept invite →" : "Sign in to accept →"}
                        </button>

                        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-600">
                            Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
