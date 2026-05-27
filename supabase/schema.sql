create table if not exists vessels (
  vessel_id text primary key,
  imo text,
  vessel_name text not null,
  vessel_type text,
  operator text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists port_calls (
  id bigserial primary key,
  vessel_id text references vessels(vessel_id),
  vessel_name text not null,
  imo text,
  port text not null,
  berth text,
  eta timestamptz,
  etd timestamptz,
  status text,
  source text not null,
  collected_at timestamptz not null,
  risk_score int default 0,
  sales_reason jsonb default '[]'::jsonb,
  raw_payload jsonb,
  unique_key text unique
);

create table if not exists vessel_snapshots (
  id bigserial primary key,
  snapshot_date date not null,
  vessel_id text not null,
  vessel_name text,
  port text,
  status text,
  operator text,
  berth text,
  eta timestamptz,
  etd timestamptz,
  source text,
  risk_score int default 0,
  sales_reason jsonb default '[]'::jsonb,
  hybrid_entity_key text,
  payload jsonb default '{}'::jsonb,
  updated_at timestamptz,
  collected_at timestamptz not null
);

create table if not exists pipeline_runs (
  id bigserial primary key,
  run_started_at timestamptz not null,
  run_finished_at timestamptz,
  status text not null,
  records_collected int default 0,
  records_saved int default 0,
  errors jsonb default '[]'::jsonb
);

create index if not exists idx_port_calls_collected_at on port_calls(collected_at desc);
create index if not exists idx_port_calls_port on port_calls(port);
create index if not exists idx_port_calls_risk_score on port_calls(risk_score desc);
create index if not exists idx_vessel_snapshots_date on vessel_snapshots(snapshot_date desc);

alter table vessel_snapshots add column if not exists vessel_name text;
alter table vessel_snapshots add column if not exists operator text;
alter table vessel_snapshots add column if not exists source text;
alter table vessel_snapshots add column if not exists updated_at timestamptz;
alter table vessel_snapshots add column if not exists payload jsonb default '{}'::jsonb;
alter table vessel_snapshots add column if not exists hybrid_entity_key text;
alter table vessel_snapshots drop constraint if exists vessel_snapshots_snapshot_date_vessel_id_port_key;
create index if not exists idx_vessel_snapshots_hybrid_entity_key on vessel_snapshots(hybrid_entity_key);
create index if not exists idx_vessel_snapshots_collected_at on vessel_snapshots(collected_at desc);

create table if not exists vessel_entities (
  hybrid_entity_key text primary key,
  vessel_id text,
  vessel_name text,
  imo text,
  mmsi text,
  call_sign text,
  vessel_type text,
  gt numeric,
  operator text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  payload jsonb default '{}'::jsonb
);

create table if not exists vessel_master (
  master_vessel_id text primary key,
  imo text,
  mmsi text,
  call_sign text,
  canonical_name text,
  normalized_name text,
  vessel_type text,
  gt numeric,
  dwt numeric,
  loa numeric,
  beam numeric,
  operator text,
  flag text,
  identity_confidence int default 0,
  first_seen timestamptz default now(),
  last_seen timestamptz default now(),
  payload jsonb default '{}'::jsonb
);

create table if not exists vessel_aliases (
  id bigserial primary key,
  alias_name text not null,
  master_vessel_id text not null,
  source text,
  confidence int default 0,
  created_at timestamptz default now(),
  unique(alias_name, master_vessel_id, source)
);

create table if not exists vessel_identity_candidates (
  id bigserial primary key,
  hybrid_entity_key text,
  vessel_id text,
  vessel_name text,
  likely_imo_candidates jsonb default '[]'::jsonb,
  confidence_band text,
  manual_review_required boolean default false,
  collected_at timestamptz default now(),
  payload jsonb default '{}'::jsonb
);

create table if not exists vessel_events (
  id bigserial primary key,
  hybrid_entity_key text,
  vessel_id text,
  event_type text not null,
  port text,
  event_at timestamptz not null default now(),
  payload jsonb default '{}'::jsonb
);

create table if not exists risk_history (
  id bigserial primary key,
  hybrid_entity_key text,
  vessel_id text,
  port text,
  total_sales_priority_score int default 0,
  biofouling_risk_score int default 0,
  collected_at timestamptz not null default now(),
  payload jsonb default '{}'::jsonb
);

create table if not exists port_congestion_snapshots (
  id bigserial primary key,
  port_code text,
  port_name text,
  total_vessels int default 0,
  anchorage_vessels int default 0,
  long_idle_vessels int default 0,
  average_waiting_time numeric default 0,
  berth_occupancy numeric default 0,
  anchorage_density numeric default 0,
  congestion_score int default 0,
  collected_at timestamptz not null default now(),
  payload jsonb default '{}'::jsonb
);

create table if not exists anchorage_clusters (
  id bigserial primary key,
  port_code text,
  port_name text,
  anchorage_name text,
  vessel_count int default 0,
  average_anchorage_hours numeric default 0,
  density_score int default 0,
  collected_at timestamptz not null default now(),
  payload jsonb default '{}'::jsonb
);

create table if not exists berth_occupancy_history (
  id bigserial primary key,
  port_code text,
  port_name text,
  berth_name text,
  vessel_count int default 0,
  occupancy_score int default 0,
  collected_at timestamptz not null default now(),
  payload jsonb default '{}'::jsonb
);

create index if not exists idx_vessel_master_imo on vessel_master(imo);
create index if not exists idx_vessel_master_mmsi on vessel_master(mmsi);
create index if not exists idx_vessel_identity_candidates_collected_at on vessel_identity_candidates(collected_at desc);
create index if not exists idx_port_congestion_snapshots_collected_at on port_congestion_snapshots(collected_at desc);
