# Troubleshooting

## Empty Dashboard

Symptoms:

- KPI cards show zero or warning.
- `vessels.json` is empty.
- `status.record_count = 0`.
- `data_mode = no_live_data`.

Check:

1. `dashboard/api/backend-doctor.json`
2. `dashboard/api/source-health-runtime.json`
3. `dashboard/api/quality/dataset-generation-audit.json`
4. `dashboard/api/snapshot-guard.json`
5. `/api/dashboard-summary.json` from the Worker

Expected behavior:

- Local/no-secret runs may write diagnostics only.
- Production runs must not promote `no_live_data`.
- The dashboard should show the last successful summary when available.

## Missing Config

Check `/api/config-status.json` or `config_diagnostics` in `status.json`.

Important fields:

- `missing_required_config`
- `enabled_sources`
- `enabled_ports_count`
- `active_runtime_limits`
- `validation_mode`
- `serving_mode`
- `production_data_source`

Missing `PORT_OPERATION_SERVICE_KEY` or `PORT_OPERATION_API_URL` blocks primary collection.

## Target Count Mismatch

Symptoms:

- KPI shows sales targets.
- Target table is empty.

Check:

- `dashboard/api/dashboard-summary.json`
- `dashboard/api/target-vessels.json`
- `/api/vessels?group=target&page=1&pageSize=50`
- `dataset_run_id_summary`
- `dataset_run_id_table`

Likely causes:

- Summary and table are using different run IDs.
- Static JSON fallback is empty while Worker/Supabase has live data.
- Pagination or filters hide rows.

## Stale Data

Freshness windows:

- Port Operation: 24h
- Pilot: 6h
- PNC/Berth/Ulsan: 12h
- AIS/VTS: 1h
- Operator/Agent DB: 30d

If current collection is running or failed, the UI should show a stale/fallback badge instead of blank values.

## Export Issues

CSV export is browser-side and read-only.

If export is empty:

- Click `목록 보기` first.
- Clear filters.
- Switch between `영업대상` and `전체선박`.

