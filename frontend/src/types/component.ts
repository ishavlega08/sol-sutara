// ── POST /components ──────────────────────────────────────────────────────────

export interface CreateComponentPayload {
  name: string;
  type: string;
  supplier: string;
  metadata: Record<string, string>;
}

export interface CreatedComponent {
  id: string;
  name: string;
  metadataURI: string;
  txHash: string;
  onChainAddress: string;
}

export interface CreateComponentResponse {
  success: boolean;
  component: CreatedComponent;
}

// ── GET /components ───────────────────────────────────────────────────────────

export interface ComponentListItem {
  id: string;
  name: string;
  type: string;
  supplier: string;
  metadata_uri: string;
  on_chain_address: string;
  tx_hash: string;
  created_at: string;
}

export interface GetComponentsResponse {
  success: boolean;
  components: ComponentListItem[];
}
