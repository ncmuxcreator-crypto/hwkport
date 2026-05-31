-- Run-level vessel universe diagnostics.
-- This table is diagnostic, not a blocker for live dashboard serving.

create table if not exists public.vessel_universe_audit (
  audit_id text primary key,
  run_id text unique,
  generated_at timestamptz default now(),
  raw_rows_total int default 0,
  normalized_rows_total int default 0,
  duplicate_rows_removed int default 0,
  duplicate_rate numeric default 0,
  unique_port_calls_count int default 0,
  unique_vessels_count int default 0,
  all_vessels_count int default 0,
  watchlist_count int default 0,
  sales_target_count int default 0,
  immediate_target_count int default 0,
  target_ratio numeric default 0,
  candidate_generation_status text,
  source_breakdown jsonb default '[]'::jsonb,
  dedupe_audit jsonb default '{}'::jsonb,
  candidate_promotion_audit jsonb default '{}'::jsonb,
  dashboard_dataset_audit jsonb default '{}'::jsonb,
  suspected_counting_issues jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_vessel_universe_audit_run_id
  on public.vessel_universe_audit(run_id);

create index if not exists idx_vessel_universe_audit_generated_at
  on public.vessel_universe_audit(generated_at desc);

create index if not exists idx_vessel_universe_audit_target_ratio
  on public.vessel_universe_audit(target_ratio);
