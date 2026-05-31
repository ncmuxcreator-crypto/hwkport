alter table if exists dashboard_summary_snapshots
  add column if not exists total_vessels int default 0;

alter table if exists dashboard_summary_snapshots
  add column if not exists data_mode text;
