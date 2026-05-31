import { createHash } from "node:crypto";

export const API_SCHEMA_VERSION = "commercial_intelligence_v1";

export const PIPELINE_STAGE_VALUES = [
  "NEW_HOT",
  "CONTACT_PLANNED",
  "CONTACTED",
  "QUOTE_SENT",
  "FOLLOW_UP",
  "WON",
  "LOST",
  "ARCHIVED"
];

export function normalizeVesselName(name = "") {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortHash(value) {
  return createHash("sha1").update(String(value || "")).digest("hex").slice(0, 16);
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boundedScore(value) {
  return Math.max(0, Math.min(100, Math.round(finiteNumber(value))));
}

function recordDate(record = {}) {
  return String(record.last_seen_at || record.collected_at || record.generated_at || record.eta || new Date().toISOString()).slice(0, 10);
}

export function vesselIdentityKey(record = {}) {
  const imo = String(record.imo || "").trim();
  if (imo) return `imo:${imo}`;
  const mmsi = String(record.mmsi || "").trim();
  if (mmsi) return `mmsi:${mmsi}`;
  const normalizedName = normalizeVesselName(record.vessel_name || record.ship_name || record.name);
  const port = String(record.port_name || record.port || record.current_port || "").trim().toUpperCase();
  return `name_port_date:${normalizedName || "UNKNOWN"}:${port || "UNKNOWN"}:${recordDate(record)}`;
}

export function vesselId(record = {}) {
  return record.vessel_id || record.master_vessel_id || record.hybrid_entity_key || shortHash(vesselIdentityKey(record));
}

export function sourceNames(record = {}) {
  const values = [
    ...(Array.isArray(record.source_names) ? record.source_names : []),
    ...(Array.isArray(record.sources) ? record.sources : []),
    record.source_name,
    record.source,
    record.data_source
  ].filter(Boolean).map(value => String(value));
  return [...new Set(values)];
}

export function buildConfidence(record = {}, context = {}) {
  const sources = sourceNames(record);
  const sourcesOk = finiteNumber(record.sources_ok, sources.length || (record.source_name || record.source ? 1 : 0));
  const sourcesFailed = finiteNumber(record.sources_failed ?? context.sources_failed, 0);
  const lastSeenAt = record.last_seen_at || record.collected_at || record.generated_at || context.generated_at || null;
  const freshnessMinutes = lastSeenAt ? Math.max(0, Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 60000)) : null;
  const freshnessScore = freshnessMinutes === null ? 0 : freshnessMinutes <= 60 ? 25 : freshnessMinutes <= 360 ? 18 : freshnessMinutes <= 1440 ? 10 : 0;
  const identityScore = (record.imo ? 25 : 0) + (record.mmsi ? 15 : 0);
  const sourceScore = Math.min(20, sourcesOk * 6) - Math.min(20, sourcesFailed * 8);
  const raw = finiteNumber(record.confidence_score ?? record.data_confidence_score ?? record.source_confidence_score, identityScore + sourceScore + freshnessScore + 25);
  const confidenceScore = boundedScore(raw - Math.min(25, sourcesFailed * 5));
  return {
    confidence_score: confidenceScore,
    confidence_label: confidenceScore >= 80 ? "HIGH" : confidenceScore >= 50 ? "MEDIUM" : "LOW",
    sources_ok: sourcesOk,
    sources_failed: sourcesFailed,
    last_seen_at: lastSeenAt,
    freshness_minutes: freshnessMinutes
  };
}

export function normalizeVesselMasterRecord(record = {}, context = {}) {
  const confidence = buildConfidence(record, context);
  const name = record.vessel_name || record.ship_name || record.name || record.canonical_name || "Unknown vessel";
  return {
    vessel_id: vesselId(record),
    imo: record.imo || null,
    mmsi: record.mmsi || null,
    vessel_name: name,
    normalized_vessel_name: record.normalized_vessel_name || record.normalized_name || normalizeVesselName(name),
    vessel_type: record.vessel_type || record.vessel_type_group || null,
    gt: finiteNumber(record.gt || record.gross_tonnage, null),
    dwt: finiteNumber(record.dwt || record.deadweight, null),
    current_port: record.current_port || record.port_name || record.port || null,
    current_status: record.current_status || record.status_bucket || record.status || null,
    eta: record.eta || record.predicted_arrival_time || null,
    last_seen_at: confidence.last_seen_at,
    first_seen_at: record.first_seen_at || record.first_seen || record.collected_at || confidence.last_seen_at,
    source_names: sourceNames(record),
    ...confidence
  };
}

export function buildScoreFactors(record = {}, opportunityScore = 0) {
  const factors = [
    { factor: "commercial_value", label: "Commercial value", value: finiteNumber(record.commercial_value_score || record.total_sales_priority_score), points: Math.round(finiteNumber(record.commercial_value_score || record.total_sales_priority_score) * 0.34) },
    { factor: "biofouling_risk", label: "Biofouling risk", value: finiteNumber(record.biofouling_exposure_score || record.biofouling_score || record.risk_score), points: Math.round(finiteNumber(record.biofouling_exposure_score || record.biofouling_score || record.risk_score) * 0.18) },
    { factor: "long_stay", label: "Long stay", value: `${Math.round(finiteNumber(record.stay_hours || record.current_call_stay_hours || record.cumulative_stay_hours || record.anchorage_hours))}h`, points: Math.round(Math.min(100, finiteNumber(record.stay_hours || record.current_call_stay_hours || record.cumulative_stay_hours || record.anchorage_hours) / 2) * 0.15) },
    { factor: "regulated_route", label: "Regulated route", value: record.destination || record.next_port || record.destination_port || "", points: record.regulated_route_signal ? 13 : 0 },
    { factor: "work_window", label: "Work window", value: finiteNumber(record.work_feasibility_score || record.cleaning_window_score || record.arrival_opportunity_score), points: Math.round(finiteNumber(record.work_feasibility_score || record.cleaning_window_score || record.arrival_opportunity_score) * 0.10) },
    { factor: "data_confidence", label: "Data confidence", value: finiteNumber(record.confidence_score || record.data_confidence_score || record.source_confidence_score), points: Math.round(finiteNumber(record.confidence_score || record.data_confidence_score || record.source_confidence_score) * 0.06) },
    { factor: "contact_readiness", label: "Contact readiness", value: finiteNumber(record.contact_readiness_score), points: Math.round(finiteNumber(record.contact_readiness_score) * 0.04) }
  ].filter(factor => factor.points > 0 || String(factor.value || "").length > 0);
  const target = boundedScore(opportunityScore);
  const current = factors.reduce((sum, factor) => sum + finiteNumber(factor.points), 0);
  if (factors.length && current !== target) factors[factors.length - 1].points += target - current;
  return factors;
}

export function normalizeOpportunityCandidate(record = {}, context = {}) {
  const opportunityScore = boundedScore(record.opportunity_score || record.sales_priority_score || record.total_sales_priority_score || record.commercial_value_score);
  const confidence = buildConfidence(record, context);
  const scoreFactors = Array.isArray(record.score_factors) && record.score_factors.length ? record.score_factors : buildScoreFactors({ ...record, confidence_score: confidence.confidence_score }, opportunityScore);
  return {
    ...record,
    ...normalizeVesselMasterRecord(record, context),
    port: record.port || record.port_name || record.current_port || null,
    opportunity_score: opportunityScore,
    priority_label: record.priority_label || record.sales_priority_band || (opportunityScore >= 80 ? "HOT" : opportunityScore >= 60 ? "WARM" : "LOW"),
    score_factors: scoreFactors,
    reason_summary: record.reason_summary || record.why_now || scoreFactors.slice(0, 3).map(factor => factor.label).join(" + ") || "Commercial opportunity detected.",
    recommended_action: record.recommended_action || record.recommended_next_action || record.candidate_next_action || "Confirm contact path and timing."
  };
}

export function buildSalesPipeline(topCandidates = {}, context = {}) {
  const opportunities = Array.isArray(topCandidates.opportunities) ? topCandidates.opportunities : [];
  const items = opportunities
    .filter(candidate => candidate.priority_label === "HOT")
    .map(candidate => ({
      vessel_id: vesselId(candidate),
      vessel_name: candidate.vessel_name || "Unknown vessel",
      imo: candidate.imo || null,
      port: candidate.port || candidate.port_name || null,
      opportunity_score: finiteNumber(candidate.opportunity_score),
      priority_label: candidate.priority_label || "LOW",
      pipeline_stage: candidate.pipeline_stage && PIPELINE_STAGE_VALUES.includes(candidate.pipeline_stage) ? candidate.pipeline_stage : "NEW_HOT",
      recommended_next_action: candidate.recommended_next_action || candidate.recommended_action || "Confirm contact path and timing.",
      contact_status: candidate.contact_status || "not_contacted",
      last_contacted_at: candidate.last_contacted_at || null,
      notes: candidate.notes || candidate.reason_summary || ""
    }));
  return withApiContract({ items, data: items }, { ...context, record_count: items.length, source_status: "derived_from_top_candidates" });
}

export function buildVesselVisits(records = [], context = {}) {
  const grouped = new Map();
  for (const record of records) {
    const vessel = normalizeVesselMasterRecord(record, context);
    const port = record.port || record.port_name || record.current_port || "Unknown port";
    const key = `${vessel.vessel_id}|${port}`;
    const existing = grouped.get(key) || {
      vessel_id: vessel.vessel_id,
      imo: vessel.imo,
      vessel_name: vessel.vessel_name,
      port,
      first_seen_at: vessel.first_seen_at || vessel.last_seen_at,
      last_seen_at: vessel.last_seen_at || vessel.first_seen_at,
      stay_hours: 0,
      source_names: [],
      opportunity_score_at_visit: 0,
      confidence_score: 0
    };
    existing.first_seen_at = [existing.first_seen_at, vessel.first_seen_at, vessel.last_seen_at].filter(Boolean).sort()[0] || null;
    existing.last_seen_at = [existing.last_seen_at, vessel.last_seen_at, vessel.first_seen_at].filter(Boolean).sort().at(-1) || null;
    existing.stay_hours = Math.max(finiteNumber(existing.stay_hours), finiteNumber(record.stay_hours || record.current_call_stay_hours || record.cumulative_stay_hours || record.anchorage_hours));
    existing.source_names = [...new Set([...existing.source_names, ...vessel.source_names])];
    existing.opportunity_score_at_visit = Math.max(existing.opportunity_score_at_visit, finiteNumber(record.opportunity_score || record.sales_priority_score || record.commercial_value_score || record.total_sales_priority_score));
    existing.confidence_score = Math.max(existing.confidence_score, finiteNumber(vessel.confidence_score));
    grouped.set(key, existing);
  }
  const visits = [...grouped.values()].map(visit => ({ ...visit, stay_hours: finiteNumber(visit.stay_hours) }));
  return withApiContract({ visits, data: visits }, { ...context, record_count: visits.length, source_status: "derived_from_vessel_snapshots" });
}

export function normalizeAlertsPayload(payload = {}, context = {}) {
  const date = String(context.generated_at || payload.generated_at || new Date().toISOString()).slice(0, 10);
  const sourceAlerts = Array.isArray(payload.alerts) ? payload.alerts : Array.isArray(payload) ? payload : [];
  const byDedupe = new Map();
  for (const alert of sourceAlerts) {
    const alertType = alert.alert_type || alert.type || "INFO";
    const vesselIdValue = alert.vessel_id || vesselId(alert);
    const port = alert.port || alert.port_name || "platform";
    const dedupeKey = alert.dedupe_key || `${alertType}|${vesselIdValue || "platform"}|${port}|${date}`;
    const severityRaw = String(alert.severity || "INFO").toUpperCase();
    const severity = severityRaw === "HIGH" ? "WARNING" : severityRaw === "MEDIUM" ? "INFO" : ["INFO", "WARNING", "CRITICAL"].includes(severityRaw) ? severityRaw : "INFO";
    byDedupe.set(dedupeKey, {
      alert_id: alert.alert_id || `alert_${shortHash(dedupeKey)}`,
      alert_type: alertType,
      severity,
      title: alert.title || alertType,
      message: alert.message || "",
      vessel_id: vesselIdValue || null,
      port,
      created_at: alert.created_at || context.generated_at || payload.generated_at || new Date().toISOString(),
      dedupe_key: dedupeKey,
      recommended_action: alert.recommended_action || alert.next_action || "Review alert.",
      alert_key: alert.alert_key || dedupeKey,
      type: alertType,
      next_action: alert.next_action || alert.recommended_action || "Review alert."
    });
  }
  const alerts = [...byDedupe.values()];
  return withApiContract({ ...payload, alerts, alert_count: alerts.length }, { ...context, record_count: alerts.length, source_status: "alert_payload_ready" });
}

export function withApiContract(payload = {}, context = {}) {
  const isArray = Array.isArray(payload);
  const body = isArray ? { data: payload } : { ...payload };
  const count = finiteNumber(context.record_count ?? body.record_count ?? body.alert_count ?? body.items?.length ?? body.data?.length ?? body.opportunities?.length ?? body.visits?.length, 0);
  return {
    generated_at: body.generated_at || context.generated_at || new Date().toISOString(),
    data_mode: body.data_mode || context.data_mode || "unknown",
    schema_version: body.schema_version || context.schema_version || API_SCHEMA_VERSION,
    source_status: body.source_status || context.source_status || "unknown",
    fallback_used: Boolean(body.fallback_used ?? context.fallback_used ?? false),
    record_count: count,
    ...body
  };
}
