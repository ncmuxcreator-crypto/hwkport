# Release Checklist

Use this checklist before merging or releasing dashboard and backend safety changes.

## Data Readiness

- GitHub Actions completed without collection or validation failure.
- `backend-doctor` reports `production_ready=true` for production runs.
- `all_vessels_count > 0` after successful collection.
- `target_ratio` is reasonable or has an explicit warning.
- No duplicate `port_call_id` is reported.
- Dashboard summary counts match table/API counts.
- `no_live_data` was not promoted as production.
- Previous successful dataset remains available when the latest run fails.

## Serving Mode

- Worker/Supabase mode uses `active_dataset_pointer` as production source of truth.
- Static JSON is fallback or local diagnostics only.
- `/api/config-status.json` shows expected enabled sources and runtime limits.
- `/api/dashboard-summary.json` includes `run_id`, `active_run_id`, `generated_at`, `data_source_used`, `fallback_used`, `data_freshness`, and `record_count`.

## UI Safety

- Empty states explain whether data is missing, stale, failed, or fallback.
- KPI cards render before heavy tables.
- Full vessel list is paginated or lazy-loaded.
- Export buttons export only the currently displayed, target, or port summary data.
- Saved filters use localStorage only.

## Documentation

- `docs/runbook.md` reflects the current debug flow.
- `docs/data-dictionary.md` reflects canonical fields and deprecated aliases.
- `docs/troubleshooting.md` covers any newly discovered failure mode.

