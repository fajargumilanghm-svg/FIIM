-- CreateEnum
CREATE TYPE "ErasureStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "erasure_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "status" "ErasureStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "requested_by" TEXT,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "erasure_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "erasure_requests_organization_id_status_idx" ON "erasure_requests"("organization_id", "status");
CREATE INDEX "erasure_requests_status_scheduled_for_idx" ON "erasure_requests"("status", "scheduled_for");
