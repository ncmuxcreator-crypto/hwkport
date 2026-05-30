# Schema Migrations

All database schema changes must be added here before or with changes to `supabase/schema.sql`.

Rules:

- Use timestamped filenames: `YYYYMMDD_NNN_description.sql`.
- Keep migrations idempotent with `create table if not exists`, `alter table ... add column if not exists`, and `create index if not exists`.
- Do not rely on ad-hoc manual schema edits without a migration file.
- `supabase/schema.sql` remains the consolidated install script, while this directory records change history.
