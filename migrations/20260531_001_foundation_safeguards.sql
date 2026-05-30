alter table rule_evaluations add column if not exists rule_version text default 'commercial_rules_v2026_05_31';
create index if not exists idx_rule_evaluations_version on rule_evaluations(rule_version);

alter table explainability_snapshots add column if not exists rule_versions jsonb default '[]'::jsonb;
