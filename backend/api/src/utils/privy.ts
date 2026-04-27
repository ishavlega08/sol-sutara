import { PrivyClient } from "@privy-io/node";
import type { PrivyUserInfo } from "../types/auth";

let _client: PrivyClient | null = null;

function getClient(): PrivyClient {
    if (!_client) {
        _client = new PrivyClient({
            appId:     process.env.PRIVY_APP_ID!,
            appSecret: process.env.PRIVY_APP_SECRET!,
        });
    }
    return _client;
}

export async function verifyPrivyToken(token: string): Promise<PrivyUserInfo> {
    const client = getClient();

    // Verify the access token — throws if invalid or expired
    const claims = await client.utils().auth().verifyAccessToken(token);

    // Fetch full user to extract email and Solana wallet
    const user = await client.users()._get(claims.user_id);

    const emailAccount = user.linked_accounts.find((a) => a.type === "email");
    const solanaWallet = user.linked_accounts.find(
        (a) => a.type === "wallet" && (a as unknown as Record<string, unknown>)["chain_type"] === "solana"
    );

    return {
        privyDid:      claims.user_id,
        email:         (emailAccount as Record<string, unknown> | undefined)?.["address"] as string | undefined,
        walletAddress: (solanaWallet  as Record<string, unknown> | undefined)?.["address"] as string | undefined,
    };
}
