-- CreateEnum
CREATE TYPE "WindowType" AS ENUM ('ACUTE_7DAY', 'CHRONIC_21DAY', 'CHRONIC_28DAY', 'ROLLING_3DAY', 'ROLLING_5DAY');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- CreateTable
CREATE TABLE "algorithm_configurations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "acute_window_days" INTEGER NOT NULL DEFAULT 7,
    "chronic_window_days" INTEGER NOT NULL DEFAULT 21,
    "very_low_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "low_threshold" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "moderate_threshold" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "high_threshold" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "enable_acwr" BOOLEAN NOT NULL DEFAULT true,
    "enable_ewma" BOOLEAN NOT NULL DEFAULT false,
    "ewma_constant" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "algorithm_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_load_calculations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "calc_date" DATE NOT NULL,
    "acute_load" DOUBLE PRECISION,
    "chronic_load" DOUBLE PRECISION,
    "acute_window_days" INTEGER NOT NULL DEFAULT 7,
    "chronic_window_days" INTEGER NOT NULL DEFAULT 21,
    "acwr" DOUBLE PRECISION,
    "ewma_acwr" DOUBLE PRECISION,
    "riskLevel" VARCHAR(20),
    "riskColor" VARCHAR(7),
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_duration" INTEGER NOT NULL DEFAULT 0,
    "total_distance" DOUBLE PRECISION,
    "avg_rpe" DOUBLE PRECISION,
    "data_points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_load_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "algorithm_configurations_organization_id_key" ON "algorithm_configurations"("organization_id");

-- CreateIndex
CREATE INDEX "athlete_load_calculations_organization_id_calc_date_idx" ON "athlete_load_calculations"("organization_id", "calc_date");

-- CreateIndex
CREATE INDEX "athlete_load_calculations_athlete_id_calc_date_idx" ON "athlete_load_calculations"("athlete_id", "calc_date");

-- CreateIndex
CREATE INDEX "athlete_load_calculations_organization_id_riskLevel_idx" ON "athlete_load_calculations"("organization_id", "riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_load_calculations_athlete_id_calc_date_key" ON "athlete_load_calculations"("athlete_id", "calc_date");

-- AddForeignKey
ALTER TABLE "algorithm_configurations" ADD CONSTRAINT "algorithm_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_load_calculations" ADD CONSTRAINT "athlete_load_calculations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_load_calculations" ADD CONSTRAINT "athlete_load_calculations_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
