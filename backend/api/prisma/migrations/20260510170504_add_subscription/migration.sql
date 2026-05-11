-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "dodo_subscription_id" TEXT NOT NULL,
    "dodo_customer_id" TEXT,
    "plan" "OrgPlan" NOT NULL,
    "billing" TEXT NOT NULL DEFAULT 'monthly',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_org_id_key" ON "Subscription"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_dodo_subscription_id_key" ON "Subscription"("dodo_subscription_id");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
