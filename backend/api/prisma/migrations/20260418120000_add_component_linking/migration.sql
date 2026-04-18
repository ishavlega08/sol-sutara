-- Add on_chain_id to Component (stores the u64 component ID from Solana)
ALTER TABLE "Component" ADD COLUMN "on_chain_id" BIGINT;

-- Create ComponentLink table
CREATE TABLE "ComponentLink" (
    "id"         TEXT         NOT NULL,
    "parent_id"  TEXT         NOT NULL,
    "child_id"   TEXT         NOT NULL,
    "tx_hash"    TEXT         NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComponentLink_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: no duplicate parent→child relationships
CREATE UNIQUE INDEX "ComponentLink_parent_id_child_id_key"
    ON "ComponentLink"("parent_id", "child_id");

-- Foreign keys
ALTER TABLE "ComponentLink"
    ADD CONSTRAINT "ComponentLink_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "Component"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComponentLink"
    ADD CONSTRAINT "ComponentLink_child_id_fkey"
    FOREIGN KEY ("child_id") REFERENCES "Component"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
