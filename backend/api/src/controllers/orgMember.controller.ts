import { Request, Response } from "express";
import { Role } from "@prisma/client";
import {
    createOrgForUser,
    joinOrgByInvite,
    getOrgWithMembers,
    createInvite,
    updateMemberRole,
    removeMember,
    getInviteDetails,
} from "../services/orgMember.service";
import { prisma } from "../lib/prisma";
import { ACCESS_COOKIE } from "../middleware/auth";

const IS_PROD = process.env.NODE_ENV === "production";

const ACCESS_COOKIE_OPTS = {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "strict" as const,
    maxAge:   15 * 60 * 1000,
    path:     "/",
};

const VALID_ROLES: Role[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

// ─── POST /api/orgs ───────────────────────────────────────────────────────────

export async function createOrgApiHandler(req: Request, res: Response) {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) {
        return res.status(400).json({ success: false, error: "name is required" });
    }

    try {
        const { org, accessToken } = await createOrgForUser(
            name.trim(),
            req.user!.userId,
            req.user!.privyDid
        );
        // Reissue the access cookie with the new orgId + role baked in
        res.cookie(ACCESS_COOKIE, accessToken, ACCESS_COOKIE_OPTS);
        return res.status(201).json({ success: true, org });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── POST /api/orgs/join ──────────────────────────────────────────────────────

export async function joinOrgHandler(req: Request, res: Response) {
    const { token } = req.body as { token?: string };
    if (!token) {
        return res.status(400).json({ success: false, error: "token is required" });
    }

    try {
        const { org, accessToken } = await joinOrgByInvite(
            token,
            req.user!.userId,
            req.user!.privyDid
        );
        res.cookie(ACCESS_COOKIE, accessToken, ACCESS_COOKIE_OPTS);
        return res.status(200).json({ success: true, org });
    } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found"))   return res.status(404).json({ success: false, error: msg });
        if (msg.includes("expired") || msg.includes("used")) return res.status(410).json({ success: false, error: msg });
        if (msg.includes("Already"))     return res.status(409).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /api/orgs/:orgId ─────────────────────────────────────────────────────

export async function getOrgApiHandler(req: Request, res: Response) {
    const orgId = req.params["orgId"] as string;

    try {
        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) return res.status(404).json({ success: false, error: "Organization not found" });
        return res.status(200).json({ success: true, org, role: req.user!.role });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /api/orgs/:orgId/members ─────────────────────────────────────────────

export async function getOrgMembersHandler(req: Request, res: Response) {
    const orgId = req.params["orgId"] as string;

    try {
        const org = await getOrgWithMembers(orgId);
        if (!org) return res.status(404).json({ success: false, error: "Organization not found" });

        const members = org.members.map((m) => ({
            userId:   m.user_id,
            email:    m.user.email,
            role:     m.role,
            joinedAt: m.joined_at,
        }));

        return res.status(200).json({ success: true, members });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── POST /api/orgs/:orgId/invites ────────────────────────────────────────────

export async function createInviteHandler(req: Request, res: Response) {
    const orgId = req.params["orgId"] as string;
    const { email, role } = req.body as { email?: string; role?: string };

    if (!email || !role) {
        return res.status(400).json({ success: false, error: "email and role are required" });
    }
    if (!VALID_ROLES.includes(role as Role)) {
        return res.status(400).json({ success: false, error: `role must be one of: ${VALID_ROLES.join(", ")}` });
    }

    try {
        const invite = await createInvite(orgId, req.user!.userId, email, role as Role);
        return res.status(201).json({
            success: true,
            invite: {
                id:        invite.id,
                token:     invite.token,
                email:     invite.email,
                role:      invite.role,
                expiresAt: invite.expires_at,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── PATCH /api/orgs/:orgId/members/:userId/role ──────────────────────────────

export async function updateRoleHandler(req: Request, res: Response) {
    const { orgId, userId } = req.params as { orgId: string; userId: string };
    const { role } = req.body as { role?: string };

    const allowedToAssign: Role[] = ["ADMIN", "MEMBER", "VIEWER"];
    if (!role || !allowedToAssign.includes(role as Role)) {
        return res.status(400).json({
            success: false,
            error: `role must be one of: ${allowedToAssign.join(", ")}`,
        });
    }

    try {
        const member = await updateMemberRole(orgId, userId, role as Role, req.user!.userId);
        return res.status(200).json({ success: true, member });
    } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) return res.status(404).json({ success: false, error: msg });
        if (msg.includes("Cannot"))    return res.status(400).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── DELETE /api/orgs/:orgId/members/:userId ──────────────────────────────────

export async function removeMemberHandler(req: Request, res: Response) {
    const { orgId, userId } = req.params as { orgId: string; userId: string };

    try {
        await removeMember(orgId, userId, req.user!.userId, req.user!.role ?? "");
        return res.status(200).json({ success: true });
    } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found"))  return res.status(404).json({ success: false, error: msg });
        if (msg.includes("Cannot") || msg.includes("cannot")) return res.status(403).json({ success: false, error: msg });
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ─── GET /api/orgs/invite/:token ──────────────────────────────────────────────

export async function getInviteDetailsHandler(req: Request, res: Response) {
    const { token } = req.params as { token: string };

    try {
        const invite = await getInviteDetails(token);

        if (!invite)                         return res.status(404).json({ success: false, error: "Invite not found" });
        if (invite.status !== "PENDING")     return res.status(410).json({ success: false, error: "Invite is no longer valid" });
        if (invite.expires_at < new Date())  return res.status(410).json({ success: false, error: "Invite has expired" });

        return res.status(200).json({
            success: true,
            invite: {
                orgName:      invite.org.name,
                inviterEmail: invite.inviter.email,
                role:         invite.role,
                expiresAt:    invite.expires_at,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
