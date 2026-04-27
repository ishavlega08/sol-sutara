export interface JwtPayload {
    userId:   string;
    privyDid: string;
    orgId?:   string;
    role?:    string;
}

export interface PrivyUserInfo {
    privyDid:      string;
    email?:        string;
    walletAddress?: string;
}

export interface LoginResult {
    accessToken:   string;
    user: {
        id:            string;
        email:         string | null;
        walletAddress: string | null;
    };
    hasOrg: boolean;
    org:    { id: string; name: string } | null;
}
