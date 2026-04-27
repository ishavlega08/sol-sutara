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
    user:            AuthUser | null;
    org:             AuthOrg | null;
    role:            string | null;
    hasOrg:          boolean;
    isLoading:       boolean;
    isAuthenticated: boolean;
    login:           () => void;
    logout:          () => Promise<void>;
    setSession:      (user: AuthUser, hasOrg: boolean, org: AuthOrg | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState>({
    user:            null,
    org:             null,
    role:            null,
    hasOrg:          false,
    isLoading:       true,
    isAuthenticated: false,
    login:           () => {},
    logout:          async () => {},
    setSession:      () => {},
});

export function useAuth() {
    return useContext(AuthContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout, getAccessToken } = usePrivy();

    const [user,      setUser]      = useState<AuthUser | null>(null);
    const [org,       setOrg]       = useState<AuthOrg  | null>(null);
    const [role,      setRole]      = useState<string   | null>(null);
    const [hasOrg,    setHasOrg]    = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Prevent double-processing the same Privy login event
    const handledPrivyLogin = useRef(false);

    // ── Restore session on mount via refresh cookie ───────────────────────────
    useEffect(() => {
        async function restoreSession() {
            try {
                const { user: u, org: o, hasOrg: h } = await apiRefresh();
                applySession(u, h, o);
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

        async function handlePrivyAuth() {
            setIsLoading(true);
            try {
                const privyToken = await getAccessToken();
                if (!privyToken) throw new Error("No Privy access token");

                const { user: u, org: o, hasOrg: h } = await apiLogin(privyToken);
                applySession(u, h, o);
            } catch (err) {
                console.error("Auth error:", err);
            } finally {
                setIsLoading(false);
            }
        }

        handlePrivyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, authenticated, privyUser]);

    // Reset the flag when Privy logs out
    useEffect(() => {
        if (!authenticated) {
            handledPrivyLogin.current = false;
        }
    }, [authenticated]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    function applySession(u: AuthUser, h: boolean, o: AuthOrg | null) {
        setUser(u);
        setHasOrg(h);
        setOrg(o);
        // role is embedded in org membership — the backend returns it via the
        // access cookie; surface it separately if the API returns it
    }

    const setSession = useCallback(
        (u: AuthUser, h: boolean, o: AuthOrg | null) => {
            applySession(u, h, o);
        },
        []
    );

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch { /* ignore */ }
        await privyLogout();
        setUser(null);
        setOrg(null);
        setRole(null);
        setHasOrg(false);
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
                login:  privyLogin,
                logout,
                setSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
