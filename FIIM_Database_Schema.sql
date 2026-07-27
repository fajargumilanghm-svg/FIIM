-- ============================================================================
-- FIIM (Fatigue Injury Index Monitoring) - Database Schema
-- Version: 1.0
-- Date: 2026-07-08
-- Author: Engineering Team
-- Description: Complete PostgreSQL 15+ DDL for FIIM multi-tenant SaaS platform
-- ============================================================================
-- Prerequisites:
--   PostgreSQL 15+
--   Extensions: uuid-ossp, pgcrypto, TimescaleDB (optional for hypertables)
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = ON;
SET check_function_bodies = FALSE;
SET client_min_messages = WARNING;
SET row_security = ON;

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- CREATE EXTENSION IF NOT EXISTS "timescaledb"; -- Enable if using TimescaleDB

-- ============================================================================
-- 2. CUSTOM ENUMS AND TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('administrator', 'coach', 'sport_scientist', 'physiotherapist', 'sports_doctor', 'athlete');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE organization_type AS ENUM ('pro_club', 'university', 'academy', 'clinical');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE athlete_status AS ENUM ('active', 'loaned', 'injured', 'suspended', 'retired', 'transferred');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'mixed', 'other');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE session_type AS ENUM ('technical', 'tactical', 'strength', 'competition', 'recovery', 'rehab', 'travel');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE injury_mechanism AS ENUM ('contact', 'non_contact', 'overuse', 'illness', 'other');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE injury_severity AS ENUM ('mild', 'moderate', 'severe', 'career_threatening');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('low', 'moderate', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE data_source_type AS ENUM ('manual', 'wearable_api', 'gps_file', 'bulk_import');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE consent_type AS ENUM ('monitoring', 'medical', 'research', 'marketing');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE report_format AS ENUM ('pdf', 'excel', 'csv', 'powerpoint', 'json');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'generating', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM (
        'login', 'logout', 'data_view', 'data_create', 'data_update', 'data_delete',
        'data_export', 'role_change', 'config_change', 'alert_ack', 'message_send'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Organization (Multi-tenant root)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type organization_type NOT NULL DEFAULT 'pro_club',
    country VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'UTC',
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    subscription_start DATE,
    subscription_end DATE,
    data_retention_days INTEGER NOT NULL DEFAULT 1825, -- 5 years
    gdpr_controller_name VARCHAR(255),
    hipaa_entity BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_org_name UNIQUE (name),
    CONSTRAINT chk_data_retention CHECK (data_retention_days >= 365)
);

COMMENT ON TABLE organizations IS 'Top-level tenant representing a sports club, university, academy, or clinical practice.';
COMMENT ON COLUMN organizations.data_retention_days IS 'Minimum 365 days enforced; 1825 (5 years) is default for medical compliance.';

-- ----------------------------------------------------------------------------
-- 3.2 Users (All human accounts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- NULL for SSO-only users
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255), -- Encrypted TOTP secret
    last_login TIMESTAMPTZ,
    login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_email UNIQUE (email),
    CONSTRAINT fk_user_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE
);

COMMENT ON TABLE users IS 'Authentication and identity for all platform users including staff and athletes.';

-- ----------------------------------------------------------------------------
-- 3.3 Roles (RBAC role definitions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    permission_set JSONB NOT NULL DEFAULT '[]',
    medical_access BOOLEAN NOT NULL DEFAULT FALSE,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_role_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT uq_role_name_org UNIQUE (organization_id, name)
);

COMMENT ON TABLE roles IS 'RBAC role definitions scoped to organization or system-wide.';

-- ----------------------------------------------------------------------------
-- 3.4 UserRoleAssignment (Temporal, scoped role linkage)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_role_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    scope_type VARCHAR(50) NOT NULL DEFAULT 'organization', -- organization, team, squad, athlete_caseload
    scope_id UUID, -- Polymorphic reference
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    assigned_by UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ura_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ura_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_ura_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_ura_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(user_id),
    CONSTRAINT chk_ura_dates CHECK (effective_until IS NULL OR effective_until > effective_from)
);

COMMENT ON TABLE user_role_assignments IS 'Links users to roles with optional team/squad/athlete scoping and date validity.';

-- ============================================================================
-- 4. TEAM & SQUAD TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Teams
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    sport VARCHAR(100) NOT NULL DEFAULT 'football',
    gender gender_type NOT NULL DEFAULT 'male',
    age_category VARCHAR(50) DEFAULT 'senior',
    season VARCHAR(20),
    timezone VARCHAR(100) DEFAULT 'UTC',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_team_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT uq_team_name_org UNIQUE (organization_id, name)
);

-- ----------------------------------------------------------------------------
-- 4.2 Squads
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS squads (
    squad_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    squad_type VARCHAR(50) NOT NULL DEFAULT 'training', -- positional, training, rehab, travel, development
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_squad_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    CONSTRAINT fk_squad_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT uq_squad_name_team UNIQUE (team_id, name)
);

-- ============================================================================
-- 5. ATHLETE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 Athletes (Monitored individuals)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS athletes (
    athlete_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID, -- Links to athlete user account (nullable for admin-managed profiles)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_type,
    nationality VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    blood_type VARCHAR(10),
    known_allergies TEXT,
    position VARCHAR(100),
    jersey_number VARCHAR(10),
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    target_sleep_hours DECIMAL(3,1) NOT NULL DEFAULT 8.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_athlete_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_athlete_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT uq_athlete_email_org UNIQUE (organization_id, email),
    CONSTRAINT chk_dob CHECK (date_of_birth <= CURRENT_DATE)
);

COMMENT ON COLUMN athletes.date_of_birth IS 'Required for age-appropriate load thresholds.';

-- ----------------------------------------------------------------------------
-- 5.2 AthleteTeamAssignments (Temporal)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS athlete_team_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    team_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    status athlete_status NOT NULL DEFAULT 'active',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ata_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_ata_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    CONSTRAINT fk_ata_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT chk_ata_dates CHECK (effective_until IS NULL OR effective_until > effective_from)
);

-- ----------------------------------------------------------------------------
-- 5.3 AthleteSquadAssignments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS athlete_squad_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    squad_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_asa_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_asa_squad FOREIGN KEY (squad_id) REFERENCES squads(squad_id) ON DELETE CASCADE,
    CONSTRAINT fk_asa_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 5.4 ConsentRecords (Legally auditable)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consent_records (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    consent_type consent_type NOT NULL,
    version VARCHAR(20) NOT NULL,
    document_url VARCHAR(500),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by VARCHAR(255) NOT NULL, -- Athlete or guardian name
    ip_address INET,
    withdrawn_at TIMESTAMPTZ,
    withdrawn_by VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_consent_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_consent_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE
);

COMMENT ON TABLE consent_records IS 'Versioned athlete consent for data processing. Withdrawal triggers data purge scheduling.';

-- ============================================================================
-- 6. WELLNESS TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1 WellnessSurveyTemplates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wellness_survey_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    team_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(50) NOT NULL DEFAULT 'daily', -- daily, pre_session, post_session, weekly
    active_window_start TIME NOT NULL DEFAULT '06:00:00',
    active_window_end TIME NOT NULL DEFAULT '10:00:00',
    questions JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_wst_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_wst_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL,
    CONSTRAINT fk_wst_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 6.2 WellnessSurveyResponses (Immutable after edit window)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wellness_survey_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    template_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    survey_date DATE NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_from VARCHAR(50) NOT NULL DEFAULT 'mobile_web', -- mobile_web, desktop, api
    responses JSONB NOT NULL DEFAULT '{}',
    calculated_wellness_index DECIMAL(5,2),
    wellness_index_version VARCHAR(20),
    is_editable_until TIMESTAMPTZ,
    edited_at TIMESTAMPTZ,
    edited_by UUID,
    edit_reason VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_wsr_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_wsr_template FOREIGN KEY (template_id) REFERENCES wellness_survey_templates(template_id) ON DELETE CASCADE,
    CONSTRAINT fk_wsr_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_wsr_edited_by FOREIGN KEY (edited_by) REFERENCES users(user_id),
    CONSTRAINT uq_wsr_athlete_date_template UNIQUE (athlete_id, survey_date, template_id)
);

COMMENT ON TABLE wellness_survey_responses IS 'One response per athlete per template per calendar day.';

-- ============================================================================
-- 7. TRAINING LOAD TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 TrainingSessions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    session_type session_type NOT NULL DEFAULT 'technical',
    scheduled_date DATE NOT NULL,
    scheduled_start TIME,
    scheduled_end TIME,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    location VARCHAR(255),
    planned_rpe DECIMAL(3,1),
    planned_duration INTEGER, -- minutes
    planned_load INTEGER,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, cancelled

    CONSTRAINT fk_ts_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    CONSTRAINT fk_ts_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_ts_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 7.2 SessionLoadRecords (Atomic load data)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_load_records (
    load_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    session_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    session_rpe DECIMAL(3,1), -- 1-10 or 6-20 Borg
    session_duration_minutes INTEGER,
    srpe INTEGER, -- auto-calculated: duration * RPE
    total_distance_m INTEGER,
    hsr_distance_m INTEGER, -- high-speed running > 5.5 m/s
    sprint_distance_m INTEGER, -- > 7.0 m/s
    player_load_au INTEGER,
    accelerations_count INTEGER,
    decelerations_count INTEGER,
    hr_zone_minutes JSONB DEFAULT '{}',
    data_source data_source_type NOT NULL DEFAULT 'manual',
    source_file_id UUID,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_slr_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_slr_session FOREIGN KEY (session_id) REFERENCES training_sessions(session_id) ON DELETE CASCADE,
    CONSTRAINT fk_slr_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_slr_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(user_id)
);

COMMENT ON TABLE session_load_records IS 'Atomic unit of load data: one record per athlete per session.';

-- ----------------------------------------------------------------------------
-- 7.3 DailyLoadSummaries (Pre-computed daily aggregations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_load_summaries (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    summary_date DATE NOT NULL,
    total_srpe INTEGER NOT NULL DEFAULT 0,
    total_distance_m INTEGER DEFAULT 0,
    total_hsr_m INTEGER DEFAULT 0,
    total_sprint_m INTEGER DEFAULT 0,
    total_player_load INTEGER DEFAULT 0,
    session_count INTEGER NOT NULL DEFAULT 0,
    rest_day BOOLEAN NOT NULL DEFAULT FALSE,
    data_completeness_pct DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calculation_version VARCHAR(20),

    CONSTRAINT fk_dls_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_dls_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT uq_dls_athlete_date UNIQUE (athlete_id, summary_date)
);

COMMENT ON TABLE daily_load_summaries IS 'Pre-computed daily load aggregation; recalculated within 15 minutes of new session load data.';

-- ============================================================================
-- 8. WEARABLE TABLES (Post-MVP foundation)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 8.1 WearableDevices
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wearable_devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- whoop, garmin, polar, apple_watch, oura, custom
    serial_number_hash VARCHAR(255) NOT NULL, -- Hashed at rest
    api_integration_id VARCHAR(255),
    paired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_wd_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_wd_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT uq_wd_athlete_type UNIQUE (athlete_id, device_type)
);

-- ----------------------------------------------------------------------------
-- 8.2 WearableSyncRecords
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wearable_sync_records (
    sync_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    sync_date DATE NOT NULL,
    sleep_duration_hours DECIMAL(4,2),
    sleep_quality_score DECIMAL(5,2),
    deep_sleep_pct DECIMAL(5,2),
    rem_sleep_pct DECIMAL(5,2),
    hrv_rmssd INTEGER, -- ms
    hrv_sdnn INTEGER,
    resting_hr INTEGER,
    steps INTEGER,
    calories INTEGER,
    raw_payload JSONB,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_status VARCHAR(50) NOT NULL DEFAULT 'success', -- success, partial, failed
    error_message TEXT,

    CONSTRAINT fk_wsr_device FOREIGN KEY (device_id) REFERENCES wearable_devices(device_id) ON DELETE CASCADE,
    CONSTRAINT fk_wsr_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_wsr_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT uq_wsr_device_date UNIQUE (device_id, sync_date)
);

-- ============================================================================
-- 9. SCREENING TABLES (Post-MVP foundation)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 9.1 ScreeningBatteries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screening_batteries (
    battery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    team_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date DATE,
    completed_date DATE,
    test_ids JSONB NOT NULL DEFAULT '[]',
    normative_version VARCHAR(20),
    tester_user_id UUID,
    location VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sb_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_sb_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL,
    CONSTRAINT fk_sb_tester FOREIGN KEY (tester_user_id) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 9.2 ScreeningTests (Master data)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screening_tests (
    test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID, -- NULL for system-wide tests
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- movement_quality, balance, power, strength, flexibility
    unit_of_measure VARCHAR(50),
    scoring_method VARCHAR(50) NOT NULL, -- ordinal, ratio, pass_fail, percentile
    normative_data JSONB DEFAULT '{}',
    asymmetry_threshold_pct DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    severity_weights JSONB DEFAULT '{"minor": 5, "moderate": 10, "major": 15}',
    is_system_test BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_st_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 9.3 ScreeningAssessments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screening_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    battery_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    assessment_date DATE NOT NULL,
    movement_index DECIMAL(5,2),
    movement_index_version VARCHAR(20),
    overall_notes TEXT,
    tester_user_id UUID,
    next_assessment_due DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sa_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_battery FOREIGN KEY (battery_id) REFERENCES screening_batteries(battery_id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_tester FOREIGN KEY (tester_user_id) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 9.4 ScreeningTestResults
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screening_test_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL,
    test_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    left_score DECIMAL(10,2),
    right_score DECIMAL(10,2),
    composite_score DECIMAL(10,2),
    asymmetry_pct DECIMAL(5,2),
    asymmetry_flag BOOLEAN NOT NULL DEFAULT FALSE,
    passed BOOLEAN,
    severity VARCHAR(50), -- none, minor, moderate, major
    notes TEXT,
    image_url VARCHAR(500),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID,

    CONSTRAINT fk_str_assessment FOREIGN KEY (assessment_id) REFERENCES screening_assessments(assessment_id) ON DELETE CASCADE,
    CONSTRAINT fk_str_test FOREIGN KEY (test_id) REFERENCES screening_tests(test_id) ON DELETE CASCADE,
    CONSTRAINT fk_str_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_str_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_str_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(user_id)
);

-- ============================================================================
-- 10. INJURY MANAGEMENT TABLES (Medical Data)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 10.1 InjuryCases
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS injury_cases (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reported_by UUID NOT NULL,
    mechanism injury_mechanism NOT NULL,
    injury_site VARCHAR(255) NOT NULL,
    tissue_type VARCHAR(100) NOT NULL,
    severity injury_severity NOT NULL DEFAULT 'mild',
    initial_estimated_days_lost INTEGER,
    actual_days_lost INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, recovered, recurred, chronic
    previous_case_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ic_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_ic_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_ic_reported_by FOREIGN KEY (reported_by) REFERENCES users(user_id),
    CONSTRAINT fk_ic_previous FOREIGN KEY (previous_case_id) REFERENCES injury_cases(case_id) ON DELETE SET NULL
);

COMMENT ON TABLE injury_cases IS 'Master injury record from initial report through resolution.';

-- ----------------------------------------------------------------------------
-- 10.2 InjuryDiagnoses (Clinical detail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS injury_diagnoses (
    diagnosis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    diagnosed_by UUID NOT NULL,
    diagnosis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    primary_diagnosis TEXT NOT NULL,
    secondary_diagnosis TEXT,
    diagnosis_code VARCHAR(50), -- ICD-10 or sport-specific
    imaging_required BOOLEAN NOT NULL DEFAULT FALSE,
    imaging_type VARCHAR(100),
    imaging_result_summary TEXT,
    prognosis TEXT,
    estimated_return_weeks INTEGER,
    confidentiality_level VARCHAR(50) NOT NULL DEFAULT 'standard', -- standard, restricted
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_id_case FOREIGN KEY (case_id) REFERENCES injury_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_id_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_id_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_id_diagnosed_by FOREIGN KEY (diagnosed_by) REFERENCES users(user_id)
);

COMMENT ON TABLE injury_diagnoses IS 'Clinical diagnosis records. Restricted confidentiality hides from physio unless shared by doctor.';

-- ----------------------------------------------------------------------------
-- 10.3 TreatmentNotes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatment_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    author_id UUID NOT NULL,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    treatment_type VARCHAR(100) NOT NULL, -- manual_therapy, exercise, modality, medication, education
    interventions JSONB DEFAULT '[]',
    objective_measures JSONB DEFAULT '{}',
    subjective_notes TEXT,
    next_session_plan TEXT,
    pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
    is_medical_hold_updated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tn_case FOREIGN KEY (case_id) REFERENCES injury_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_tn_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_tn_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_tn_author FOREIGN KEY (author_id) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 10.4 ReturnToPlayStages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS return_to_play_stages (
    stage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    stage_number INTEGER NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    stage_definition TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_date DATE,
    objective_criteria JSONB DEFAULT '[]',
    criteria_met BOOLEAN NOT NULL DEFAULT FALSE,
    criteria_results JSONB DEFAULT '{}',
    clearance_required BOOLEAN NOT NULL DEFAULT FALSE,
    cleared_by UUID,
    cleared_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rtp_case FOREIGN KEY (case_id) REFERENCES injury_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_rtp_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_rtp_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_rtp_cleared_by FOREIGN KEY (cleared_by) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 10.5 MedicalClearances
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_clearances (
    clearance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    cleared_by UUID NOT NULL,
    cleared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clearance_type VARCHAR(50) NOT NULL, -- full, modified, restricted, withheld
    restrictions JSONB DEFAULT '[]',
    expires_at TIMESTAMPTZ,
    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date DATE,
    clinical_rationale TEXT,
    signature_hash VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_mc_case FOREIGN KEY (case_id) REFERENCES injury_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_mc_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_mc_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_mc_cleared_by FOREIGN KEY (cleared_by) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 10.6 ClinicalAttachments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    uploaded_by UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL, -- Encrypted path
    checksum VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT,
    confidentiality_level VARCHAR(50) NOT NULL DEFAULT 'standard',

    CONSTRAINT fk_ca_case FOREIGN KEY (case_id) REFERENCES injury_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

-- ============================================================================
-- 11. CALCULATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 11.1 CalculationConfigurations (Versioned algorithm parameters)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calculation_configurations (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    config_name VARCHAR(255) NOT NULL,
    config_type VARCHAR(50) NOT NULL, -- acwr, monotony, strain, fatigue_index, recovery_index, wellness_index, workload_index, movement_index, injury_risk_index, readiness_index
    version VARCHAR(20) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parent_config_id UUID,

    CONSTRAINT fk_cc_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_cc_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_cc_parent FOREIGN KEY (parent_config_id) REFERENCES calculation_configurations(config_id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 11.2 DailyIndexCalculations (Immutable daily outputs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_index_calculations (
    calculation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    calculation_date DATE NOT NULL,
    config_id UUID NOT NULL,
    wellness_index DECIMAL(5,2),
    wellness_index_confidence VARCHAR(50) NOT NULL DEFAULT 'full',
    fatigue_index DECIMAL(5,2),
    fatigue_index_confidence VARCHAR(50) NOT NULL DEFAULT 'full',
    recovery_index DECIMAL(5,2),
    recovery_index_confidence VARCHAR(50) NOT NULL DEFAULT 'full',
    workload_index DECIMAL(10,2),
    workload_index_confidence VARCHAR(50) NOT NULL DEFAULT 'full',
    acwr_ratio DECIMAL(5,3),
    acwr_method VARCHAR(50) NOT NULL DEFAULT 'rolling',
    acwr_confidence VARCHAR(50) NOT NULL DEFAULT 'full',
    readiness_index DECIMAL(5,2),
    readiness_index_confidence VARCHAR(50) NOT NULL DEFAULT 'full',
    injury_risk_index DECIMAL(5,2),
    injury_risk_index_confidence VARCHAR(50) NOT NULL DEFAULT 'full',
    components_json JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    input_checksum VARCHAR(255),

    CONSTRAINT fk_dic_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_dic_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_dic_config FOREIGN KEY (config_id) REFERENCES calculation_configurations(config_id) ON DELETE CASCADE,
    CONSTRAINT uq_dic_athlete_date UNIQUE (athlete_id, calculation_date)
);

-- ----------------------------------------------------------------------------
-- 11.3 WeeklyIndexCalculations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_index_calculations (
    calculation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    config_id UUID NOT NULL,
    monotony DECIMAL(5,2),
    monotony_confidence VARCHAR(50) NOT NULL DEFAULT 'full',
    strain DECIMAL(10,2),
    strain_confidence VARCHAR(50) NOT NULL DEFAULT 'full',
    weekly_load INTEGER,
    daily_loads_json JSONB DEFAULT '[]',
    classification VARCHAR(50),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    input_checksum VARCHAR(255),

    CONSTRAINT fk_wic_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_wic_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_wic_config FOREIGN KEY (config_id) REFERENCES calculation_configurations(config_id) ON DELETE CASCADE,
    CONSTRAINT uq_wic_athlete_week UNIQUE (athlete_id, week_start_date)
);

-- ----------------------------------------------------------------------------
-- 11.4 MovementIndexCalculations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movement_index_calculations (
    calculation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    config_id UUID NOT NULL,
    movement_index DECIMAL(5,2),
    classification VARCHAR(50),
    penalties_json JSONB DEFAULT '[]',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    input_checksum VARCHAR(255),

    CONSTRAINT fk_mic_assessment FOREIGN KEY (assessment_id) REFERENCES screening_assessments(assessment_id) ON DELETE CASCADE,
    CONSTRAINT fk_mic_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_mic_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_mic_config FOREIGN KEY (config_id) REFERENCES calculation_configurations(config_id) ON DELETE CASCADE
);

-- ============================================================================
-- 12. ALERT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 12.1 Alerts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- risk_index, acwr, wellness, recovery, strain, monotony, screening_overdue, data_missing, system
    severity alert_severity NOT NULL DEFAULT 'moderate',
    athlete_id UUID,
    triggered_by UUID, -- calculation_id or rule_id
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message TEXT NOT NULL,
    recommended_action TEXT,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    acknowledgment_note TEXT,
    escalated_to UUID,
    resolved_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_alert_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_ack_by FOREIGN KEY (acknowledged_by) REFERENCES users(user_id),
    CONSTRAINT fk_alert_escalated_to FOREIGN KEY (escalated_to) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 12.2 AlertAcknowledgments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_acknowledgments (
    acknowledgment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL,
    user_id UUID NOT NULL,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledgment_note TEXT,
    action_taken JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_aa_alert FOREIGN KEY (alert_id) REFERENCES alerts(alert_id) ON DELETE CASCADE,
    CONSTRAINT fk_aa_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_aa_alert_user UNIQUE (alert_id, user_id)
);

-- ============================================================================
-- 13. PERIODIZATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 13.1 PeriodizationPlans
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS periodization_plans (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    season VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    phases JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pp_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    CONSTRAINT fk_pp_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_pp_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT chk_pp_dates CHECK (end_date > start_date)
);

-- ----------------------------------------------------------------------------
-- 13.2 WeeklyLoadTargets
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_load_targets (
    target_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL,
    team_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    target_srpe INTEGER,
    target_distance_m INTEGER,
    target_hsr_m INTEGER,
    target_session_count INTEGER,
    target_monotony_max DECIMAL(5,2),
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_wlt_plan FOREIGN KEY (plan_id) REFERENCES periodization_plans(plan_id) ON DELETE CASCADE,
    CONSTRAINT fk_wlt_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    CONSTRAINT fk_wlt_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_wlt_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT chk_wlt_dates CHECK (week_end_date > week_start_date)
);

-- ============================================================================
-- 14. REPORTING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 14.1 ReportTemplates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL, -- daily_monitoring, weekly_performance, monthly_medical, season_review, injury_epidemiology, board_summary, custom
    modules_included JSONB NOT NULL DEFAULT '[]',
    filters JSONB DEFAULT '{}',
    layout_config JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    is_system_template BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rt_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_rt_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 14.2 ReportInstances
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_instances (
    instance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    generated_by UUID NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    filters_applied JSONB DEFAULT '{}',
    status report_status NOT NULL DEFAULT 'pending',
    format report_format NOT NULL DEFAULT 'pdf',
    file_path VARCHAR(500), -- Encrypted
    file_size_bytes BIGINT,
    checksum VARCHAR(255),
    download_url VARCHAR(500), -- Time-limited presigned URL
    expires_at TIMESTAMPTZ,
    recipient_list JSONB DEFAULT '[]',
    error_message TEXT,

    CONSTRAINT fk_ri_template FOREIGN KEY (template_id) REFERENCES report_templates(template_id) ON DELETE CASCADE,
    CONSTRAINT fk_ri_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_ri_generated_by FOREIGN KEY (generated_by) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 14.3 ReportSchedules
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- daily, weekly, monthly, event_triggered
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
    time_of_day TIME NOT NULL DEFAULT '08:00:00',
    date_range_preset VARCHAR(50) NOT NULL DEFAULT 'last_7_days',
    recipient_user_ids JSONB DEFAULT '[]',
    recipient_emails JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rs_template FOREIGN KEY (template_id) REFERENCES report_templates(template_id) ON DELETE CASCADE,
    CONSTRAINT fk_rs_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_rs_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ============================================================================
-- 15. DASHBOARD & MESSAGING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 15.1 DashboardConfigurations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_configurations (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    dashboard_type VARCHAR(50) NOT NULL, -- executive, coach, sport_scientist, athlete
    widget_layout JSONB DEFAULT '{}',
    default_filters JSONB DEFAULT '{}',
    date_range_default VARCHAR(50) NOT NULL DEFAULT 'last_7_days',
    auto_refresh_interval_seconds INTEGER NOT NULL DEFAULT 120,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_dc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_dc_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT uq_dc_user_type UNIQUE (user_id, dashboard_type)
);

-- ----------------------------------------------------------------------------
-- 15.2 Messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    thread_id UUID,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    athlete_id UUID,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'general', -- general, clinical, coaching, alert_related
    related_alert_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_msg_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_recipient FOREIGN KEY (recipient_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_alert FOREIGN KEY (related_alert_id) REFERENCES alerts(alert_id) ON DELETE SET NULL
);

-- ============================================================================
-- 16. AUDIT & DATA IMPORT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 16.1 AuditLogs (Append-only, immutable)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID, -- NULL for system events
    event_type event_type NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    outcome VARCHAR(50) NOT NULL DEFAULT 'success', -- success, failure
    failure_reason TEXT,

    CONSTRAINT fk_audit_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

COMMENT ON TABLE audit_logs IS 'Immutable append-only record of all data access, modifications, exports, and authentication events.';

-- ----------------------------------------------------------------------------
-- 16.2 DataImportFiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_import_files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    uploaded_by UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- csv, excel, fit, gpx, custom
    storage_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    row_count INTEGER,
    processed_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'uploaded', -- uploaded, parsing, mapping, processing, completed, failed, partial
    mapping_config JSONB DEFAULT '{}',
    error_log JSONB DEFAULT '[]',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_dif_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_dif_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

-- ============================================================================
-- 17. INDEXES (Performance Optimization)
-- ============================================================================

-- Users & Authentication
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- Roles & Assignments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ura_user ON user_role_assignments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ura_role ON user_role_assignments(role_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ura_org ON user_role_assignments(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ura_active ON user_role_assignments(is_active, effective_from, effective_until);

-- Athletes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athletes_org ON athletes(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athletes_active ON athletes(organization_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athletes_user ON athletes(user_id) WHERE user_id IS NOT NULL;

-- Athlete Assignments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ata_athlete ON athlete_team_assignments(athlete_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ata_team ON athlete_team_assignments(team_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ata_dates ON athlete_team_assignments(effective_from, effective_until);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asa_athlete ON athlete_squad_assignments(athlete_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asa_squad ON athlete_squad_assignments(squad_id);

-- Wellness
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wsr_athlete_date ON wellness_survey_responses(athlete_id, survey_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wsr_template ON wellness_survey_responses(template_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wsr_org ON wellness_survey_responses(organization_id);

-- Training & Load
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_team ON training_sessions(team_id, scheduled_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_org ON training_sessions(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slr_athlete ON session_load_records(athlete_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slr_session ON session_load_records(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slr_org ON session_load_records(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dls_athlete_date ON daily_load_summaries(athlete_id, summary_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dls_org_date ON daily_load_summaries(organization_id, summary_date);

-- Wearables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wd_athlete ON wearable_devices(athlete_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wsr_device_date ON wearable_sync_records(device_id, sync_date);

-- Injury Management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_injury_athlete ON injury_cases(athlete_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_injury_org ON injury_cases(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_injury_status ON injury_cases(status, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tn_case ON treatment_notes(case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rtp_case ON return_to_play_stages(case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mc_case ON medical_clearances(case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ca_case ON clinical_attachments(case_id);

-- Calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dic_athlete_date ON daily_index_calculations(athlete_id, calculation_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dic_org ON daily_index_calculations(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wic_athlete ON weekly_index_calculations(athlete_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cc_org_type ON calculation_configurations(organization_id, config_type);

-- Alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_org ON alerts(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_athlete ON alerts(athlete_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_ack ON alerts(is_acknowledged, triggered_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aa_alert ON alert_acknowledgments(alert_id);

-- Reports
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ri_template ON report_instances(template_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ri_org ON report_instances(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rs_template ON report_schedules(template_id);

-- Audit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================================================
-- 18. FUNCTIONS & TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 18.1 Auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_squads_updated_at BEFORE UPDATE ON squads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_athletes_updated_at BEFORE UPDATE ON athletes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_wellness_templates_updated_at BEFORE UPDATE ON wellness_survey_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_training_sessions_updated_at BEFORE UPDATE ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_treatment_notes_updated_at BEFORE UPDATE ON treatment_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_periodization_plans_updated_at BEFORE UPDATE ON periodization_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_weekly_load_targets_updated_at BEFORE UPDATE ON weekly_load_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_report_templates_updated_at BEFORE UPDATE ON report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_report_schedules_updated_at BEFORE UPDATE ON report_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dashboard_config_updated_at BEFORE UPDATE ON dashboard_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_injury_cases_updated_at BEFORE UPDATE ON injury_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 18.2 Audit Log Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB := NULL;
    v_new_values JSONB := NULL;
    v_action VARCHAR(100);
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'data_create';
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'data_update';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'data_delete';
        v_old_values := to_jsonb(OLD);
    END IF;

    INSERT INTO audit_logs (
        organization_id,
        user_id,
        event_type,
        entity_type,
        entity_id,
        action,
        old_values,
        new_values,
        ip_address,
        timestamp,
        outcome
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        NULL, -- Will be set by application layer (current_user context)
        v_action::event_type,
        TG_TABLE_NAME,
        COALESCE(NEW.user_id, OLD.user_id, NEW.athlete_id, OLD.athlete_id, NEW.team_id, OLD.team_id),
        v_action,
        v_old_values,
        v_new_values,
        NULL, -- Set by application layer
        NOW(),
        'success'
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Note: Triggers for specific tables are intentionally NOT created here
-- because audit logging should be implemented at the application layer
-- to capture user_id, ip_address, and session context accurately.
-- The trigger function above serves as the database-level fallback.

-- ----------------------------------------------------------------------------
-- 18.3 Soft Delete Enforcement
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- For tables that should use soft delete only
    UPDATE TG_TABLE_NAME SET is_active = FALSE WHERE ctid = OLD.ctid;
    RETURN NULL; -- Prevent actual DELETE
END;
$$ LANGUAGE plpgsql;

-- Apply soft delete prevention to critical tables
CREATE TRIGGER trg_athletes_soft_delete BEFORE DELETE ON athletes
    FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();
CREATE TRIGGER trg_users_soft_delete BEFORE DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();

-- ----------------------------------------------------------------------------
-- 18.4 Calculation Auto-Trigger (Placeholder)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_calculation_update()
RETURNS TRIGGER AS $$
BEGIN
    -- This function enqueues a calculation job via NOTIFY or queue table
    -- Implementation depends on the chosen message queue (RabbitMQ/SQS)
    NOTIFY calculation_update, payload := json_build_object(
        'athlete_id', NEW.athlete_id,
        'date', COALESCE(NEW.survey_date, NEW.summary_date),
        'table', TG_TABLE_NAME
    )::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-trigger calculations on wellness or load changes
CREATE TRIGGER trg_wellness_calc AFTER INSERT OR UPDATE ON wellness_survey_responses
    FOR EACH ROW EXECUTE FUNCTION trigger_calculation_update();
CREATE TRIGGER trg_load_calc AFTER INSERT OR UPDATE ON daily_load_summaries
    FOR EACH ROW EXECUTE FUNCTION trigger_calculation_update();

-- ============================================================================
-- 19. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_squad_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_load_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_load_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_sync_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_batteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_to_play_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_index_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_index_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_index_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodization_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_load_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_import_files ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 19.1 Tenant Isolation Policy (Base Policy)
-- ----------------------------------------------------------------------------
-- Application layer sets current_setting('app.current_org_id') per request

CREATE POLICY tenant_isolation ON organizations
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON users
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON roles
    USING (organization_id IS NULL OR organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON athletes
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON teams
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON squads
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON wellness_survey_responses
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON session_load_records
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON daily_load_summaries
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON injury_cases
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

CREATE POLICY tenant_isolation ON alerts
    USING (organization_id::text = current_setting('app.current_org_id', TRUE));

-- ----------------------------------------------------------------------------
-- 19.2 Medical Data Additional Protection
-- ----------------------------------------------------------------------------

-- Treatment notes: Only medical staff (users with medical_access role) can access
CREATE POLICY medical_treatment_access ON treatment_notes
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN roles r ON ura.role_id = r.role_id
            WHERE ura.user_id::text = current_setting('app.current_user_id', TRUE)
            AND r.medical_access = TRUE
            AND ura.is_active = TRUE
            AND (ura.effective_until IS NULL OR ura.effective_until >= CURRENT_DATE)
        )
        AND EXISTS (
            SELECT 1 FROM injury_cases ic
            WHERE ic.case_id = treatment_notes.case_id
            AND ic.organization_id::text = current_setting('app.current_org_id', TRUE)
        )
    );

-- Injury diagnoses: Standard confidentiality visible to all medical staff;
-- Restricted confidentiality only to the authoring doctor
CREATE POLICY medical_diagnosis_standard ON injury_diagnoses
    USING (
        confidentiality_level = 'standard'
        AND EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN roles r ON ura.role_id = r.role_id
            WHERE ura.user_id::text = current_setting('app.current_user_id', TRUE)
            AND r.medical_access = TRUE
            AND ura.is_active = TRUE
        )
    );

CREATE POLICY medical_diagnosis_restricted ON injury_diagnoses
    USING (
        confidentiality_level = 'restricted'
        AND diagnosed_by::text = current_setting('app.current_user_id', TRUE)
    );

-- ============================================================================
-- 20. SEED DATA (System Defaults)
-- ============================================================================

-- System roles (global, organization_id IS NULL)
INSERT INTO roles (role_id, name, description, permission_set, medical_access, is_system_role) VALUES
    (gen_random_uuid(), 'administrator', 'Platform governance, user provisioning, billing, compliance oversight', '["user.create", "user.delete", "role.assign", "system.configure", "audit.view", "billing.manage"]', FALSE, TRUE),
    (gen_random_uuid(), 'coach', 'Training prescription, session design, competitive selection, readiness monitoring', '["athlete.view", "session.create", "load.view", "readiness.view", "alert.ack"]', FALSE, TRUE),
    (gen_random_uuid(), 'sport_scientist', 'Monitoring protocols, data integrity, load analytics, performance reporting', '["protocol.configure", "data.export", "calculation.configure", "report.generate", "raw.view"]', FALSE, TRUE),
    (gen_random_uuid(), 'physiotherapist', 'Musculoskeletal health, rehabilitation, return-to-play clearance', '["medical.notes.create", "injury.manage", "rtp.track", "treatment.log", "alert.ack"]', TRUE, TRUE),
    (gen_random_uuid(), 'sports_doctor', 'Medical oversight, diagnoses, serious injury management', '["diagnosis.create", "clearance.grant", "medical.records.all", "prescription.manage"]', TRUE, TRUE),
    (gen_random_uuid(), 'athlete', 'Personal wellness input, readiness feedback, session RPE submission', '["wellness.submit", "rpe.submit", "self.view", "message.send"]', FALSE, TRUE);

-- ============================================================================
-- 21. DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON TABLE organizations IS 'Top-level multi-tenant entity. All data is scoped to an organization.';
COMMENT ON TABLE users IS 'Human accounts with platform access. Includes both staff and athlete-linked users.';
COMMENT ON TABLE roles IS 'RBAC role definitions with permission sets and medical access flags.';
COMMENT ON TABLE user_role_assignments IS 'Temporal role assignments with optional team/squad/athlete scoping.';
COMMENT ON TABLE athletes IS 'Monitored individuals with demographic and medical baseline data.';
COMMENT ON TABLE consent_records IS 'Versioned, legally auditable consent for monitoring and medical data processing.';
COMMENT ON TABLE wellness_survey_templates IS 'Configurable daily survey structure with questions and weighting.';
COMMENT ON TABLE wellness_survey_responses IS 'Immutable athlete responses. One per athlete per template per day.';
COMMENT ON TABLE training_sessions IS 'Scheduled or completed training, competition, or recovery sessions.';
COMMENT ON TABLE session_load_records IS 'Atomic load data per athlete per session. Internal and external metrics.';
COMMENT ON TABLE daily_load_summaries IS 'Pre-computed daily aggregation. Recalculated automatically on new load data.';
COMMENT ON TABLE injury_cases IS 'Master injury record from initial report through resolution.';
COMMENT ON TABLE injury_diagnoses IS 'Clinical diagnoses with ICD-10 coding and confidentiality levels.';
COMMENT ON TABLE treatment_notes IS 'Intervention documentation with manual therapy, exercise, and medication logs.';
COMMENT ON TABLE return_to_play_stages IS 'Rehabilitation stage progression with objective gating criteria.';
COMMENT ON TABLE medical_clearances IS 'Doctor-issued authorization for training or competition with restrictions.';
COMMENT ON TABLE calculation_configurations IS 'Versioned algorithm parameters, weights, and thresholds per organization.';
COMMENT ON TABLE daily_index_calculations IS 'Immutable daily computed outputs for all indices.';
COMMENT ON TABLE audit_logs IS 'Append-only, immutable record of all data access, modifications, and auth events.';

-- ============================================================================
-- 22. PARTITIONING & TIME-SERIES OPTIMIZATION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 22.1 Partitioned Tables (Native PostgreSQL Partitioning by Month)
-- ----------------------------------------------------------------------------

-- Audit Logs: Range partitioning by timestamp for fast archival and query
ALTER TABLE audit_logs ADD CONSTRAINT pk_audit_logs PRIMARY KEY (audit_id, timestamp);

CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE audit_logs_2026_03 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE audit_logs_2026_04 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit_logs_2026_05 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE audit_logs_2026_06 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit_logs_2026_07 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Auto-partition creation trigger function for audit_logs
CREATE OR REPLACE FUNCTION create_audit_partition()
RETURNS TRIGGER AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_date := DATE_TRUNC('month', NEW.timestamp);
    start_date := partition_date;
    end_date := partition_date + INTERVAL '1 month';
    partition_name := 'audit_logs_' || TO_CHAR(partition_date, 'YYYY_MM');

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
        EXECUTE format('CREATE TABLE %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
                       partition_name, start_date, end_date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_partition_insert
    BEFORE INSERT ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION create_audit_partition();

-- Daily Load Summaries: Range partitioning by summary_date for efficient rolling window queries
ALTER TABLE daily_load_summaries ADD CONSTRAINT pk_daily_load_summaries PRIMARY KEY (summary_id, summary_date);

CREATE TABLE daily_load_summaries_2026_01 PARTITION OF daily_load_summaries
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE daily_load_summaries_2026_02 PARTITION OF daily_load_summaries
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE OR REPLACE FUNCTION create_daily_load_partition()
RETURNS TRIGGER AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_date := DATE_TRUNC('month', NEW.summary_date);
    start_date := partition_date;
    end_date := partition_date + INTERVAL '1 month';
    partition_name := 'daily_load_summaries_' || TO_CHAR(partition_date, 'YYYY_MM');

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
        EXECUTE format('CREATE TABLE %I PARTITION OF daily_load_summaries FOR VALUES FROM (%L) TO (%L)',
                       partition_name, start_date, end_date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_daily_load_partition_insert
    BEFORE INSERT ON daily_load_summaries
    FOR EACH ROW EXECUTE FUNCTION create_daily_load_partition();

-- ----------------------------------------------------------------------------
-- 22.2 TimescaleDB Hypertables (if extension enabled)
-- ----------------------------------------------------------------------------

-- Uncomment and execute if TimescaleDB extension is available:
/*
SELECT create_hypertable('wearable_sync_records', 'sync_date', chunk_time_interval => INTERVAL '1 day');
SELECT create_hypertable('daily_index_calculations', 'calculation_date', chunk_time_interval => INTERVAL '7 days');
SELECT create_hypertable('weekly_index_calculations', 'week_start_date', chunk_time_interval => INTERVAL '1 month');

-- Continuous aggregates for wearable data (hourly rollups)
CREATE MATERIALIZED VIEW wearable_hourly_aggregates
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', sync_date) AS bucket,
    athlete_id,
    AVG(sleep_duration_hours) AS avg_sleep_duration,
    AVG(hrv_rmssd) AS avg_hrv_rmssd,
    AVG(resting_hr) AS avg_resting_hr
FROM wearable_sync_records
GROUP BY bucket, athlete_id;
*/

-- ============================================================================
-- 23. VIEWS (Dashboard & Operational Queries)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 23.1 Team Readiness Dashboard View
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_team_readiness AS
SELECT
    t.team_id,
    t.name AS team_name,
    t.organization_id,
    a.athlete_id,
    a.first_name || ' ' || a.last_name AS athlete_name,
    a.position,
    a.jersey_number,
    dic.calculation_date,
    dic.readiness_index,
    dic.readiness_index_confidence,
    dic.injury_risk_index,
    dic.injury_risk_index_confidence,
    dic.wellness_index,
    dic.fatigue_index,
    dic.recovery_index,
    dic.acwr_ratio,
    CASE
        WHEN dic.readiness_index >= 80 THEN 'green'
        WHEN dic.readiness_index >= 60 THEN 'yellow'
        WHEN dic.readiness_index >= 40 THEN 'amber'
        ELSE 'red'
    END AS readiness_zone,
    CASE
        WHEN dic.injury_risk_index < 30 THEN 'green'
        WHEN dic.injury_risk_index < 50 THEN 'yellow'
        WHEN dic.injury_risk_index < 75 THEN 'red'
        ELSE 'crimson'
    END AS risk_zone,
    ic.status AS injury_status,
    rtp.stage_name AS current_rtp_stage,
    mc.clearance_type AS medical_clearance
FROM teams t
INNER JOIN athlete_team_assignments ata ON t.team_id = ata.team_id
    AND ata.status = 'active'
    AND (ata.effective_until IS NULL OR ata.effective_until >= CURRENT_DATE)
INNER JOIN athletes a ON ata.athlete_id = a.athlete_id AND a.is_active = TRUE
LEFT JOIN daily_index_calculations dic ON a.athlete_id = dic.athlete_id
    AND dic.calculation_date = CURRENT_DATE
LEFT JOIN injury_cases ic ON a.athlete_id = ic.athlete_id
    AND ic.status = 'active' AND ic.is_active = TRUE
LEFT JOIN return_to_play_stages rtp ON ic.case_id = rtp.case_id
    AND rtp.is_active = TRUE
LEFT JOIN medical_clearances mc ON ic.case_id = mc.case_id
    AND (mc.expires_at IS NULL OR mc.expires_at >= NOW())
ORDER BY t.team_id, dic.readiness_index ASC NULLS LAST;

COMMENT ON VIEW v_team_readiness IS 'Real-time team readiness grid for coach dashboard. Refreshes on each query.';

-- ----------------------------------------------------------------------------
-- 23.2 Athlete Profile Summary View
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_athlete_profile_summary AS
SELECT
    a.athlete_id,
    a.first_name || ' ' || a.last_name AS athlete_name,
    a.organization_id,
    a.date_of_birth,
    a.gender,
    a.position,
    a.jersey_number,
    t.team_id,
    t.name AS team_name,
    dic.calculation_date AS latest_calculation_date,
    dic.readiness_index,
    dic.injury_risk_index,
    dic.wellness_index,
    dic.fatigue_index,
    dic.recovery_index,
    dic.acwr_ratio,
    dic.components_json,
    dls.summary_date AS latest_load_date,
    dls.total_srpe AS latest_daily_srpe,
    dls.session_count AS latest_session_count,
    wsr.survey_date AS latest_wellness_date,
    wsr.calculated_wellness_index AS latest_wellness_score,
    ic.count_active_injuries,
    rtp.latest_stage_name
FROM athletes a
LEFT JOIN athlete_team_assignments ata ON a.athlete_id = ata.athlete_id
    AND ata.status = 'active'
    AND (ata.effective_until IS NULL OR ata.effective_until >= CURRENT_DATE)
LEFT JOIN teams t ON ata.team_id = t.team_id
LEFT JOIN LATERAL (
    SELECT * FROM daily_index_calculations dic
    WHERE dic.athlete_id = a.athlete_id
    ORDER BY dic.calculation_date DESC LIMIT 1
) dic ON TRUE
LEFT JOIN LATERAL (
    SELECT * FROM daily_load_summaries dls
    WHERE dls.athlete_id = a.athlete_id
    ORDER BY dls.summary_date DESC LIMIT 1
) dls ON TRUE
LEFT JOIN LATERAL (
    SELECT * FROM wellness_survey_responses wsr
    WHERE wsr.athlete_id = a.athlete_id
    ORDER BY wsr.survey_date DESC LIMIT 1
) wsr ON TRUE
LEFT JOIN (
    SELECT athlete_id, COUNT(*) AS count_active_injuries
    FROM injury_cases
    WHERE status = 'active' AND is_active = TRUE
    GROUP BY athlete_id
) ic ON a.athlete_id = ic.athlete_id
LEFT JOIN LATERAL (
    SELECT stage_name AS latest_stage_name
    FROM return_to_play_stages
    WHERE athlete_id = a.athlete_id AND is_active = TRUE
    ORDER BY entry_date DESC LIMIT 1
) rtp ON TRUE
WHERE a.is_active = TRUE;

COMMENT ON VIEW v_athlete_profile_summary IS 'Comprehensive athlete snapshot for individual profile pages and drill-downs.';

-- ----------------------------------------------------------------------------
-- 23.3 Data Compliance Overview View
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_data_compliance_overview AS
WITH expected_daily AS (
    SELECT
        a.athlete_id,
        a.organization_id,
        t.team_id,
        a.first_name || ' ' || a.last_name AS athlete_name,
        CURRENT_DATE AS check_date
    FROM athletes a
    INNER JOIN athlete_team_assignments ata ON a.athlete_id = ata.athlete_id
        AND ata.status = 'active'
    INNER JOIN teams t ON ata.team_id = t.team_id
    WHERE a.is_active = TRUE
)
SELECT
    ed.organization_id,
    ed.team_id,
    ed.check_date,
    COUNT(DISTINCT ed.athlete_id) AS total_athletes,
    COUNT(DISTINCT wsr.athlete_id) AS wellness_submissions,
    COUNT(DISTINCT slr.athlete_id) AS load_records,
    ROUND(COUNT(DISTINCT wsr.athlete_id) * 100.0 / NULLIF(COUNT(DISTINCT ed.athlete_id), 0), 2) AS wellness_compliance_pct,
    ROUND(COUNT(DISTINCT slr.athlete_id) * 100.0 / NULLIF(COUNT(DISTINCT ed.athlete_id), 0), 2) AS load_compliance_pct
FROM expected_daily ed
LEFT JOIN wellness_survey_responses wsr ON ed.athlete_id = wsr.athlete_id
    AND wsr.survey_date = ed.check_date AND wsr.is_active = TRUE
LEFT JOIN session_load_records slr ON ed.athlete_id = slr.athlete_id
    AND slr.recorded_at::date = ed.check_date AND slr.is_active = TRUE
GROUP BY ed.organization_id, ed.team_id, ed.check_date;

COMMENT ON VIEW v_data_compliance_overview IS 'Daily compliance percentage per team for sport scientist dashboard.';

-- ----------------------------------------------------------------------------
-- 23.4 Risk Population Distribution View
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_risk_population_distribution AS
SELECT
    organization_id,
    calculation_date,
    COUNT(*) FILTER (WHERE injury_risk_index < 30) AS green_count,
    COUNT(*) FILTER (WHERE injury_risk_index >= 30 AND injury_risk_index < 50) AS yellow_count,
    COUNT(*) FILTER (WHERE injury_risk_index >= 50 AND injury_risk_index < 75) AS red_count,
    COUNT(*) FILTER (WHERE injury_risk_index >= 75) AS crimson_count,
    COUNT(*) AS total_athletes,
    ROUND(AVG(injury_risk_index), 2) AS avg_risk_index,
    ROUND(AVG(readiness_index), 2) AS avg_readiness_index
FROM daily_index_calculations
WHERE calculation_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY organization_id, calculation_date
ORDER BY organization_id, calculation_date DESC;

COMMENT ON VIEW v_risk_population_distribution IS 'Team risk zone counts for executive and sport scientist dashboards.';

-- ============================================================================
-- 24. MATERIALIZED VIEWS (Reporting & Analytics)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 24.1 Weekly Athlete Aggregates (Refreshed nightly)
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_weekly_athlete_aggregates AS
SELECT
    athlete_id,
    organization_id,
    DATE_TRUNC('week', summary_date) AS week_start,
    SUM(total_srpe) AS weekly_srpe,
    SUM(total_distance_m) AS weekly_distance,
    SUM(total_hsr_m) AS weekly_hsr,
    SUM(total_sprint_m) AS weekly_sprint,
    SUM(session_count) AS weekly_sessions,
    COUNT(*) FILTER (WHERE rest_day = TRUE) AS rest_days,
    AVG(data_completeness_pct) AS avg_data_completeness
FROM daily_load_summaries
WHERE summary_date >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY athlete_id, organization_id, DATE_TRUNC('week', summary_date);

CREATE UNIQUE INDEX idx_mv_weekly_athlete ON mv_weekly_athlete_aggregates (athlete_id, week_start);
CREATE INDEX idx_mv_weekly_org ON mv_weekly_athlete_aggregates (organization_id, week_start);

COMMENT ON MATERIALIZED VIEW mv_weekly_athlete_aggregates IS 'Pre-aggregated weekly load data for fast reporting. Refresh via REFRESH MATERIALIZED VIEW CONCURRENTLY nightly.';

-- ----------------------------------------------------------------------------
-- 24.2 Monthly Injury Summary (Refreshed daily)
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_monthly_injury_summary AS
SELECT
    organization_id,
    DATE_TRUNC('month', reported_at) AS month,
    COUNT(*) AS total_cases,
    COUNT(*) FILTER (WHERE mechanism = 'contact') AS contact_cases,
    COUNT(*) FILTER (WHERE mechanism = 'non_contact') AS non_contact_cases,
    COUNT(*) FILTER (WHERE mechanism = 'overuse') AS overuse_cases,
    COUNT(*) FILTER (WHERE severity = 'mild') AS mild_cases,
    COUNT(*) FILTER (WHERE severity = 'moderate') AS moderate_cases,
    COUNT(*) FILTER (WHERE severity = 'severe') AS severe_cases,
    SUM(actual_days_lost) AS total_days_lost,
    AVG(actual_days_lost) AS avg_days_lost,
    COUNT(DISTINCT athlete_id) AS affected_athletes
FROM injury_cases
WHERE reported_at >= CURRENT_DATE - INTERVAL '24 months'
GROUP BY organization_id, DATE_TRUNC('month', reported_at);

CREATE UNIQUE INDEX idx_mv_injury_monthly ON mv_monthly_injury_summary (organization_id, month);

COMMENT ON MATERIALIZED VIEW mv_monthly_injury_summary IS 'Monthly injury epidemiology for executive reports and compliance. Refresh daily at 06:00 UTC.';

-- ----------------------------------------------------------------------------
-- 24.3 ACWR Population Statistics (Refreshed every 4 hours)
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_acwr_population_stats AS
SELECT
    organization_id,
    calculation_date,
    AVG(acwr_ratio) AS mean_acwr,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY acwr_ratio) AS median_acwr,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY acwr_ratio) AS p95_acwr,
    COUNT(*) FILTER (WHERE acwr_ratio < 0.80) AS underload_count,
    COUNT(*) FILTER (WHERE acwr_ratio >= 0.80 AND acwr_ratio <= 1.30) AS optimal_count,
    COUNT(*) FILTER (WHERE acwr_ratio > 1.30 AND acwr_ratio <= 1.50) AS high_count,
    COUNT(*) FILTER (WHERE acwr_ratio > 1.50) AS very_high_count
FROM daily_index_calculations
WHERE calculation_date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY organization_id, calculation_date;

CREATE UNIQUE INDEX idx_mv_acwr_stats ON mv_acwr_population_stats (organization_id, calculation_date);

COMMENT ON MATERIALIZED VIEW mv_acwr_population_stats IS 'Population-level ACWR statistics for dashboard histograms. Refresh every 4 hours.';

-- ============================================================================
-- 25. STORED FUNCTIONS (Calculation & Business Logic)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 25.1 Z-Score Normalization Helper
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_zscore(
    p_value DECIMAL,
    p_mean DECIMAL,
    p_stddev DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    IF p_stddev = 0 OR p_value IS NULL OR p_mean IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN (p_value - p_mean) / p_stddev;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- 25.2 Normalized Score Helper (50 + 10*z, clamped 0-100)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION normalize_score(
    p_value DECIMAL,
    p_mean DECIMAL,
    p_stddev DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    v_zscore DECIMAL;
    v_normalized DECIMAL;
BEGIN
    v_zscore := calculate_zscore(p_value, p_mean, p_stddev);
    IF v_zscore IS NULL THEN
        RETURN NULL;
    END IF;
    v_normalized := 50 + (10 * v_zscore);
    RETURN GREATEST(0, LEAST(100, v_normalized));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- 25.3 ACWR Calculation (Rolling Average Method)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_acwr_rolling(
    p_athlete_id UUID,
    p_calculation_date DATE,
    p_acute_days INTEGER DEFAULT 7,
    p_chronic_days INTEGER DEFAULT 28,
    p_metric VARCHAR DEFAULT 'srpe'
)
RETURNS TABLE (
    acwr_ratio DECIMAL,
    acute_load DECIMAL,
    chronic_mean DECIMAL,
    confidence VARCHAR
) AS $$
DECLARE
    v_acute_load DECIMAL;
    v_chronic_total DECIMAL;
    v_chronic_mean DECIMAL;
    v_acwr DECIMAL;
BEGIN
    -- Calculate acute load (sum of last N days)
    SELECT COALESCE(SUM(
        CASE p_metric
            WHEN 'srpe' THEN total_srpe
            WHEN 'distance' THEN total_distance_m
            WHEN 'player_load' THEN total_player_load
            ELSE total_srpe
        END
    ), 0)
    INTO v_acute_load
    FROM daily_load_summaries
    WHERE athlete_id = p_athlete_id
    AND summary_date > p_calculation_date - p_acute_days
    AND summary_date <= p_calculation_date;

    -- Calculate chronic load (sum of last N days, divided by ratio)
    SELECT COALESCE(SUM(
        CASE p_metric
            WHEN 'srpe' THEN total_srpe
            WHEN 'distance' THEN total_distance_m
            WHEN 'player_load' THEN total_player_load
            ELSE total_srpe
        END
    ), 0)
    INTO v_chronic_total
    FROM daily_load_summaries
    WHERE athlete_id = p_athlete_id
    AND summary_date > p_calculation_date - p_chronic_days
    AND summary_date <= p_calculation_date;

    IF v_chronic_total = 0 THEN
        RETURN QUERY SELECT NULL::DECIMAL, v_acute_load, NULL::DECIMAL, 'insufficient_data'::VARCHAR;
        RETURN;
    END IF;

    v_chronic_mean := v_chronic_total / (p_chronic_days::DECIMAL / p_acute_days);
    v_acwr := v_acute_load / NULLIF(v_chronic_mean, 0);

    RETURN QUERY SELECT v_acwr, v_acute_load, v_chronic_mean, 'full'::VARCHAR;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_acwr_rolling IS 'Calculates rolling average ACWR for an athlete on a given date.';

-- ----------------------------------------------------------------------------
-- 25.4 Monotony Calculation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_monotony(
    p_athlete_id UUID,
    p_week_start DATE,
    p_metric VARCHAR DEFAULT 'srpe'
)
RETURNS TABLE (
    monotony DECIMAL,
    mean_load DECIMAL,
    stddev_load DECIMAL,
    classification VARCHAR
) AS $$
DECLARE
    v_mean DECIMAL;
    v_stddev DECIMAL;
    v_monotony DECIMAL;
BEGIN
    SELECT
        AVG(daily_load),
        STDDEV_SAMP(daily_load)
    INTO v_mean, v_stddev
    FROM (
        SELECT summary_date AS day,
            CASE p_metric
                WHEN 'srpe' THEN total_srpe
                WHEN 'distance' THEN total_distance_m
                WHEN 'player_load' THEN total_player_load
                ELSE total_srpe
            END AS daily_load
        FROM daily_load_summaries
        WHERE athlete_id = p_athlete_id
        AND summary_date >= p_week_start
        AND summary_date < p_week_start + INTERVAL '7 days'
    ) daily;

    IF v_stddev = 0 OR v_stddev IS NULL THEN
        IF v_mean = 0 OR v_mean IS NULL THEN
            RETURN QUERY SELECT NULL::DECIMAL, v_mean, v_stddev, 'complete_rest_week'::VARCHAR;
        ELSE
            RETURN QUERY SELECT NULL::DECIMAL, v_mean, v_stddev, 'maximum_monotony'::VARCHAR;
        END IF;
        RETURN;
    END IF;

    v_monotony := v_mean / v_stddev;

    RETURN QUERY SELECT v_monotony, v_mean, v_stddev,
        CASE
            WHEN v_monotony < 2.0 THEN 'low'
            WHEN v_monotony < 2.5 THEN 'moderate'
            ELSE 'high'
        END;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- 25.5 Wellness Index Calculation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_wellness_index(
    p_fatigue INTEGER,
    p_mood INTEGER,
    p_stress INTEGER,
    p_sleep_quality INTEGER,
    p_sleep_duration DECIMAL,
    p_soreness INTEGER,
    p_target_sleep DECIMAL DEFAULT 8.0
)
RETURNS TABLE (
    wellness_index DECIMAL,
    sleep_score DECIMAL,
    classification VARCHAR
) AS $$
DECLARE
    v_sleep_score DECIMAL;
    v_sleep_duration_score DECIMAL;
    v_sleep_quality_score DECIMAL;
    v_wellness DECIMAL;
BEGIN
    -- Sleep duration score (capped at 100)
    v_sleep_duration_score := LEAST(100, (p_sleep_duration / p_target_sleep) * 100);
    -- Sleep quality score (1-5 scale → 20-100)
    v_sleep_quality_score := p_sleep_quality * 20;
    -- Weighted sleep score
    v_sleep_score := (0.60 * v_sleep_duration_score) + (0.40 * v_sleep_quality_score);

    -- Simple average wellness (fatigue inverted: 10-fatigue → normalized)
    v_wellness := (
        ((10 - p_fatigue) * 10) +
        (p_mood * 20) +
        ((10 - p_stress) * 10) +
        v_sleep_score +
        ((10 - p_soreness) * 10)
    ) / 5;

    RETURN QUERY SELECT v_wellness, v_sleep_score,
        CASE
            WHEN v_wellness > 80 THEN 'excellent'
            WHEN v_wellness > 60 THEN 'good'
            WHEN v_wellness > 40 THEN 'compromised'
            ELSE 'poor'
        END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- 25.6 Get Athlete 28-Day Statistics (for normalization)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_athlete_28d_stats(
    p_athlete_id UUID,
    p_end_date DATE,
    p_metric VARCHAR DEFAULT 'srpe'
)
RETURNS TABLE (
    metric_mean DECIMAL,
    metric_stddev DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT
        AVG(daily_value),
        STDDEV_SAMP(daily_value)
    FROM (
        SELECT CASE p_metric
            WHEN 'srpe' THEN total_srpe
            WHEN 'distance' THEN total_distance_m
            ELSE total_srpe
        END AS daily_value
        FROM daily_load_summaries
        WHERE athlete_id = p_athlete_id
        AND summary_date > p_end_date - INTERVAL '28 days'
        AND summary_date <= p_end_date
    ) stats;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- 25.7 Refresh Materialized Views Scheduler Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_athlete_aggregates;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_injury_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_acwr_population_stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_materialized_views IS 'Refreshes all reporting materialized views concurrently. Call via pg_cron or application scheduler.';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
