-- profiles
create table if not exists profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users on delete cascade,
  niche               text,
  sub_niche           text,
  target_audience     text,
  content_goal        text,
  brand_voice         text,
  platform_preference text[],
  keywords            text[],
  language            text default 'en',
  cloned_voice_id     text,
  avatar_url          text,
  supermemory_synced_at timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique(user_id)
);

-- projects
create table if not exists projects (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users on delete cascade,
  name                 text not null,
  status               text default 'draft',
  selected_topic_id    uuid,
  selected_topic_title text,
  created_at           timestamptz default now()
);

-- jobs
create table if not exists jobs (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects on delete cascade,
  type         text not null,
  status       text not null default 'QUEUED',
  payload      jsonb,
  result       jsonb,
  error        text,
  safety_block jsonb,
  fact_flags   jsonb,
  attempts     int default 0,
  org_id       uuid,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- fact_check_results
create table if not exists fact_check_results (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid references projects on delete cascade,
  topic_id            text,
  verified_facts      jsonb default '[]',
  flagged_claims      jsonb default '[]',
  blocked_claims      jsonb default '[]',
  facts_block_summary text,
  checked_at          timestamptz default now(),
  org_id              uuid
);

-- scripts
create table if not exists scripts (
  id                          uuid primary key default gen_random_uuid(),
  project_id                  uuid references projects on delete cascade,
  hook_variants               jsonb default '[]',
  hook_variant_selected       text,
  hook                        text,
  context                     text,
  core_idea                   text,
  example_evidence            text,
  conclusion                  text,
  call_to_action              text,
  word_count                  int,
  estimated_duration_seconds  int,
  version                     int default 1,
  approved_at                 timestamptz,
  created_at                  timestamptz default now()
);

-- source_records
create table if not exists source_records (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects on delete cascade,
  source_type  text,
  storage_path text,
  source_url   text,
  status       text default 'PENDING',
  chunk_count  int default 0,
  created_at   timestamptz default now()
);

-- safety_events
create table if not exists safety_events (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid,
  org_id      uuid,
  layer       int,
  category    text,
  input_hash  text,
  blocked_at  timestamptz default now()
);

-- Enable real-time
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table scripts;
alter publication supabase_realtime add table fact_check_results;
