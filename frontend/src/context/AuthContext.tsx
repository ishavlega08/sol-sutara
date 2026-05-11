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
import { apiLogin, apiRefresh, apiLogout } from "@/lib/api/auth";

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

// ─── Session cache (localStorage) ────────────────────────────────────────────
// Stores non-sensitive UI state so returning users see content immediately
// without waiting for the backend refresh on every page load.

const SESSION_KEY = "ss_session_v1";

interface CachedSession {
    user:   AuthUser;
    org:    AuthOrg | null;
    hasOrg: boolean;
    role:   string | null;
}

function readCache(): CachedSession | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as CachedSession) : null;
    } catch { return null; }
}

function writeCache(s: CachedSession) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}

function clearCache() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
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

    // Restore from localStorage on the very first render (synchronous, client-only)
    const [cachedSession] = useState<CachedSession | null>(() => readCache());

    const [user,              setUser]              = useState<AuthUser | null>(cachedSession?.user   ?? null);
    const [org,               setOrg]               = useState<AuthOrg  | null>(cachedSession?.org    ?? null);
    const [role,              setRole]              = useState<string   | null>(cachedSession?.role   ?? null);
    const [hasOrg,            setHasOrg]            = useState(cachedSession?.hasOrg ?? false);
    // Only show loading state if we have nothing to show yet
    const [isLoading,         setIsLoading]         = useState(!cachedSession);
    const [backendAuthFailed, setBackendAuthFailed] = useState(false);

    // Prevent double-processing the same Privy login event
    const handledPrivyLogin  = useRef(false);
    // Prevent double-running background verification
    const verifyingSession   = useRef(false);

    // ── Helpers ───────────────────────────────────────────────────────────────

    function applySession(u: AuthUser, h: boolean, o: AuthOrg | null, r?: string | null) {
        setUser(u);
        setHasOrg(h);
        setOrg(o);
        if (r !== undefined) setRole(r);
        writeCache({ user: u, hasOrg: h, org: o, role: r ?? null });
    }

    const setSession = useCallback(
        (u: AuthUser, h: boolean, o: AuthOrg | null, r?: string | null) => {
            applySession(u, h, o, r);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    // ── Backend auth with Privy token ─────────────────────────────────────────

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

    // ── Restore/verify session on mount ──────────────────────────────────────
    // If we have a cached session: verify silently in the background.
    // If we don't: show loading state and wait for the refresh to complete.
    useEffect(() => {
        if (!ready || authenticated || verifyingSession.current) return;
        verifyingSession.current = true;

        async function restoreSession() {
            // Only block the UI if we have no cached data to show
            if (!cachedSession) setIsLoading(true);
            try {
                const { user: u, org: o, hasOrg: h, role: r } = await apiRefresh();
                applySession(u, h, o, r);
            } catch {
                if (cachedSession) {
                    // Cached session is now stale — clear it and force re-auth
                    clearCache();
                    setUser(null);
                    setOrg(null);
                    setRole(null);
                    setHasOrg(false);
                }
                // No valid session — AppShell will redirect to /login
            } finally {
                setIsLoading(false);
                verifyingSession.current = false;
            }
        }

        restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, authenticated]);

    // ── Handle Privy login completing ─────────────────────────────────────────
    useEffect(() => {
        if (!ready || !authenticated || !privyUser) return;
        if (handledPrivyLogin.current) return;
        handledPrivyLogin.current = true;

        runBackendAuth();
    }, [ready, authenticated, privyUser, runBackendAuth]);

    // Reset the flag when Privy logs out
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
        setUser(null);
        setOrg(null);
        setRole(null);
        setHasOrg(false);
        setBackendAuthFailed(false);
    }, [privyLogout]);

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider
            value={{
                user,
                org,
                role,
                hasOrg,
                // If we have cached session data, don't gate on Privy readiness.
                // Privy verifies in the background; content is visible immediately.
                isLoading: cachedSession ? isLoading : (isLoading || !ready),
                isAuthenticated,
                privyAuthenticated: authenticated,
                backendAuthFailed,
                login:      privyLogin,
                logout,
                retryAuth,
                setSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
