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

    const [user,              setUser]              = useState<AuthUser | null>(null);
    const [org,               setOrg]               = useState<AuthOrg  | null>(null);
    const [role,              setRole]              = useState<string   | null>(null);
    const [hasOrg,            setHasOrg]            = useState(false);
    const [isLoading,         setIsLoading]         = useState(true);
    const [backendAuthFailed, setBackendAuthFailed] = useState(false);

    // Prevent double-processing the same Privy login event
    const handledPrivyLogin = useRef(false);

    // ── Shared backend auth logic ─────────────────────────────────────────────

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

    // ── Restore session on mount via refresh cookie ───────────────────────────
    useEffect(() => {
        async function restoreSession() {
            try {
                const { user: u, org: o, hasOrg: h, role: r } = await apiRefresh();
                applySession(u, h, o, r);
            } catch {
                // No valid session — stay logged out
            } finally {
                setIsLoading(false);
            }
        }
        // Only try once Privy is ready and not authenticated
        // (if Privy is authenticated it will trigger the auth flow instead)
        if (ready && !authenticated) {
            restoreSession();
        }
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    function applySession(u: AuthUser, h: boolean, o: AuthOrg | null, r?: string | null) {
        setUser(u);
        setHasOrg(h);
        setOrg(o);
        if (r !== undefined) setRole(r);
    }

    const setSession = useCallback(
        (u: AuthUser, h: boolean, o: AuthOrg | null, r?: string | null) => {
            applySession(u, h, o, r);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    // Retry backend auth without re-triggering Privy (Privy session already exists)
    const retryAuth = useCallback(async () => {
        handledPrivyLogin.current = false; // allow re-run after retry
        await runBackendAuth();
        handledPrivyLogin.current = true;
    }, [runBackendAuth]);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch { /* ignore */ }
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
                isLoading: isLoading || !ready,
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
