# Sol Sutara

Supply chain trust infrastructure on Solana. Every component creation and link is a real on-chain transaction. Metadata is SHA-256 hashed and pinned to IPFS. Recall blast radius is computed in real time via BFS traversal.

**Live:** [solsutara.com](https://solsutara.com)  
**Anchor Program (Devnet):** `3Kzq31P89HkR8SEofcmE8AU52pCdAxyFUwwFFscJHxgm`

---

## Repository Structure

```
sol-sutara/
├── backend/
│   ├── program/          # Anchor smart contract (Rust)
│   ├── api/              # Express REST API (TypeScript)
│   ├── client/           # Test scripts for on-chain interactions
│   └── indexer/          # Event indexer (TypeScript)
└── frontend/             # Next.js 14 App Router (TypeScript)
```

---

## Architecture

```
Frontend (Next.js)
      │
      ▼
REST API (Express + Prisma + PostgreSQL)
      │
      ├──▶ Solana Devnet  (Anchor program — component PDAs, link instructions)
      └──▶ IPFS / Pinata  (component metadata — SHA-256 hashed, content-addressed)
```

Every component creation:
1. Uploads JSON metadata to IPFS via Pinata (real CID)
2. Submits `create_component` instruction to the Anchor program → produces a PDA and `txHash`
3. Stores `on_chain_address`, `on_chain_id`, and `tx_hash` in PostgreSQL

Every component link:
1. Validates both components have confirmed on-chain addresses
2. Submits `link_components` instruction → produces a `txHash`
3. Records the link in PostgreSQL with the on-chain `tx_hash`

---

## Backend

### Anchor Program (`backend/program/`)

Written in Rust using the Anchor framework.

**Instructions:**

| Instruction | Description |
|---|---|
| `initialize_counter` | Bootstraps the global PDA counter (runs once) |
| `create_component` | Creates a component PDA seeded by `[b"component", creator_pubkey, component_id]`. Stores `metadata_uri`, `creator`, `timestamp`, and parent IDs. Emits `ComponentCreated` event. |
| `link_components` | Appends parent ID to child component's `parents` vec. Validates no self-link, no duplicate link, max 10 parents. Emits `ComponentLinked` event. |

**Account structs:**

- `GlobalCounter` — global PDA (`seeds = [b"counter"]`), tracks `total_components: u64`
- `Component` — per-component PDA, stores `component_id`, `metadata_uri`, `creator`, `timestamp`, `parents: Vec<u64>` (max 10)

**Error codes:** `EmptyMetadataUri`, `MetadataUriTooLong`, `CounterOverflow`, `SelfLink`, `DuplicateLink`, `TooManyParents`

**Build:**
```bash
cd backend
anchor build
```

---

### REST API (`backend/api/`)

**Stack:** Express 5, Prisma 7, PostgreSQL, TypeScript

**Setup:**
```bash
cd backend/api
npm install
cp .env.example .env   # fill in required vars (see below)
npx prisma migrate deploy
npm run dev
```

**Environment variables:**

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `PRIVY_APP_ID` | Yes | Privy app ID for auth |
| `PRIVY_APP_SECRET` | Yes | Privy app secret |
| `SERVER_KEYPAIR` | Yes | Solana keypair JSON array — signs all on-chain transactions |
| `RPC_URL` | No | Solana RPC endpoint (defaults to `clusterApiUrl("devnet")`) |
| `PINATA_API_KEY` | No | Pinata API key for IPFS uploads (falls back to mock URI if unset) |
| `PINATA_SECRET_KEY` | No | Pinata secret key |
| `DODO_API_KEY` | No | Dodo Payments API key for billing |
| `DODO_WEBHOOK_SECRET` | No | Dodo webhook signature verification |

**Scripts:**

```bash
npm run dev          # tsx watch — hot reload
npm run build        # tsc compile to dist/
npm run start        # node dist/index.js
npm run seed         # seed small dataset
npm run seed:large   # seed large dataset (~149 components)
```

---

### API Routes

All routes are prefixed with `/api`.

**Auth**

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Exchange Privy token for JWT access + refresh tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Revoke refresh token |

**Components**

| Method | Path | Description |
|---|---|---|
| `GET` | `/components` | List all components for the org |
| `POST` | `/components` | Create component (uploads to IPFS + submits on-chain tx) |
| `GET` | `/components/:id` | Get single component |
| `GET` | `/components/:id/children` | Get direct children (1 level) |
| `GET` | `/components/:id/trace` | Recursive DFS lineage trace. `?depth=N` (1–15, default 10) |
| `GET` | `/components/:id/affected` | BFS downstream blast radius |
| `GET` | `/components/:id/risk` | Risk score (connectivity-based: parent count, child count, upstream/downstream depth, reuse frequency) |
| `GET` | `/components/:id/events` | Audit event log for status changes |
| `PATCH` | `/components/:id/status` | Transition component status |
| `GET` | `/components/:id/verify` | Live RPC call to devnet — confirms PDA account exists (slot, lamports) |
| `POST` | `/components/link` | Link two components on-chain |

**Recalls**

| Method | Path | Description |
|---|---|---|
| `GET` | `/recalls` | List active recalls for the org |
| `POST` | `/recalls` | Issue a recall — marks component `RECALLED`, creates audit event, runs BFS |
| `PATCH` | `/recalls/:id/resolve` | Resolve a recall |

**Dashboard**

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard/stats` | Org stats: total components, total links, max graph depth, active recalls, recent activity |
| `GET` | `/dashboard/links` | Recent component links. `?limit=N` |
| `GET` | `/dashboard/risks` | Batch risk scores for all org components |
| `GET` | `/dashboard/links/all` | All org links (for graph rendering) |

**Analytics**

| Method | Path | Description |
|---|---|---|
| `GET` | `/analytics` | Aggregate stats: most-reused components, recall impact, components by type |
| `GET` | `/analytics/timeseries` | Weekly time series of component and link creation. `?weeks=N` (max 156) |

**Suppliers**

| Method | Path | Description |
|---|---|---|
| `GET` | `/suppliers` | List suppliers |
| `POST` | `/suppliers` | Create supplier profile |
| `GET` | `/suppliers/:id` | Get supplier |
| `PATCH` | `/suppliers/:id` | Update supplier |
| `DELETE` | `/suppliers/:id` | Delete supplier |

**Shipments**

| Method | Path | Description |
|---|---|---|
| `GET` | `/shipments` | List shipments |
| `POST` | `/shipments` | Create shipment |
| `GET` | `/shipments/:id` | Get shipment with event history |
| `PATCH` | `/shipments/:id/status` | Advance shipment status, records event |

**Documents**

| Method | Path | Description |
|---|---|---|
| `GET` | `/documents` | List documents |
| `POST` | `/documents` | Upload document record (INVOICE, CERTIFICATION, CUSTOMS, INSPECTION_REPORT, BILL_OF_LADING, OTHER) |
| `DELETE` | `/documents/:id` | Delete document |

**Webhooks**

| Method | Path | Description |
|---|---|---|
| `GET` | `/webhooks` | List org webhooks |
| `POST` | `/webhooks` | Register webhook endpoint |
| `PATCH` | `/webhooks/:id` | Update webhook |
| `DELETE` | `/webhooks/:id` | Delete webhook |

**Organizations**

| Method | Path | Description |
|---|---|---|
| `GET` | `/orgs/me` | Current user's org and membership |
| `POST` | `/organizations` | Create organization |
| `POST` | `/organizations/:id/invite` | Send invite by email |
| `GET` | `/invite/:token` | Accept invite via token |

**Billing**

| Method | Path | Description |
|---|---|---|
| `GET` | `/billing/plans` | Available plan tiers with limits |
| `GET` | `/billing/usage` | Current period usage for the org |
| `POST` | `/billing/checkout` | Create Dodo Payments checkout session |
| `POST` | `/billing/webhook` | Dodo webhook handler (signature verified) |

**Notifications**

| Method | Path | Description |
|---|---|---|
| `GET` | `/notifications` | List user notifications |
| `PATCH` | `/notifications/:id/read` | Mark as read |

---

### Database Schema (PostgreSQL via Prisma)

**Core models:**

- `User` — authenticated via Privy (email or wallet), linked to orgs via `OrganizationMember`
- `Organization` — tenant boundary for all data; has a plan (`SANDBOX`, `STARTER`, `GROWTH`, `ENTERPRISE`)
- `Subscription` — Dodo Payments subscription record per org
- `OrganizationMember` — role-based membership (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`)
- `OrgInvite` — email invite with token, expiry, and status (`PENDING`, `ACCEPTED`, `EXPIRED`)
- `RefreshToken` — hashed refresh tokens for JWT rotation
- `Component` — core entity: name, type, supplier, `metadata_uri`, `on_chain_address`, `on_chain_id`, `tx_hash`, batch/lot/quantity/expiry fields, `status` lifecycle
- `ComponentLink` — parent-child relationship with `tx_hash` from on-chain link instruction
- `ComponentEvent` — audit log for status transitions (`from_status` → `to_status`, `changed_by`, `notes`)
- `Recall` — issued against a component; BFS traversal computes blast radius at query time

**SCM models:**

- `Supplier` — supplier profile with risk level, certifications, status (`PENDING_REVIEW`, `APPROVED`, `SUSPENDED`, `REJECTED`)
- `Shipment` — shipment tracking with priority, carrier, status (`CREATED` → `DELIVERED`)
- `ShipmentEvent` — audit log for shipment status transitions
- `Document` — file record attached to shipments or suppliers (invoice, certification, etc.)
- `Webhook` — registered endpoint with HMAC secret, event filter list
- `WebhookDelivery` — delivery log with retry tracking
- `Notification` — in-app notifications per user

**Component status lifecycle:**
```
CREATED → IN_TRANSIT → RECEIVED → INSPECTED → RECALLED
                                              ↓
                                           ARCHIVED
```

---

### Services

| Service | Description |
|---|---|
| `web3.service.ts` | Anchor program interaction — `createComponentOnChain`, `linkComponentsOnChain`. Builds provider from `SERVER_KEYPAIR`, manages counter PDA initialization. |
| `metadata.service.ts` | Builds, validates, and deterministically serializes component metadata. SHA-256 hashes the serialized string before upload. |
| `storage.service.ts` | Uploads content to IPFS via Pinata REST API. Falls back to a mock URI if Pinata keys are not set. |
| `component.service.ts` | Orchestrates component creation (metadata → IPFS → on-chain → DB), linking, BFS recall traversal, depth-limited DFS trace. |
| `recall.service.ts` | Creates recalls, marks component status, creates audit events, resolves recalls. |
| `risk.service.ts` | Scores components by graph connectivity: parent count, child count, upstream depth, downstream depth, reuse frequency. |
| `verify.service.ts` | Live RPC call to Solana devnet — checks account exists, returns slot and lamports. Detects and rejects `SEED_` mock addresses. |
| `analytics.service.ts` | Weekly bucketed timeseries (manual bucketing aligned to Monday), aggregate stats, most-reused, recall impact. |
| `auth.service.ts` | Privy token verification, JWT issuance, refresh token rotation. |

---

## Frontend

### Stack

- Next.js 14 (App Router, `"use client"` components)
- React 18
- Tailwind CSS
- React Flow (`reactflow`) — interactive graph visualization
- Lucide React — icons
- Axios — API client

### Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```

**Environment variables:**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `https://api.solsutara.com`) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID for frontend auth |

---

### Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Privy-powered authentication |
| `/onboarding` | Org creation for new users |
| `/dashboard` | Stat cards, recent activity feed, recent links, quick actions — single-screen layout |
| `/components` | Searchable component list with status badges and on-chain indicators |
| `/components/create` | Create component form — name, type, supplier, metadata key/value pairs, batch/lot/quantity/expiry |
| `/components/link` | Link two existing components — parent/child selection with search |
| `/components/[id]` | Component detail: on-chain info, metadata URI, status timeline, children list |
| `/components/[id]/parents` | Parent lineage view |
| `/trace` | Trace graph — select component, choose direction (Upstream / Downstream / Both), set depth (1–15), interactive React Flow graph, JSON export |
| `/recall` | Recall management — issue a recall, BFS blast radius as interactive graph or list view, CSV export |
| `/analytics` | Weekly growth chart (bar chart with Y-axis, grid lines, value labels), aggregate stats, most-reused components |
| `/suppliers` | Supplier list with risk and status |
| `/suppliers/create` | Create supplier profile |
| `/suppliers/[id]` | Supplier detail with linked components and documents |
| `/shipments` | Shipment list with status tracking |
| `/shipments/create` | Create shipment |
| `/shipments/[id]` | Shipment detail with event history |
| `/graph` | Full org supply chain graph |
| `/settings/organization` | Org name, slug |
| `/settings/members` | Member list, invite by email, role management |
| `/settings/webhooks` | Register and manage webhook endpoints |
| `/settings/api-keys` | API key management |
| `/billing/plans` | Plan comparison and upgrade (Sandbox / Starter / Growth / Enterprise) |
| `/billing/invoices` | Billing history |
| `/notifications` | In-app notification feed |

---

### Key Components

| Component | Description |
|---|---|
| `Sidebar` | Navigation with active route highlighting, dark mode toggle |
| `AuthContext` | JWT management, org/user state, token refresh |
| `SupplyChainGraph` | React Flow graph with custom `ComponentNode`, lane dividers, and edge highlighting |
| `BarChart` | Custom SVG bar chart — Y-axis scale, dashed grid lines, value labels above bars |
| `StatusTimeline` | Visual timeline for component status event history |
| `OnChainBadge` | Shows txHash with Solana Explorer link for verified components |
| `LockedGate` | Plan-gated feature wrapper — shows upgrade prompt when org plan is insufficient |
| `apiCache` | In-memory cache with configurable TTLs to reduce redundant API calls |

---

### State Management

No global state library. Each page manages its own state with `useState` / `useEffect`. Shared auth state lives in `AuthContext`. Frequently accessed data (dashboard stats, component lists) is cached in `apiCache` with short TTLs.

---

## Billing Plans

| Plan | Components | Members | Writes/month | Traces/month | Network |
|---|---|---|---|---|---|
| Sandbox | 500 | 3 | 1,000 | 10,000 | Devnet |
| Starter | 5,000 | 10 | 25,000 | 50,000 | Mainnet + Devnet |
| Growth | Unlimited | 25 | 500,000 | 250,000 | Mainnet + Devnet |
| Enterprise | Unlimited | Unlimited | Unlimited | Unlimited | Mainnet + Devnet |

Billing is processed by [Dodo Payments](https://dodopayments.com). Webhook events (`subscription.activated`, `subscription.cancelled`, etc.) update the org's plan in real time.

---

## Running Locally (Full Stack)

**Prerequisites:** Node.js 20+, Rust + Anchor CLI, Solana CLI, PostgreSQL

```bash
# 1. Build the Anchor program
cd backend
anchor build

# 2. Deploy to devnet (if needed)
anchor deploy --provider.cluster devnet

# 3. Start the API
cd backend/api
npm install
npx prisma migrate deploy
npm run dev   # http://localhost:4000

# 4. Start the frontend
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## Deployment

The API is deployed on AWS behind PM2:

```bash
git pull
cd backend/api
npm run build
pm2 restart api
```

The frontend is deployed on Vercel (or any Next.js-compatible host).

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Smart contract | Rust, Anchor 1.0 |
| Blockchain | Solana Devnet |
| Metadata storage | IPFS via Pinata |
| API | Express 5, TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | Privy (email + wallet) + JWT |
| Payments | Dodo Payments |
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Graph UI | React Flow |
| Deployment | AWS (API) + Vercel (frontend) |
