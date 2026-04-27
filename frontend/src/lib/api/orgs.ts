import client from "./client";

export interface OrgMember {
    userId:   string;
    email:    string | null;
    role:     string;
    joinedAt: string;
}

export interface OrgInviteResult {
    id:        string;
    token:     string;
    email:     string;
    role:      string;
    expiresAt: string;
}

export interface InviteDetails {
    orgName:      string;
    inviterEmail: string | null;
    role:         string;
    expiresAt:    string;
}

export async function createOrg(name: string) {
    const res = await client.post<{ success: boolean; org: { id: string; name: string; slug: string } }>("/orgs", { name });
    return res.data;
}

export async function joinOrg(token: string) {
    const res = await client.post<{ success: boolean; org: { id: string; name: string } }>("/orgs/join", { token });
    return res.data;
}

export async function getOrgMembers(orgId: string) {
    const res = await client.get<{ success: boolean; members: OrgMember[] }>(`/orgs/${orgId}/members`);
    return res.data;
}

export async function createInvite(orgId: string, email: string, role: string) {
    const res = await client.post<{ success: boolean; invite: OrgInviteResult }>(`/orgs/${orgId}/invites`, { email, role });
    return res.data;
}

export async function updateMemberRole(orgId: string, userId: string, role: string) {
    const res = await client.patch(`/orgs/${orgId}/members/${userId}/role`, { role });
    return res.data;
}

export async function removeMember(orgId: string, userId: string) {
    const res = await client.delete(`/orgs/${orgId}/members/${userId}`);
    return res.data;
}

export async function getInviteDetails(token: string) {
    const res = await client.get<{ success: boolean; invite: InviteDetails }>(`/orgs/invite/${token}`);
    return res.data;
}
