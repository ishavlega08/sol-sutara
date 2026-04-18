export interface OnChainResult {
    txHash: string;
    componentAddress: string;
}

export async function createComponentOnChain(
    componentId: string,
    metadataUri: string
): Promise<OnChainResult> {
    // Mock: real implementation will call Solana program via @coral-xyz/anchor
    console.log(`[web3] Mocking on-chain creation for ${componentId}`);
    return {
        txHash: `mock_tx_${componentId.slice(0, 8)}`,
        componentAddress: `mock_addr_${componentId.slice(0, 8)}`,
    };
}
