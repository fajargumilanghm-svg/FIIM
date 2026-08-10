-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('TEAM_SUMMARY', 'ATHLETE_LOAD', 'INJURY');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'CSV');
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "generated_reports" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "title" VARCHAR(200) NOT NULL,
    "params" JSONB,
    "file_path" VARCHAR(500),
    "file_size" INTEGER,
    "error" TEXT,
    "requested_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "frequency" "ScheduleFrequency" NOT NULL,
    "recipients" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "generated_reports_organization_id_createdAt_idx" ON "generated_reports"("organization_id", "createdAt");
CREATE INDEX "generated_reports_organization_id_status_idx" ON "generated_reports"("organization_id", "status");
CREATE INDEX "scheduled_reports_organization_id_enabled_idx" ON "scheduled_reports"("organization_id", "enabled");
