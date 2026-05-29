alter table if exists vessel_snapshots add column if not exists snapshot_date date default current_date;
alter table if exists vessel_snapshots alter column snapshot_date set default current_date;
alter table if exists vessel_snapshots add column if not exists data_quality_score int default 0;
alter table if exists vessel_snapshots add column if not exists data_quality_band text;
alter table if exists vessel_snapshots add column if not exists source_confidence_score int default 0;
alter table if exists vessel_snapshots add column if not exists port_call_identity text;
alter table if exists vessel_snapshots add column if not exists sub_port text;
alter table if exists vessel_snapshots add column if not exists agent_source text;
alter table if exists vessel_snapshots add column if not exists operator_source text;

do $$
begin
  if to_regclass('public.vessel_snapshots') is not null then
    execute 'create index if not exists idx_vessel_snapshots_data_quality_score on vessel_snapshots(data_quality_score desc)';
    execute 'create index if not exists idx_vessel_snapshots_date on vessel_snapshots(snapshot_date desc)';
    execute 'create index if not exists idx_vessel_snapshots_port_call_identity on vessel_snapshots(port_call_identity)';
  end if;
end $$;
