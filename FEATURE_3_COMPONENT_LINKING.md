# Feature #3 — Component Linking (Graph Formation)

Enables directed parent → child relationships between components on-chain.
This is the foundation for supply chain traceability and recall.

---

## What was built

| Layer | Change |
|---|---|
| Solana Program | New `link_components` instruction + `parents` field on `Component` |
| TypeScript Client | `linkComponents()` function |
| Express API | `POST /components/link` + `GET /components/:id/parents` |
| Database | `ComponentLink` table + `on_chain_id` column on `Component` |

---

## On-chain design

Each `Component` account now stores its parent IDs directly:

```
Component {
  component_id:  u64
  metadata_uri:  String   (max 200 chars)
  creator:       Pubkey
  timestamp:     i64
  bump:          u8
  parents:       Vec<u64> (max 10 parents)   ← NEW
}
```

Linking appends `parent_component_id` to the child's `parents` vec.
No separate link account is created — the relationship lives inside the child.

---

## Validation rules

| Rule | Error |
|---|---|
| `parent == child` (same account key) | `SelfLink` |
| Parent already in `child.parents` | `DuplicateLink` |
| `child.parents.len() >= 10` | `TooManyParents` |

---

## Anchor instruction

```
link_components(parent_component_id: u64, child_component_id: u64)

Accounts:
  parent_component  — read-only, PDA validated from stored creator + component_id
  child_component   — mutable,   PDA validated from stored creator + component_id
  authority         — signer
```

PDA seeds (same as `create_component`):
```
["component", creator_pubkey, component_id_as_le_bytes]
```

---

## API endpoints

### Link two components

```
POST /components/link
```

**Request body**
```json
{
  "parentId": "<component db uuid>",
  "childId":  "<component db uuid>"
}
```

**Response `201`**
```json
{
  "success": true,
  "link": {
    "parentId":  "eac0c8d8-...",
    "childId":   "ff40af5b-...",
    "txHash":    "5xK3abc...",
    "createdAt": "2026-04-18T12:00:00.000Z"
  }
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Missing `parentId` / `childId`, or self-link |
| `404` | Component not found in DB |
| `409` | Relationship already exists |
| `422` | Component exists in DB but not yet confirmed on-chain |
| `500` | Unexpected error |

---

### Get parents of a component

```
GET /components/:id/parents
```

**Response `200`**
```json
{
  "success": true,
  "parents": [
    {
      "linkId":    "uuid",
      "txHash":    "5xK3abc...",
      "createdAt": "2026-04-18T12:00:00.000Z",
      "parent": {
        "id":             "eac0c8d8-...",
        "name":           "Steel Sheet",
        "onChainId":      "3",
        "onChainAddress": "ChKYDc..."
      }
    }
  ]
}
```

---

## Testing

### 1. Apply the DB migration

```bash
cd backend/api
npx prisma migrate deploy
```

### 2. Start the server

```bash
npm run dev
```

### 3. Create two components

```bash
PARENT=$(curl -s -X POST http://localhost:3001/components \
  -H "Content-Type: application/json" \
  -d '{"name":"Steel Sheet","type":"raw_material","supplier":"Tata Steel"}' \
  | jq -r '.component.id')

CHILD=$(curl -s -X POST http://localhost:3001/components \
  -H "Content-Type: application/json" \
  -d '{"name":"Body Panel","type":"part"}' \
  | jq -r '.component.id')

echo "Parent: $PARENT"
echo "Child:  $CHILD"
```

### 4. Link them

```bash
curl -s -X POST http://localhost:3001/components/link \
  -H "Content-Type: application/json" \
  -d "{\"parentId\":\"$PARENT\",\"childId\":\"$CHILD\"}" \
  | jq .
```

### 5. Verify the link

```bash
curl -s http://localhost:3001/components/$CHILD/parents | jq .
```

### 6. Verify on-chain directly (bypasses API)

```bash
# from backend/
COMPONENT_IDS=3,4,5 npx ts-node client/tests/checkLinks.ts
```

### 7. Run the full end-to-end chain test

```bash
# from backend/
npx ts-node client/tests/testLinkComponents.ts
```

This script creates Raw Material → Part → Product, links them, verifies on-chain state, and confirms duplicate + self-link rejections.

---

## Guard rail tests

```bash
# Duplicate link → 409
curl -s -X POST http://localhost:3001/components/link \
  -H "Content-Type: application/json" \
  -d '{"parentId":"'$PARENT'","childId":"'$CHILD'"}' | jq .

# Self-link → 400
curl -s -X POST http://localhost:3001/components/link \
  -H "Content-Type: application/json" \
  -d '{"parentId":"'$PARENT'","childId":"'$PARENT'"}' | jq .

# Missing field → 400
curl -s -X POST http://localhost:3001/components/link \
  -H "Content-Type: application/json" \
  -d '{"parentId":"'$PARENT'"}' | jq .
```

---

## Important notes

**Old components cannot be linked.**
Components created before the program upgrade (IDs 0, 1, 2 in the test wallet) were allocated without the `parents` field and are 84 bytes too small. Only components created after `anchor program deploy` support linking.

**On-chain ID vs DB ID.**
The API uses DB UUIDs (`id`) in request bodies. The on-chain `component_id` (a `u64`) is stored as `onChainId` in API responses and in the `on_chain_id` column of the `Component` table.

**Max 10 parents per component.**
Pre-allocated at account creation time. Exceeding this returns `TooManyParents` from the program.
