// ── POST /components ──────────────────────────────────────────────────────────

export interface CreateComponentPayload {
  name:          string;
  type:          string;
  supplier:      string;
  metadata:      Record<string, string>;
  batch_number?: string;
  lot_number?:   string;
  quantity?:     number;
  unit?:         string;
  expiry_date?:  string;
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
  id:               string;
  name:             string;
  type:             string;
  supplier:         string;
  metadata_uri:     string;
  on_chain_address: string | null;
  on_chain_id:      string | null;
  tx_hash:          string | null;
  created_at:       string;
  org_id:           string | null;
  // Batch / lot / quantity (Feature D)
  batch_number:     string | null;
  lot_number:       string | null;
  quantity:         number | null;
  unit:             string | null;
  expiry_date:      string | null;
  // Status lifecycle (Feature E)
  status:           ComponentStatus;
}

export type ComponentStatus = "CREATED" | "IN_TRANSIT" | "RECEIVED" | "INSPECTED" | "RECALLED" | "ARCHIVED";

export interface GetComponentsResponse {
  success: boolean;
  components: ComponentListItem[];
}

// ── GET /components/:id ───────────────────────────────────────────────────────

export interface GetComponentByIdResponse {
  success: boolean;
  component: ComponentListItem;
}

// ── GET /components/:id/children ─────────────────────────────────────────────

export interface ChildLink {
  linkId: string;
  txHash: string;
  createdAt: string;
  child: {
    id: string;
    name: string;
    type: string;
    onChainId: string | null;
    onChainAddress: string | null;
  };
}

export interface GetChildrenResponse {
  success: boolean;
  children: ChildLink[];
}

// ── GET /components/:id/trace ─────────────────────────────────────────────────

export interface TraceNode {
  id: string;
  name: string;
  type: string;
  supplier: string | null;
  on_chain_id: string | null;
  metadata_uri: string;
  tx_hash: string | null;
  created_at: string;
  parents: TraceNode[];
}

export interface GetTraceResponse {
  success: boolean;
  trace: TraceNode;
}

// ── GET /components/:id/affected ─────────────────────────────────────────────

export interface AffectedComponent {
  id: string;
  name: string;
  type: string;
  supplier: string | null;
  on_chain_id: string | null;
  tx_hash: string | null;
  depth: number;
  parentId: string;
}

export interface GetAffectedResponse {
  success: boolean;
  root: { id: string; name: string; type: string };
  affected: AffectedComponent[];
  total: number;
}

// ── GET /components/:id/risk ──────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskScore {
  componentId: string;
  score: number;
  level: RiskLevel;
  factors: {
    parentCount: number;
    childCount: number;
    upstreamDepth: number;
    downstreamDepth: number;
    reuseFrequency: number;
  };
  explanation: string[];
}

export interface GetRiskResponse {
  success: boolean;
  risk: RiskScore;
}

// ── GET /analytics ────────────────────────────────────────────────────────────

export interface AnalyticsResult {
  totalComponents: number;
  totalLinks: number;
  maxGraphDepth: number;
  avgParentsPerNode: number;
  mostReused: Array<{ id: string; name: string; type: string; childCount: number }>;
  recallImpact: Array<{ id: string; name: string; type: string; affectedCount: number }>;
  componentsByType: Array<{ type: string; count: number }>;
  orgId: string | null;
}

export interface GetAnalyticsResponse {
  success: boolean;
  analytics: AnalyticsResult;
}

// ── GET /dashboard/stats ──────────────────────────────────────────────────────

export interface ActivityItem {
  type:  "CREATE" | "LINK";
  label: string;
  time:  string;
  id:    string;
}

export interface DashboardStats {
  totalComponents:   number;
  totalLinks:        number;
  maxGraphDepth:     number;
  highRiskCount:     number;
  activeRecallCount: number;
  recentActivity:    ActivityItem[];
}

export interface GetDashboardStatsResponse {
  success: boolean;
  stats:   DashboardStats;
}

// ── GET /dashboard/links ──────────────────────────────────────────────────────

export interface RecentLink {
  id:         string;
  parentId:   string;
  parentName: string;
  childId:    string;
  childName:  string;
  txHash:     string;
  createdAt:  string;
  when:       string;
}

export interface GetRecentLinksResponse {
  success: boolean;
  links:   RecentLink[];
}

// ── GET /dashboard/risks ──────────────────────────────────────────────────────

export interface ComponentRiskSummary {
  id:    string;
  name:  string;
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH";
}

export interface GetBatchRiskResponse {
  success: boolean;
  risks:   ComponentRiskSummary[];
}

// ── GET /dashboard/links/all ──────────────────────────────────────────────────

export interface OrgLink {
  id:       string;
  parentId: string;
  childId:  string;
  txHash:   string;
}

export interface GetAllLinksResponse {
  success: boolean;
  links:   OrgLink[];
}

// ── GET /analytics/timeseries ─────────────────────────────────────────────────

export interface TimeSeriesData {
  weeks:      string[];
  components: number[];
  links:      number[];
}

export interface GetTimeSeriesResponse {
  success:    boolean;
  timeSeries: TimeSeriesData;
}

// ── GET /recalls ──────────────────────────────────────────────────────────────

export type RecallStatus = "ACTIVE" | "RESOLVED";

export interface RecallRecord {
  id:          string;
  componentId: string;
  reason:      string;
  scope:       string;
  issuedBy:    string;
  issuedAt:    string;
  resolvedAt:  string | null;
  status:      RecallStatus;
  orgId:       string | null;
  component:   { id: string; name: string; type: string };
  issuer:      { email: string | null };
}

export interface GetActiveRecallsResponse {
  success: boolean;
  recalls: RecallRecord[];
}

export interface CreateRecallPayload {
  componentId: string;
  reason:      string;
  scope:       string;
}

export interface CreateRecallResponse {
  success: boolean;
  recall:  RecallRecord;
}

// ── GET /components/:id/events ────────────────────────────────────────────────

export interface ComponentEvent {
  id:         string;
  fromStatus: ComponentStatus | null;
  toStatus:   ComponentStatus;
  changedBy:  string;
  notes:      string | null;
  createdAt:  string;
}

export interface GetEventsResponse {
  success: boolean;
  events:  ComponentEvent[];
}

export interface PatchStatusPayload {
  status: ComponentStatus;
  notes?: string;
}

// ── GET /components/:id/verify ────────────────────────────────────────────────

export interface VerifyResult {
  verified:       boolean;
  onChainAddress: string | null;
  slot:           number | null;
  lamports:       number | null;
  error:          string | null;
}

export interface GetVerifyResponse {
  success: boolean;
  verified:       boolean;
  onChainAddress: string | null;
  slot:           number | null;
  lamports:       number | null;
  error:          string | null;
}
