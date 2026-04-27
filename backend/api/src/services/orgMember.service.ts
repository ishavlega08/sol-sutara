import { randomBytes } from "crypto";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { signAccessToken } from "../utils/jwt";
import type { JwtPayload } from "../types/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || "org";
}

async function uniqueSlug(base: string): Promise<string> {
    let slug = base;
    let i    = 0;
    while (await prisma.organization.findUnique({ where: { slug } })) {
        slug = `${base}-${++i}`;
    }
    return slug;
}

function issueToken(userId: string, privyDid: string, orgId: string, role: Role): string {
    const payload: JwtPayload = { userId, privyDid, orgId, role };
    return signAccessToken(payload);
}

// ─── createOrgForUser ─────────────────────────────────────────────────────────

export async function createOrgForUser(name: string, userId: string, privyDid: string) {
    const slug = await uniqueSlug(toSlug(name));

    const org = await prisma.organization.create({
        data: {
            name,
            slug,
            created_by: userId,
            members: {
                create: { user_id: userId, role: "OWNER" },
            },
        },
    });

    return {
        org,
        accessToken: issueToken(userId, privyDid, org.id, "OWNER"),
    };
}

// ─── joinOrgByInvite ──────────────────────────────────────────────────────────

export async function joinOrgByInvite(token: string, userId: string, privyDid: string) {
    const invite = await prisma.orgInvite.findUnique({ where: { token } });

    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "PENDING") throw new Error("Invite already used or expired");
    if (invite.expires_at < new Date()) {
        await prisma.orgInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
        throw new Error("Invite has expired");
    }

    const alreadyMember = await prisma.organizationMember.findUnique({
        where: { org_id_user_id: { org_id: invite.org_id, user_id: userId } },
    });
    if (alreadyMember) throw new Error("Already a member of this organization");

    const [member] = await prisma.$transaction([
        prisma.organizationMember.create({
            data: { org_id: invite.org_id, user_id: userId, role: invite.role },
        }),
        prisma.orgInvite.update({
            where: { id: invite.id },
            data:  { status: "ACCEPTED" },
        }),
    ]);

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: invite.org_id } });

    return {
        org,
        member,
        accessToken: issueToken(userId, privyDid, invite.org_id, invite.role),
    };
}

// ─── getOrgWithMembers ────────────────────────────────────────────────────────

export async function getOrgWithMembers(orgId: string) {
    return prisma.organization.findUnique({
        where:   { id: orgId },
        include: {
            members: {
                include: { user: true },
                orderBy: { joined_at: "asc" },
            },
        },
    });
}

// ─── createInvite ─────────────────────────────────────────────────────────────

export async function createInvite(
    orgId:     string,
    invitedBy: string,
    email:     string,
    role:      Role
) {
    const token = randomBytes(32).toString("hex");

    return prisma.orgInvite.create({
        data: {
            org_id:     orgId,
            invited_by: invitedBy,
            email,
            role,
            token,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
}

// ─── updateMemberRole ─────────────────────────────────────────────────────────

export async function updateMemberRole(
    orgId:       string,
    targetUserId: string,
    newRole:     Role,
    requesterId: string
) {
    if (targetUserId === requesterId) throw new Error("Cannot change your own role");

    const member = await prisma.organizationMember.findUnique({
        where: { org_id_user_id: { org_id: orgId, user_id: targetUserId } },
    });
    if (!member) throw new Error("Member not found");

    return prisma.organizationMember.update({
        where: { org_id_user_id: { org_id: orgId, user_id: targetUserId } },
        data:  { role: newRole },
    });
}

// ─── removeMember ─────────────────────────────────────────────────────────────

export async function removeMember(
    orgId:         string,
    targetUserId:  string,
    requesterId:   string,
    requesterRole: string
) {
    if (targetUserId === requesterId) throw new Error("Cannot remove yourself");

    const target = await prisma.organizationMember.findUnique({
        where: { org_id_user_id: { org_id: orgId, user_id: targetUserId } },
    });
    if (!target) throw new Error("Member not found");

    if (requesterRole === "ADMIN" && target.role === "OWNER") {
        throw new Error("Admins cannot remove an Owner");
    }

    return prisma.organizationMember.delete({
        where: { org_id_user_id: { org_id: orgId, user_id: targetUserId } },
    });
}

// ─── getInviteDetails ─────────────────────────────────────────────────────────

export async function getInviteDetails(token: string) {
    return prisma.orgInvite.findUnique({
        where:   { token },
        include: { org: true, inviter: true },
    });
}
