-- CreateEnum
CREATE TYPE "SpinOutcome" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "spins" ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "outcome" "SpinOutcome" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "spins_outcome_idx" ON "spins"("outcome");
