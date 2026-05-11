import client from "./client";
import type { AuthUser, AuthOrg } from "@/context/AuthContext";

interface SessionResponse {
    success: boolean;
    user:    AuthUser;
    org:     AuthOrg | null;
    hasOrg:  boolean;
    role:    string | null;
}

export async function apiLogin(privyToken: string): Promise<SessionResponse> {
    const res = await client.post<SessionResponse>("/auth/login", { privyToken });
    return res.data;
}

// Fast session read — reads the access JWT (no DB). Throws on 401.
export async function apiMe(): Promise<SessionResponse> {
    const res = await client.get<SessionResponse>("/auth/me");
    return res.data;
}

export async function apiRefresh(): Promise<SessionResponse> {
    const res = await client.post<SessionResponse>("/auth/refresh", {});
    return res.data;
}

export async function apiLogout(): Promise<void> {
    await client.post("/auth/logout", {});
}
