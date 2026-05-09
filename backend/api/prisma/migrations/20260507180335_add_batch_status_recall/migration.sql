-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('CREATED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTED', 'RECALLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecallStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- AlterTable
ALTER TABLE "Component" ADD COLUMN     "batch_number" TEXT,
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "lot_number" TEXT,
ADD COLUMN     "quantity" DOUBLE PRECISION,
ADD COLUMN     "status" "ComponentStatus" NOT NULL DEFAULT 'CREATED',
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "ComponentLink" ADD COLUMN     "quantity" DOUBLE PRECISION,
ADD COLUMN     "unit" TEXT;

-- CreateTable
CREATE TABLE "ComponentEvent" (
    "id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "from_status" "ComponentStatus",
    "to_status" "ComponentStatus" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComponentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recall" (
    "id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'Entire batch',
    "issued_by" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "status" "RecallStatus" NOT NULL DEFAULT 'ACTIVE',
    "org_id" TEXT,

    CONSTRAINT "Recall_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ComponentEvent" ADD CONSTRAINT "ComponentEvent_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "Component"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentEvent" ADD CONSTRAINT "ComponentEvent_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
