import { Request, Response } from "express";
import { loginWithPrivy, refreshSession, revokeRefreshToken } from "../services/auth.service";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../middleware/auth";

const IS_PROD = process.env.NODE_ENV === "production";

const ACCESS_COOKIE_OPTS = {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "strict" as const,
    maxAge:   15 * 60 * 1000,          // 15 minutes
    path:     "/",
};

const REFRESH_COOKIE_OPTS = {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "strict" as const,
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    path:     "/",
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_COOKIE,  accessToken,  ACCESS_COOKIE_OPTS);
    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
}

function clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE,  { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function loginHandler(req: Request, res: Response) {
    const { privyToken } = req.body as { privyToken?: string };

    if (!privyToken) {
        return res.status(400).json({ success: false, error: "privyToken is required" });
    }

    try {
        const { accessToken, rawRefreshToken, user, hasOrg, org, role } = await loginWithPrivy(privyToken);
        setAuthCookies(res, accessToken, rawRefreshToken);
        return res.status(200).json({ success: true, user, hasOrg, org, role });
    } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("invalid") || msg.includes("Invalid") || msg.includes("token")) {
            return res.status(401).json({ success: false, error: "Invalid Privy token" });
        }
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
// Cookie is sent automatically by the browser; body fallback for non-browser.

export async function refreshHandler(req: Request, res: Response) {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined)
               ?? (req.body as { refreshToken?: string })?.refreshToken;

    if (!token) {
        return res.status(401).json({ success: false, error: "No refresh token" });
    }

    try {
        const { accessToken, rawRefreshToken, user, hasOrg, org, role } = await refreshSession(token);
        setAuthCookies(res, accessToken, rawRefreshToken);
        return res.status(200).json({ success: true, user, hasOrg, org, role });
    } catch (err: unknown) {
        console.error(err);
        clearAuthCookies(res);
        return res.status(401).json({ success: false, error: "Session expired — please log in again" });
    }
}

// ─── GET /api/auth/me — zero-DB session check ────────────────────────────────
// Reads the access JWT (already verified by authenticateToken middleware) and
// returns the full session without hitting the database. Used on every page
// load by the frontend to restore session state instantly.

export function meHandler(req: Request, res: Response) {
    const u = req.user!;
    return res.json({
        success: true,
        user: {
            id:            u.userId,
            email:         u.email         ?? null,
            walletAddress: u.walletAddress  ?? null,
        },
        hasOrg: !!u.orgId,
        org:    u.orgId ? { id: u.orgId, name: u.orgName ?? "" } : null,
        role:   u.role ?? null,
    });
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export async function logoutHandler(req: Request, res: Response) {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined)
               ?? (req.body as { refreshToken?: string })?.refreshToken;

    if (token) {
        await revokeRefreshToken(token).catch(console.error);
    }

    clearAuthCookies(res);
    return res.status(200).json({ success: true });
}
