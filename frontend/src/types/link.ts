// ── POST /components/link ─────────────────────────────────────────────────────

export interface LinkComponentPayload {
  parentId: string;
  childId: string;
}

export interface ComponentLink {
  parentId: string;
  childId: string;
  txHash: string;
  createdAt: string;
}

export interface LinkComponentResponse {
  success: boolean;
  link: ComponentLink;
}

// ── GET /components/:id/parents ───────────────────────────────────────────────

export interface ParentComponent {
  id: string;
  name: string;
  onChainId: string;
  onChainAddress: string;
}

export interface ParentLink {
  linkId: string;
  txHash: string;
  createdAt: string;
  parent: ParentComponent;
}

export interface GetParentsResponse {
  success: boolean;
  parents: ParentLink[];
}
