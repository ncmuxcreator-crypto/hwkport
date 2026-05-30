# Platform Safeguards

## Single Source of Truth

- `vessel_master`: vessel identity.
- `port_call_master`: unique port visit and commercial opportunity context.
- `vessel_snapshots`: run-level normalized state.
- `active_dataset_pointer`: live dashboard source.
- Daily snapshot tables: historical intelligence and trend learning.

## Idempotency

All rerunnable writes should use stable IDs and upsert behavior:

- `snapshot_uid` for `vessel_snapshots`
- `port_call_id` for `port_call_master`
- `run_id` for run-level audits
- `source_log_id` for source logs
- daily snapshot unique keys by date + entity

Rerunning a collection or reprocess job must not create duplicate port calls or duplicate snapshots for the same stable key.

## Run ID Discipline

Every generated row must include `run_id` when it is tied to a collection/reprocess run:

- source logs
- snapshots
- port calls
- candidates/materialized current rows
- summaries
- diagnostics
- feature and rule rows

If a response is summary-only, include `active_run_id`, `summary_run_id`, or a clear fallback reason.

## Backfill and Reprocess

Use:

```powershell
npm.cmd run reprocess -- --date=YYYY-MM-DD
```

or:

```powershell
npm.cmd run reprocess -- --file=data/reports/YYYY-MM-DD.json
```

Reprocess jobs must create a new `reprocess_*` run id and write through the same idempotent persistence layer.

## Production Promotion Rules

- `no_live_data` is never production-ready.
- Empty datasets must not overwrite active production data.
- Port Operation failure is fatal in production.
- Optional enrichment failure is degraded, not fatal.
- Missing operator/contact/IMO is allowed missing, not a visibility blocker.

## Access Control Preparation

Data is separated into:

- external fields: safe dashboard fields
- internal fields: diagnostics and scoring internals
- contact intelligence: company-level contact readiness only
- raw source payloads: archive-only, not dashboard serving data

The platform must not scrape or publish personal contacts.
