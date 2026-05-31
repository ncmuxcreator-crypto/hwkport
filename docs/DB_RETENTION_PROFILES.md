# HWK DB Retention Profiles

HWK supports three database retention modes through one environment value:

```env
DB_RETENTION_PROFILE=pro_7_5gb
```

Other supported modes:

```env
DB_RETENTION_PROFILE=free_500mb
DB_RETENTION_PROFILE=ideal
```

## pro_7_5gb

Use this as the default Pro Plan operating mode.

- Target size: 6.5 GB
- Hard cap: 7.5 GB
- Keeps active run plus 30 promoted runs
- Keeps operational intelligence history, usually 14-365 days
- Preserves enough history for sales follow-up, trend review, and model calibration without letting Supabase grow unbounded


## free_500mb

Use this while Supabase Free Plan size matters.

- Target size: 450 MB
- Hard cap: 500 MB
- Keeps active run plus latest promoted run
- Keeps short analytical history, usually 2-7 days
- Uses JSON outputs and external archive as the long-term fallback layer

## ideal

Use this only when the database has enough paid capacity beyond the 7.5 GB operating cap.

- Target size: 4 GB
- Hard cap: 8 GB
- Keeps active run plus 14 promoted runs
- Keeps broader analytical history, usually 30-365 days
- Better for trend analysis, model training, and long-term port intelligence

## Switching

In GitHub:

```text
Settings -> Secrets and variables -> Actions -> Variables
```

Set:

```text
DB_RETENTION_PROFILE = pro_7_5gb
```

or:

```text
DB_RETENTION_PROFILE = free_500mb
```

or:

```text
DB_RETENTION_PROFILE = ideal
```

Individual values such as `DB_RETENTION_VESSEL_SNAPSHOTS_DAYS` can still override the profile when needed. Leave them blank to use the selected profile defaults.
