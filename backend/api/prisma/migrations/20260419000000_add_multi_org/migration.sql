-- ─── Organization ──────────────────────────────────────────────────────────────
-- Primary entity. Represents a real-world company or team.

CREATE TABLE "Organization" (
    "id"         TEXT         NOT NULL,
    "name"       TEXT         NOT NULL,
    "slug"       TEXT         NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Unique slug constraint (URL-safe identifier, e.g. "intel-corp")
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- ─── Component: add org_id ─────────────────────────────────────────────────────
-- Nullable so existing components without an org are not broken.

ALTER TABLE "Component" ADD COLUMN "org_id" TEXT;

-- Foreign key: Component.org_id → Organization.id (SET NULL on org delete)
ALTER TABLE "Component"
    ADD CONSTRAINT "Component_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
