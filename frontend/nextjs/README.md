# Sol Sutara — Next.js + TypeScript + Tailwind

Full source for the **landing page** and **dashboard** (16 routes), built on Next.js 14 App Router with shadcn/ui primitives, React Flow, and mock auth / wallet / Dodo Payments integrations ready to swap for real ones.

## Quick start

```bash
cd nextjs
npm install
npm run dev
```

Open http://localhost:3000

## Routes

**Public**
- `/` — landing page
- `/login` `/signup` `/onboarding` — auth flow (mock)

**App** (under `(app)` route group with shared sidebar shell)
- `/dashboard` — overview + stats + activity
- `/components` — list with filters
- `/components/[id]` — detail with metadata + risk ring
- `/link` — parent→child linking
- `/trace` — React Flow graph (upstream lineage)
- `/recall` — React Flow graph (downstream blast radius)
- `/analytics` — growth charts + reuse table
- `/billing` — plans + usage
- `/billing/checkout` — Dodo checkout (card + crypto mock)
- `/billing/invoices` — invoice history
- `/settings/org` `/settings/members` `/settings/api-keys`

## What to replace before going live

| Mock | Real replacement |
|---|---|
| `lib/mock/auth.ts` | NextAuth.js with Email + Solana wallet (SIWS) providers |
| `connectWallet()` | `@solana/wallet-adapter-react` + Phantom/Solflare/Backpack adapters |
| `lib/mock/dodo.ts` | Dodo Payments server-side API (`/api/checkout/route.ts` using their Node SDK) |
| `lib/mock/data.ts` | Your indexer API (RPC Fast → listener → Postgres) |

## Structure

```
nextjs/
├── app/
│   ├── layout.tsx, globals.css, page.tsx           (landing)
│   ├── login/ signup/ onboarding/                  (auth pages)
│   └── (app)/                                      (authenticated shell)
│       ├── layout.tsx                              (AppShell wrapper)
│       ├── dashboard/ components/ link/ trace/ recall/ analytics/
│       ├── billing/ billing/checkout/ billing/invoices/
│       └── settings/org/ settings/members/ settings/api-keys/
├── components/
│   ├── ui/        (button, input, card, badge, stat — shadcn-style)
│   ├── graph/     (React Flow wrapper with custom nodes)
│   ├── app-shell.tsx, logo.tsx
├── lib/
│   ├── utils.ts (cn helper)
│   └── mock/ (auth.ts, dodo.ts, data.ts)
└── tailwind.config.ts, tsconfig.json, package.json
```

## Theming

Dark by default; light mode via `.light` class on `<html>`. Theme toggle lives in the sidebar footer and persists to `localStorage`.

Design tokens are HSL CSS variables in `globals.css` — change `--accent`, `--accent-2` etc. to re-skin.
