-- CreateEnum
CREATE TYPE "PlanCategory" AS ENUM ('FOOD', 'ADVENTURE', 'RELAX', 'HOME', 'SURPRISE', 'OTHER');

-- CreateTable
CREATE TABLE "date_plans" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "description" VARCHAR(240),
    "emoji" VARCHAR(16),
    "category" "PlanCategory" NOT NULL DEFAULT 'OTHER',
    "weight" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spins" (
    "id" TEXT NOT NULL,
    "datePlanId" TEXT NOT NULL,
    "spunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "date_plans_isActive_idx" ON "date_plans"("isActive");

-- CreateIndex
CREATE INDEX "spins_spunAt_idx" ON "spins"("spunAt");

-- CreateIndex
CREATE INDEX "spins_datePlanId_idx" ON "spins"("datePlanId");

-- AddForeignKey
ALTER TABLE "spins" ADD CONSTRAINT "spins_datePlanId_fkey" FOREIGN KEY ("datePlanId") REFERENCES "date_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
