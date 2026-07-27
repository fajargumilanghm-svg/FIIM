-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('TRAINING', 'MATCH', 'RECOVERY', 'REHABILITATION', 'STRENGTH', 'CONDITIONING', 'OTHER');

-- CreateEnum
CREATE TYPE "IntensityLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- CreateTable
CREATE TABLE "wellness_surveys" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "survey_date" DATE NOT NULL,
    "sleep_quality" SMALLINT,
    "sleep_hours" DOUBLE PRECISION,
    "fatigue_level" SMALLINT,
    "mood" SMALLINT,
    "stress_level" SMALLINT,
    "muscle_soreness" SMALLINT,
    "hydration" SMALLINT,
    "nutrition" SMALLINT,
    "wellness_score" DOUBLE PRECISION,
    "illness" BOOLEAN DEFAULT false,
    "injury_concern" VARCHAR(255),
    "notes" TEXT,
    "source" VARCHAR(20) NOT NULL DEFAULT 'WEB',
    "submitted_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wellness_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "session_type" "SessionType" NOT NULL DEFAULT 'TRAINING',
    "scheduled_date" DATE NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "sport_id" TEXT,
    "team_id" TEXT,
    "location" VARCHAR(100),
    "planned_rpe" SMALLINT,
    "planned_load" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_session_loads" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "rpe_score" SMALLINT,
    "duration_minutes" INTEGER,
    "total_load" INTEGER,
    "distance_meters" DOUBLE PRECISION,
    "high_speed_distance" DOUBLE PRECISION,
    "sprint_distance" DOUBLE PRECISION,
    "accelerations" INTEGER,
    "decelerations" INTEGER,
    "heart_rate_avg" INTEGER,
    "heart_rate_max" INTEGER,
    "wellness_pre" SMALLINT,
    "wellness_post" SMALLINT,
    "notes" TEXT,
    "injury_concern" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_session_loads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wellness_surveys_organization_id_survey_date_idx" ON "wellness_surveys"("organization_id", "survey_date");

-- CreateIndex
CREATE INDEX "wellness_surveys_athlete_id_survey_date_idx" ON "wellness_surveys"("athlete_id", "survey_date");

-- CreateIndex
CREATE INDEX "wellness_surveys_organization_id_wellness_score_idx" ON "wellness_surveys"("organization_id", "wellness_score");

-- CreateIndex
CREATE UNIQUE INDEX "wellness_surveys_athlete_id_survey_date_key" ON "wellness_surveys"("athlete_id", "survey_date");

-- CreateIndex
CREATE INDEX "training_sessions_organization_id_scheduled_date_idx" ON "training_sessions"("organization_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "training_sessions_organization_id_status_idx" ON "training_sessions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "training_sessions_team_id_idx" ON "training_sessions"("team_id");

-- CreateIndex
CREATE INDEX "athlete_session_loads_athlete_id_createdAt_idx" ON "athlete_session_loads"("athlete_id", "createdAt");

-- CreateIndex
CREATE INDEX "athlete_session_loads_organization_id_createdAt_idx" ON "athlete_session_loads"("organization_id", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_session_loads_session_id_athlete_id_key" ON "athlete_session_loads"("session_id", "athlete_id");

-- AddForeignKey
ALTER TABLE "wellness_surveys" ADD CONSTRAINT "wellness_surveys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wellness_surveys" ADD CONSTRAINT "wellness_surveys_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wellness_surveys" ADD CONSTRAINT "wellness_surveys_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_session_loads" ADD CONSTRAINT "athlete_session_loads_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_session_loads" ADD CONSTRAINT "athlete_session_loads_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_session_loads" ADD CONSTRAINT "athlete_session_loads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
