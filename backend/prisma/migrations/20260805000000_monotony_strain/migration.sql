-- AlterTable: add Monotony & Strain columns to load calculations
ALTER TABLE "athlete_load_calculations"
  ADD COLUMN "weekly_load" DOUBLE PRECISION,
  ADD COLUMN "monotony" DOUBLE PRECISION,
  ADD COLUMN "strain" DOUBLE PRECISION,
  ADD COLUMN "load_std_dev" DOUBLE PRECISION,
  ADD COLUMN "monotony_risk" VARCHAR(20);

-- AlterTable: add Monotony/Strain config to algorithm configurations
ALTER TABLE "algorithm_configurations"
  ADD COLUMN "enable_monotony" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "monotony_elevated_threshold" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
  ADD COLUMN "monotony_high_threshold" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
  ADD COLUMN "strain_threshold" DOUBLE PRECISION NOT NULL DEFAULT 6000;
