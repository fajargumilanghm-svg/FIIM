-- CreateEnum
CREATE TYPE "RtpStage" AS ENUM ('REST', 'RECOVERY', 'RECONDITIONING', 'RETURN_TO_TRAINING', 'RETURN_TO_PLAY');
CREATE TYPE "RtpStageStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
CREATE TYPE "ConfidentialityLevel" AS ENUM ('GENERAL', 'MEDICAL', 'RESTRICTED');
CREATE TYPE "ClearanceStatus" AS ENUM ('PENDING', 'CLEARED', 'DENIED', 'EXPIRED');

-- AlterTable
ALTER TABLE "injuries"
  ADD COLUMN "current_rtp_stage" "RtpStage",
  ADD COLUMN "medical_hold" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "injury_rtp_progress" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "injury_id" TEXT NOT NULL,
    "stage" "RtpStage" NOT NULL,
    "status" "RtpStageStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "criteria" JSONB,
    "notes" TEXT,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "cleared_by" TEXT,
    CONSTRAINT "injury_rtp_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "injury_diagnoses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "injury_id" TEXT NOT NULL,
    "icd10_code" VARCHAR(10),
    "description" TEXT NOT NULL,
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'MEDICAL',
    "diagnosed_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "injury_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "injury_treatment_notes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "injury_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'MEDICAL',
    "medical_hold" BOOLEAN NOT NULL DEFAULT false,
    "author_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "injury_treatment_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_clearances" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "injury_id" TEXT NOT NULL,
    "status" "ClearanceStatus" NOT NULL DEFAULT 'PENDING',
    "restrictions" JSONB,
    "cleared_by" TEXT,
    "cleared_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "follow_up_date" TIMESTAMP(3),
    "signature_hash" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "medical_clearances_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "injury_rtp_progress_injury_id_stage_idx" ON "injury_rtp_progress"("injury_id", "stage");
CREATE INDEX "injury_rtp_progress_organization_id_idx" ON "injury_rtp_progress"("organization_id");
CREATE INDEX "injury_diagnoses_injury_id_idx" ON "injury_diagnoses"("injury_id");
CREATE INDEX "injury_diagnoses_organization_id_idx" ON "injury_diagnoses"("organization_id");
CREATE INDEX "injury_treatment_notes_injury_id_idx" ON "injury_treatment_notes"("injury_id");
CREATE INDEX "injury_treatment_notes_organization_id_idx" ON "injury_treatment_notes"("organization_id");
CREATE INDEX "medical_clearances_injury_id_idx" ON "medical_clearances"("injury_id");
CREATE INDEX "medical_clearances_organization_id_status_idx" ON "medical_clearances"("organization_id", "status");

-- Foreign keys
ALTER TABLE "injury_rtp_progress" ADD CONSTRAINT "injury_rtp_progress_injury_id_fkey" FOREIGN KEY ("injury_id") REFERENCES "injuries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "injury_diagnoses" ADD CONSTRAINT "injury_diagnoses_injury_id_fkey" FOREIGN KEY ("injury_id") REFERENCES "injuries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "injury_treatment_notes" ADD CONSTRAINT "injury_treatment_notes_injury_id_fkey" FOREIGN KEY ("injury_id") REFERENCES "injuries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medical_clearances" ADD CONSTRAINT "medical_clearances_injury_id_fkey" FOREIGN KEY ("injury_id") REFERENCES "injuries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
