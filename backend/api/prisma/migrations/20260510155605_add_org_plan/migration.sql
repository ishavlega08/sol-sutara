-- CreateEnum
CREATE TYPE "OrgPlan" AS ENUM ('SANDBOX', 'GROWTH', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "plan" "OrgPlan" NOT NULL DEFAULT 'SANDBOX';
