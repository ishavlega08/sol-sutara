"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { apiLogin, apiMe, apiRefresh, apiLogout } from "@/lib/api/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
    id:            string;
    email:         string | null;
    walletAddress: string | null;
}

export interface AuthOrg {
    id:   string;
    name: string;
}

interface AuthState {
    user:              AuthUser | null;
    org:               AuthOrg | null;
    role:              string | null;
    hasOrg:            boolean;
    isLoading:         boolean;
    isAuthenticated:   boolean;
    privyAuthenticated: boolean;
    backendAuthFailed: boolean;
    login:             () => void;
    logout:            () => Promise<void>;
    retryAuth:         () => Promise<void>;
    setSession:        (user: AuthUser, hasOrg: boolean, org: AuthOrg | null, role?: string | null) => void;
}

// ─── Session cache ────────────────────────────────────────────────────────────
// Stores non-sensitive UI state + token expiry so returning users see content
// immediately without a backend call on every page load.
// The access JWT lasts 15 minutes; we cache for 14 to allow a small buffer.

const SESSION_KEY     = "ss_session_v2";
const TOKEN_TTL_MS    = 14 * 60 * 1000;  // 14 min — slightly under the 15min JWT TTL
const REFRESH_BUFFER  = 60 * 1000;       // refresh when < 60s left

interface CachedSession {
    user:      AuthUser;
    org:       AuthOrg | null;
    hasOrg:    boolean;
    role:      string | null;
    expiresAt: number;  // timestamp when the access JWT expires
}

function readCache(): CachedSession | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as CachedSession) : null;
    } catch { return null; }
}

function writeCache(s: Omit<CachedSession, "expiresAt">) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            ...s,
            expiresAt: Date.now() + TOKEN_TTL_MS,
        }));
    } catch {}
}

function clearCache() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
}

function isCacheFresh(cache: CachedSession): boolean {
    return cache.expiresAt > Date.now() + REFRESH_BUFFER;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState>({
    user:              null,
    org:               null,
    role:              null,
    hasOrg:            false,
    isLoading:         true,
    isAuthenticated:   false,
    privyAuthenticated: false,
    backendAuthFailed: false,
    login:             () => {},
    logout:            async () => {},
    retryAuth:         async () => {},
    setSession:        () => {},
});

export function useAuth() {
    return useContext(AuthContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout, getAccessToken } = usePrivy();

    // Restore from localStorage synchronously on first render (client-only; ssr: false)
    const [cachedSession] = useState<CachedSession | null>(() => readCache());

    const [user,              setUser]              = useState<AuthUser | null>(cachedSession?.user   ?? null);
    const [org,               setOrg]               = useState<AuthOrg  | null>(cachedSession?.org    ?? null);
    const [role,              setRole]              = useState<string   | null>(cachedSession?.role   ?? null);
    const [hasOrg,            setHasOrg]            = useState(cachedSession?.hasOrg ?? false);
    const [isLoading,         setIsLoading]         = useState(!cachedSession);
    const [backendAuthFailed, setBackendAuthFailed] = useState(false);

    const handledPrivyLogin = useRef(false);
    const verifying         = useRef(false);

    // ── Helpers ───────────────────────────────────────────────────────────────

    function applySession(u: AuthUser, h: boolean, o: AuthOrg | null, r?: string | null) {
        setUser(u);
        setHasOrg(h);
        setOrg(o);
        if (r !== undefined) setRole(r);
        writeCache({ user: u, hasOrg: h, org: o, role: r ?? null });
    }

    const setSession = useCallback(
        (u: AuthUser, h: boolean, o: AuthOrg | null, r?: string | null) => applySession(u, h, o, r),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    // ── Backend auth via Privy token ──────────────────────────────────────────

    const runBackendAuth = useCallback(async () => {
        setIsLoading(true);
        setBackendAuthFailed(false);
        try {
            const privyToken = await getAccessToken();
            if (!privyToken) throw new Error("No Privy access token");
            const { user: u, org: o, hasOrg: h, role: r } = await apiLogin(privyToken);
            applySession(u, h, o, r);
        } catch (err) {
            console.error("Auth error:", err);
            setBackendAuthFailed(true);
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAccessToken]);

    // ── Session restore on mount ──────────────────────────────────────────────
    // Priority:
    //   1. Fresh cache + valid token → skip backend entirely (instant)
    //   2. Cache exists but token expiring soon → /auth/me fast path (0 DB queries)
    //   3. No cache or /me fails → /auth/refresh (full DB rotation)
    useEffect(() => {
        if (!ready || authenticated || verifying.current) return;
        verifying.current = true;

        async function restoreSession() {
            // FAST PATH: token still fresh — serve from cache, verify in background
            if (cachedSession && isCacheFresh(cachedSession)) {
                setIsLoading(false);
                // Silently verify in background to catch revoked tokens
                apiMe().catch(() => {
                    clearCache();
                    setUser(null); setOrg(null); setRole(null); setHasOrg(false);
                }).finally(() => { verifying.current = false; });
                return;
            }

            // MEDIUM PATH: cache exists but token near expiry → try /me first (0 DB)
            if (!cachedSession) setIsLoading(true);
            try {
                const { user: u, org: o, hasOrg: h, role: r } = await apiMe();
                applySession(u, h, o, r);
            } catch (err: unknown) {
                // Only try refresh on a real 401 — not on network errors or backend failures.
                // A network error means the backend is unreachable; calling refresh would just
                // burn the rate limit and add no value.
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 401) {
                    try {
                        const { user: u, org: o, hasOrg: h, role: r } = await apiRefresh();
                        applySession(u, h, o, r);
                    } catch {
                        clearCache();
                        setUser(null); setOrg(null); setRole(null); setHasOrg(false);
                    }
                } else {
                    // Network error or 5xx — don't clear the cache, just stop loading.
                    // The user may still be authenticated once the backend is reachable.
                    if (!cachedSession) {
                        setUser(null); setOrg(null); setRole(null); setHasOrg(false);
                    }
                }
            } finally {
                setIsLoading(false);
                verifying.current = false;
            }
        }

        restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, authenticated]);

    // ── Privy login completing ─────────────────────────────────────────────────
    useEffect(() => {
        if (!ready || !authenticated || !privyUser) return;
        if (handledPrivyLogin.current) return;
        handledPrivyLogin.current = true;
        runBackendAuth();
    }, [ready, authenticated, privyUser, runBackendAuth]);

    useEffect(() => {
        if (!authenticated) {
            handledPrivyLogin.current = false;
            setBackendAuthFailed(false);
        }
    }, [authenticated]);

    const retryAuth = useCallback(async () => {
        handledPrivyLogin.current = false;
        await runBackendAuth();
        handledPrivyLogin.current = true;
    }, [runBackendAuth]);

    const logout = useCallback(async () => {
        clearCache();
        try { await apiLogout(); } catch { /* ignore */ }
        await privyLogout();
        setUser(null); setOrg(null); setRole(null);
        setHasOrg(false); setBackendAuthFailed(false);
    }, [privyLogout]);

    return (
        <AuthContext.Provider
            value={{
                user, org, role, hasOrg,
                isLoading: cachedSession ? isLoading : (isLoading || !ready),
                isAuthenticated: !!user,
                privyAuthenticated: authenticated,
                backendAuthFailed,
                login: privyLogin,
                logout, retryAuth, setSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
