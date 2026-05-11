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

export async function apiRefresh(): Promise<SessionResponse> {
    const res = await client.post<SessionResponse>("/auth/refresh", {});
    return res.data;
}

export async function apiLogout(): Promise<void> {
    await client.post("/auth/logout", {});
}
