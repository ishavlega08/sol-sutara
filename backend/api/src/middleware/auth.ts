import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../lib/prisma";

export const ACCESS_COOKIE  = "sol_access";
export const REFRESH_COOKIE = "sol_refresh";

// ─── authenticateToken ────────────────────────────────────────────────────────
// Reads the access JWT from the httpOnly cookie (falls back to Authorization
// header so CLI / server-side callers still work).

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const cookieToken = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    const header      = req.headers.authorization;
    const headerToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const token       = cookieToken ?? headerToken;

    if (!token) {
        return res.status(401).json({ success: false, error: "Authentication required" });
    }

    try {
        req.user = verifyAccessToken(token);
        next();
    } catch {
        return res.status(401).json({ success: false, error: "Session expired — please refresh" });
    }
}

// ─── requireRole ──────────────────────────────────────────────────────────────
// Usage: requireRole("ADMIN", "OWNER")

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?.role || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: "Insufficient permissions" });
        }
        next();
    };
}

// ─── requireOrg ───────────────────────────────────────────────────────────────
// Ensures the JWT carries an orgId (user has joined or created an org).

export function requireOrg(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.orgId) {
        return res.status(403).json({
            success: false,
            error: "Organization membership required",
        });
    }
    next();
}

// ─── requireOrgMembership ─────────────────────────────────────────────────────
// Re-validates DB membership for routes with an :orgId URL param, and
// refreshes role on req.user from the DB (in case it changed since token was
// issued).

export async function requireOrgMembership(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const orgId = (req.params["orgId"] as string | undefined) ?? req.user?.orgId;
    if (!orgId || !req.user?.userId) {
        return res.status(403).json({ success: false, error: "Organization membership required" });
    }

    try {
        const member = await prisma.organizationMember.findUnique({
            where: { org_id_user_id: { org_id: orgId, user_id: req.user.userId } },
        });

        if (!member) {
            return res.status(403).json({ success: false, error: "Not a member of this organization" });
        }

        req.user.orgId = orgId;
        req.user.role  = member.role;
        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
