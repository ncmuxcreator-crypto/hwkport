alter table vessel_snapshots add column if not exists gt_source text;
alter table vessel_snapshots add column if not exists eta_source text;
alter table vessel_snapshots add column if not exists congestion_source text;
alter table vessel_snapshots add column if not exists score_source text;

alter table port_call_master add column if not exists gt_source text;
alter table port_call_master add column if not exists eta_source text;
alter table port_call_master add column if not exists operator_source text;
alter table port_call_master add column if not exists congestion_source text;
alter table port_call_master add column if not exists score_source text;
