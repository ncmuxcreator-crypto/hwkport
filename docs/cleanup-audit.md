# Cleanup Audit

Date: 2026-05-30

Goal: reduce legacy paths and duplicate concepts without breaking the production collection, scoring, Worker API, or dashboard.

## Cleanup Policy

- Do not delete unknown files aggressively.
- Remove only files proven unused by imports, package scripts, GitHub Actions, Worker routes, and dashboard reads.
- Prefer deprecation comments before deletion.
- Do not drop database columns in this phase.
- Keep read compatibility for legacy fields until all consumers migrate.

## Canonical Fields

### Score Fields

Canonical:

- `commercial_value_score`

Deprecated compatibility aliases:

- `risk_score`
- `total_sales_priority_score`
- `cleaning_candidate_score` when used as a commercial ranking field

Current action:

- Production ranking and candidate logic should use `commercial_value_score`.
- `scripts/score.js` is kept only as a compatibility shim.
- Deprecated score aliases are still written/read in selected places for older reports and dashboard fallbacks.

Pending cleanup:

- Migrate old health/audit scripts away from `risk_score`.
- Stop writing `total_sales_priority_score` after dashboard and validation consumers are fully migrated.
- Drop deprecated DB columns only in a later explicit migration.

### Location and Source Fields

Canonical:

- `port_code`
- `port_name`
- `berth_name`
- `terminal_name`
- `source_name`

Deprecated compatibility aliases:

- `port`
- `berth`
- `source`

Current action:

- New code should prefer canonical fields.
- Legacy aliases remain for read compatibility and generated JSON compatibility.

Pending cleanup:

- Replace remaining dashboard/report consumers that still read `port`, `berth`, or `source`.
- Stop writing aliases only after Worker, dashboard, health scripts, and validation no longer require them.

## File Audit

| Path | Classification | Evidence | Action |
| --- | --- | --- | --- |
| `.github/workflows/longterm-update.yml` | active | Required by `scripts/validate.js`; runs update, validation, health, deploy | Keep |
| `.github/workflows/daily-enrichment.yml` | active | Referenced by `package.json` and `scripts/validate.js` | Keep |
| `.github/workflows/actions-health-check.yml` | active | Required by `scripts/validate.js` | Keep |
| `.github/workflows/push-smoke-test.yml` | active | Required by `scripts/validate.js` | Keep |
| `scripts/update.js` | active | Main collection, scoring, persistence, reporting pipeline | Keep |
| `scripts/collectors/korea.js` | active | Main Port Operation and enrichment collector | Keep |
| `scripts/collectors/index.js` | deprecated_safe_to_remove later | No active references found; previously imported missing `sample.js` | Replaced with empty deprecated registry, do not delete yet |
| `scripts/score.js` | legacy_but_used | Compatibility exports only; not the production scoring engine | Keep as shim |
| `scripts/lib/db.js` | active | Supabase persistence and dataset promotion | Keep |
| `scripts/lib/config.js` | active | Central runtime config diagnostics | Keep |
| `scripts/pipeline/*.js` | active | Backend architecture stage metadata | Keep |
| `scripts/reprocess.js` | active | `npm run reprocess` | Keep |
| `scripts/daily-enrichment.js` | active | `npm run daily:enrich`, daily enrichment workflow | Keep |
| `scripts/*audit*.js`, `scripts/*guard*.js`, `scripts/source-health.js` | active | Referenced by `npm run health` or generated diagnostics | Keep |
| `src/worker.js` | active | Cloudflare Worker API surface | Keep |
| `src/worker.js` `PORT_REGISTRY` | legacy_but_used | Worker needs a bundled registry; marked as generated from CSV | Keep as generated compatibility cache |
| `data/reference/ports_registry.csv` | active | Port registry source of truth | Keep |
| `data/reference/*.csv` | active | Progressive enrichment dictionaries | Keep |
| `dashboard/api/*.json` | legacy_but_used | Generated local/debug outputs; skipped from Cloudflare asset upload | Keep for validation/local fallback, do not serve as production source |
| `data/latest-lite.json` | legacy_but_used | Generated local snapshot and validation input | Keep short-term |
| `data/pipeline-report.json` | active | Validation, workflow diagnostics, artifact | Keep |
| `data/reports/*.json` | legacy_but_used | Generated historical reports; some older files contain sample markers | Keep for now; archive/retention cleanup later |
| `data/history/*.json` | legacy_but_used | Generated local history; older files contain sample markers | Keep for now; archive/retention cleanup later |
| `data/candidate-summary.json` | deprecated_safe_to_remove later | Old generated sample-era summary found outside `dashboard/api` | Keep until references are rechecked in a clean branch |
| `supabase/views.sql` | legacy_but_used | Uses older `port_calls` fields; may support old views | Keep, mark for migration |
| `supabase/schema.sql` | active | Cumulative schema/migration file | Keep |

## Sample and Demo Data Findings

Active code:

- `scripts/collectors/korea.js` does not define sample vessel rows.
- `scripts/collectors/sample.js` is absent.
- `scripts/validate.js` blocks forbidden sample/demo markers from generated active outputs.

Legacy generated artifacts:

- `data/history/2026-05-24.json`
- `data/history/2026-05-25.json`
- `data/history/2026-05-26.json`
- `data/reports/2026-05-24.json`
- `data/reports/2026-05-25.json`
- `data/reports/2026-05-26.json`
- `data/candidate-summary.json`

These contain old sample-era markers such as `MV HF ZHOUSHAN`, `MAERSK DEMO`, and `YEOSU TARGET`. They are not production collector code, but they should be archived or removed in a separate generated-data cleanup after confirming artifact retention needs.

## Production Data Path

Canonical production serving rule:

1. Port Operation and enrichment collectors write normalized data.
2. Supabase persistence writes `vessel_master`, `port_call_master`, `vessel_snapshots`, daily warehouse tables, and `active_dataset_pointer`.
3. Cloudflare Worker reads the active dataset from Supabase.
4. Generated `dashboard/api/*.json` files are local/debug artifacts and are skipped during Cloudflare asset upload.

## Removed Files

None in this phase.

Reason: the request was a safe audit. The only confirmed-unused code path was converted into a harmless deprecated empty registry instead of being deleted.

## Deprecated Comments Added

- `scripts/collectors/index.js`: marked as deprecated empty registry; sample collector cannot be re-enabled.
- `src/worker.js`: marked `PORT_REGISTRY` as generated compatibility cache from `data/reference/ports_registry.csv`.
- `scripts/update.js`: documented canonical score/location/source fields and compatibility aliases.

## Pending Cleanup

1. Migrate all consumers from `risk_score` and `total_sales_priority_score` to `commercial_value_score`.
2. Migrate all consumers from `port`, `berth`, and `source` to canonical fields.
3. Add a generated-data retention job for old `data/history`, `data/reports`, and `dashboard/api` artifacts.
4. Archive or delete sample-era generated artifacts after retention policy approval.
5. Generate Worker port registry automatically from `data/reference/ports_registry.csv` during build instead of maintaining a manual cache.
6. Split remaining large sections of `scripts/update.js` into real modules after the current production path is stable.
7. Later migration only: drop deprecated DB columns after dashboard, Worker, scripts, and historical reports no longer use them.
