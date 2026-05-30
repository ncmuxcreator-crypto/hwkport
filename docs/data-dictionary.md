# Canonical Field Dictionary

This dictionary defines canonical field names used by the platform. Deprecated aliases can still be read for compatibility, but new writes should use canonical fields.

## Source of Truth Tables

| Domain | Canonical table | Ownership |
| --- | --- | --- |
| Vessel identity | `vessel_master` | Stable identity, IMO/MMSI/call sign/name aliases |
| Port visit | `port_call_master` | One unique commercial opportunity per port call |
| Run state | `vessel_snapshots` | Run-level normalized vessel/port-call state |
| Live serving | `active_dataset_pointer` | Current dashboard dataset pointer |
| History | `vessel_snapshot_daily`, `port_snapshot_daily`, `operator_snapshot_daily`, `route_snapshot_daily`, `commercial_opportunity_daily` | Long-term intelligence |

## Canonical Fields

| Canonical field | Meaning | Deprecated aliases |
| --- | --- | --- |
| `run_id` | Collection/reprocess run identifier | `dataset_version` when used as run id |
| `master_vessel_id` | Stable vessel identity key | `vessel_id` for identity only |
| `port_call_id` | Stable unique port visit key | `port_call_identity`, `port_call_key` |
| `port_code` | Official/internal port code | `port`, `prtAgCd` for display or source only |
| `port_name` | Display port name | `port_name_ko`, `port_name_en` |
| `sub_port` | Terminal/sub-port grouping | `terminal`, `berth_group` |
| `berth_name` | Berth/facility name | `berth`, `laidupFcltyNm` |
| `terminal_name` | Terminal name | `terminal` |
| `commercial_value_score` | Canonical commercial ranking score | `risk_score`, `total_sales_priority_score`, `cleaning_candidate_score` |
| `candidate_band` | Canonical candidate band | `sales_priority_band`, `risk_level` |
| `data_confidence_score` | Data confidence score | `confidence_score` |
| `operator_name` | Commercial operator | `operator` |
| `agent_name` | Port agent/reporting company | `satmntEntrpsNm`, `entrpsCdNm`, `agent` |

## Lineage Fields

Important commercial fields must carry source metadata:

| Field | Lineage field | Examples |
| --- | --- | --- |
| `gt` | `gt_source` | `port_operation_grtg`, `port_operation_intrlGrtg`, `vessel_spec_api` |
| `eta` | `eta_source` | `port_operation`, `pilot_schedule`, `berth_schedule` |
| `operator_name` | `operator_source` | `vessel_master`, `operator_dictionary`, `agent_dictionary`, `vessel_name_prefix` |
| `congestion_score` | `congestion_source` | `port_call_duration`, `anchorage_detection`, `port_summary`, `scoring_engine` |
| `commercial_value_score` | `score_source` | `commercial_scoring_engine`, `reprocess_scoring_engine` |

## Access Classes

| Access class | Examples | Serving policy |
| --- | --- | --- |
| External fields | Vessel name, port, status, public scores | Can be served to dashboard |
| Internal fields | diagnostics, rule hits, confidence internals | Internal dashboard/API only |
| Contact intelligence | company-level operator/agent/contact path | No personal contact harvesting |
| Raw source payloads | raw API bodies, HTML, AIS payloads | Archive to Google Drive, do not expose publicly |

## Error Severity Policy

| Severity | Examples | Pipeline behavior |
| --- | --- | --- |
| `fatal` | Port Operation failure, missing required Supabase config in production, DB promotion write failure | Do not promote dataset |
| `degraded` | Pilot/PNC/Ulsan/AIS enrichment failure | Continue with Port Operation data and diagnostics |
| `warning` | target ratio too high, stale summary fallback, low match rate | Serve last good/current data with warning |
| `allowed_missing` | operator missing, IMO unresolved, optional contact unavailable | Keep vessel visible, lower confidence/actionability |

## Freshness Windows

| Source | Freshness window |
| --- | --- |
| Port Operation | 24h |
| Pilot schedule | 6h |
| Berth/PNC/Ulsan | 12h |
| AIS/VTS | 1h |
| Operator/Agent DB | 30d |

## Cost and Rate Limit Guardrails

Default hard limits:

- `MAX_PORTS_PER_RUN=50`
- `PORT_OPERATION_MAX_PAGES=20`
- `PORT_OPERATION_NUM_OF_ROWS=50`
- `MAX_SOURCE_ROWS=5000`
- `MAX_OUTPUT_ROWS=10000`
- `MAX_CHILD_ENRICHMENT_ROWS=100`
- `MAX_IMO_RECOVERY_CALLS=100`
- `MAX_API_RESPONSE_BYTES=25000000`

If a limit is reached, write diagnostics and keep serving the last successful dataset when the new run is incomplete.
