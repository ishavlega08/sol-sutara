import { createHash, randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { verifyPrivyToken } from "../utils/privy";
import { signAccessToken } from "../utils/jwt";
import type { JwtPayload, LoginResult } from "../types/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

function generateRefreshToken(): string {
    return randomBytes(40).toString("hex");
}

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ─── loginWithPrivy ───────────────────────────────────────────────────────────

export async function loginWithPrivy(privyToken: string): Promise<LoginResult & { rawRefreshToken: string }> {
    const { privyDid, email, walletAddress } = await verifyPrivyToken(privyToken);

    // Run user upsert and a fresh token in parallel
    const [user] = await Promise.all([
        prisma.user.upsert({
            where:  { privy_did: privyDid },
            update: { email: email ?? undefined, wallet_address: walletAddress ?? undefined },
            create: { privy_did: privyDid, email, wallet_address: walletAddress },
        }),
    ]);

    const membership = await prisma.organizationMember.findFirst({
        where:   { user_id: user.id },
        orderBy: { joined_at: "asc" },
        include: { org: { select: { id: true, name: true } } },
    });

    const rawRefreshToken = generateRefreshToken();

    const payload: JwtPayload = {
        userId:        user.id,
        privyDid:      user.privy_did,
        orgId:         membership?.org_id,
        role:          membership?.role,
        email:         user.email ?? null,
        walletAddress: user.wallet_address ?? null,
        orgName:       membership?.org.name ?? null,
    };

    // Create refresh token and sign access token in parallel
    const [accessToken] = await Promise.all([
        Promise.resolve(signAccessToken(payload)),
        prisma.refreshToken.create({
            data: {
                user_id:    user.id,
                token_hash: hashToken(rawRefreshToken),
                expires_at: new Date(Date.now() + REFRESH_TTL_MS),
            },
        }),
    ]);

    return {
        accessToken,
        rawRefreshToken,
        user: {
            id:            user.id,
            email:         user.email ?? null,
            walletAddress: user.wallet_address ?? null,
        },
        hasOrg: !!membership,
        org:    membership ? { id: membership.org_id, name: membership.org.name } : null,
        role:   membership?.role ?? null,
    };
}

// ─── refreshSession ───────────────────────────────────────────────────────────
// Validates refresh token, rotates it, and returns a fresh access token.
// Optimized: DB lookup + revoke + new membership + new token — parallelized.

export async function refreshSession(rawRefreshToken: string): Promise<LoginResult & { rawRefreshToken: string }> {
    const tokenHash = hashToken(rawRefreshToken);

    const stored = await prisma.refreshToken.findFirst({
        where:   { token_hash: tokenHash, revoked: false },
        include: { user: true },
    });

    if (!stored)                       throw new Error("Invalid refresh token");
    if (stored.expires_at < new Date()) throw new Error("Refresh token expired");

    const newRawToken = generateRefreshToken();

    // Revoke old token, fetch membership, create new token — all in parallel
    const [membership] = await Promise.all([
        prisma.organizationMember.findFirst({
            where:   { user_id: stored.user_id },
            orderBy: { joined_at: "asc" },
            include: { org: { select: { id: true, name: true } } },
        }),
        prisma.refreshToken.update({
            where: { id: stored.id },
            data:  { revoked: true },
        }),
        prisma.refreshToken.create({
            data: {
                user_id:    stored.user_id,
                token_hash: hashToken(newRawToken),
                expires_at: new Date(Date.now() + REFRESH_TTL_MS),
            },
        }),
    ]);

    const payload: JwtPayload = {
        userId:        stored.user.id,
        privyDid:      stored.user.privy_did,
        orgId:         membership?.org_id,
        role:          membership?.role,
        email:         stored.user.email ?? null,
        walletAddress: stored.user.wallet_address ?? null,
        orgName:       membership?.org.name ?? null,
    };

    const accessToken = signAccessToken(payload);

    return {
        accessToken,
        rawRefreshToken: newRawToken,
        user: {
            id:            stored.user.id,
            email:         stored.user.email ?? null,
            walletAddress: stored.user.wallet_address ?? null,
        },
        hasOrg: !!membership,
        org:    membership ? { id: membership.org_id, name: membership.org.name } : null,
        role:   membership?.role ?? null,
    };
}

// ─── revokeRefreshToken ───────────────────────────────────────────────────────

export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
        where: { token_hash: tokenHash },
        data:  { revoked: true },
    });
}
