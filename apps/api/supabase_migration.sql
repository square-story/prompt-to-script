-- ============================================================
-- Creeto AI — Supabase Migration
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL,
  org_id      UUID,
  type        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'QUEUED',
  payload     JSONB,
  result      JSONB,
  error       TEXT,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_jobs_project_type_status
  ON public.jobs (project_id, type, status);

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL UNIQUE,
  niche                 TEXT,
  sub_niche             TEXT,
  target_audience       TEXT,
  content_goal          TEXT,
  brand_voice           TEXT,
  platform_preference   TEXT[],
  keywords              TEXT[],
  language              TEXT DEFAULT 'en',
  cloned_voice_id       TEXT,
  avatar_url            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ
);

-- 3. Fact-check results table
CREATE TABLE IF NOT EXISTS public.fact_check_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL,
  topic_id              TEXT,
  verified_facts        JSONB,
  flagged_claims        JSONB,
  blocked_claims        JSONB,
  facts_block_summary   TEXT,
  checked_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_factcheck_project
  ON public.fact_check_results (project_id);

-- 4. Scripts table
CREATE TABLE IF NOT EXISTS public.scripts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                  UUID NOT NULL,
  hook_variants               JSONB,
  hook_variant_selected       TEXT,
  hook                        TEXT,
  context                     TEXT,
  core_idea                   TEXT,
  example_evidence            TEXT,
  conclusion                  TEXT,
  call_to_action              TEXT,
  word_count                  INTEGER,
  estimated_duration_seconds  INTEGER,
  version                     INTEGER DEFAULT 1,
  approved_at                 TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scripts_project
  ON public.scripts (project_id);

-- 5. Safety events table
CREATE TABLE IF NOT EXISTS public.safety_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID,
  org_id      UUID,
  layer       INTEGER,
  category    TEXT,
  input_hash  TEXT,
  blocked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_safety_project
  ON public.safety_events (project_id);
