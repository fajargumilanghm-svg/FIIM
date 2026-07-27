-- CreateEnum
CREATE TYPE "InjurySeverity" AS ENUM ('MINOR', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "InjuryStatus" AS ENUM ('OPEN', 'RECOVERING', 'RETURN_TO_PLAY', 'RESOLVED');

-- CreateEnum
CREATE TYPE "InjuryMechanism" AS ENUM ('CONTACT', 'NON_CONTACT', 'OVERUSE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "injuries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "body_part" VARCHAR(100) NOT NULL,
    "injury_type" VARCHAR(100),
    "mechanism" "InjuryMechanism" NOT NULL DEFAULT 'UNKNOWN',
    "severity" "InjurySeverity" NOT NULL DEFAULT 'MINOR',
    "status" "InjuryStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "onset_date" DATE NOT NULL,
    "expected_return_date" DATE,
    "actual_return_date" DATE,
    "days_lost" INTEGER NOT NULL DEFAULT 0,
    "reported_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "injuries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "injuries_organization_id_status_idx" ON "injuries"("organization_id", "status");

-- CreateIndex
CREATE INDEX "injuries_athlete_id_status_idx" ON "injuries"("athlete_id", "status");

-- CreateIndex
CREATE INDEX "injuries_organization_id_onset_date_idx" ON "injuries"("organization_id", "onset_date");

-- AddForeignKey
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
