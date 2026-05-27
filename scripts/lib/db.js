import { createClient } from "@supabase/supabase-js";
import ws from "ws";

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    realtime: {
      transport: ws
    }
  });
}

export async function saveToSupabase(records) {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const rows = records.map(r => ({
    snapshot_date: now.slice(0, 10),
    vessel_id: r.vessel_id,
    vessel_name: r.vessel_name,
    port: r.port,
    berth: r.berth || null,
    eta: r.eta || null,
    etd: r.etd || null,
    status: r.status,
    operator: r.operator || null,
    risk_score: r.risk_score || 0,
    sales_reason: r.sales_reason || r.reason_codes || [],
    hybrid_entity_key: r.hybrid_entity_key || r.vessel_id,
    payload: r,
    updated_at: r.updated_at || now,
    collected_at: now,
    source: r.source || r.source_mode || "korea-port-hull-intelligence"
  }));

  if (!rows.length) {
    return { recordsSaved: 0, table: "vessel_snapshots", mode: "empty" };
  }

  let recordsSaved = 0;
  const batchSize = Number(process.env.SUPABASE_BATCH_SIZE || 100);
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await supabase
      .from("vessel_snapshots")
      .insert(batch);
    if (error) throw error;
    recordsSaved += batch.length;
  }

  const entities = records.map(r => ({
    hybrid_entity_key: r.hybrid_entity_key || r.vessel_id,
    vessel_id: r.vessel_id,
    vessel_name: r.vessel_name,
    imo: r.imo || null,
    mmsi: r.mmsi || null,
    call_sign: r.call_sign || null,
    vessel_type: r.vessel_type || null,
    gt: r.gt || null,
    operator: r.operator || null,
    last_seen_at: now,
    payload: r
  })).filter(r => r.hybrid_entity_key);

  for (let index = 0; index < entities.length; index += batchSize) {
    const batch = entities.slice(index, index + batchSize);
    const { error } = await supabase
      .from("vessel_entities")
      .upsert(batch, { onConflict: "hybrid_entity_key" });
    if (error) throw error;
  }

  const masterRows = records.map(r => ({
    master_vessel_id: r.hybrid_entity_key || r.vessel_id,
    imo: r.imo || null,
    mmsi: r.mmsi || null,
    call_sign: r.call_sign || null,
    canonical_name: r.vessel_name,
    normalized_name: String(r.vessel_name || "").trim().toUpperCase(),
    vessel_type: r.vessel_type || null,
    gt: r.gt || null,
    dwt: r.dwt || null,
    loa: r.loa || null,
    beam: r.beam || null,
    operator: r.operator || null,
    flag: r.flag || null,
    identity_confidence: r.identification_method === "IMO" ? 95 : r.identification_method === "MMSI" ? 85 : r.identification_method === "HYBRID_CALLSIGN_NAME_GT" ? 70 : 40,
    last_seen: now,
    payload: r
  })).filter(r => r.master_vessel_id);

  for (let index = 0; index < masterRows.length; index += batchSize) {
    const batch = masterRows.slice(index, index + batchSize);
    const { error } = await supabase.from("vessel_master").upsert(batch, { onConflict: "master_vessel_id" });
    if (error) throw error;
  }

  const aliases = records
    .filter(r => r.vessel_name && (r.hybrid_entity_key || r.vessel_id))
    .map(r => ({
      alias_name: r.vessel_name,
      master_vessel_id: r.hybrid_entity_key || r.vessel_id,
      source: r.source || "collector",
      confidence: r.identification_method === "IMO" ? 95 : r.identification_method === "MMSI" ? 85 : 60
    }));

  for (let index = 0; index < aliases.length; index += batchSize) {
    const batch = aliases.slice(index, index + batchSize);
    const { error } = await supabase.from("vessel_aliases").upsert(batch, { onConflict: "alias_name,master_vessel_id,source" });
    if (error) throw error;
  }

  const identityCandidates = records
    .filter(r => !r.imo)
    .map(r => ({
      hybrid_entity_key: r.hybrid_entity_key || r.vessel_id,
      vessel_id: r.vessel_id,
      vessel_name: r.vessel_name,
      likely_imo_candidates: [],
      confidence_band: Number(r.gt || 0) >= 5000 || (r.total_sales_priority_score || 0) >= 60 ? "manual_review_priority" : "unresolved",
      manual_review_required: Number(r.gt || 0) >= 5000 || (r.total_sales_priority_score || 0) >= 60,
      payload: r
    }));

  for (let index = 0; index < identityCandidates.length; index += batchSize) {
    const batch = identityCandidates.slice(index, index + batchSize);
    const { error } = await supabase.from("vessel_identity_candidates").insert(batch);
    if (error) throw error;
  }

  const riskRows = records.map(r => ({
    hybrid_entity_key: r.hybrid_entity_key || r.vessel_id,
    vessel_id: r.vessel_id,
    port: r.port || null,
    total_sales_priority_score: r.total_sales_priority_score || r.cleaning_candidate_score || r.risk_score || 0,
    biofouling_risk_score: r.biofouling_score || r.risk_score || 0,
    collected_at: now,
    payload: r
  })).filter(r => r.hybrid_entity_key);

  for (let index = 0; index < riskRows.length; index += batchSize) {
    const batch = riskRows.slice(index, index + batchSize);
    const { error } = await supabase.from("risk_history").insert(batch);
    if (error) throw error;
  }

  const events = records
    .filter(r => r.is_cleaning_candidate || r.is_immediate_candidate || (r.total_sales_priority_score || 0) >= 60)
    .map(r => ({
      hybrid_entity_key: r.hybrid_entity_key || r.vessel_id,
      vessel_id: r.vessel_id,
      event_type: r.is_immediate_candidate ? "immediate_target_snapshot" : "candidate_snapshot",
      port: r.port || null,
      event_at: now,
      payload: r
    }))
    .filter(r => r.hybrid_entity_key);

  for (let index = 0; index < events.length; index += batchSize) {
    const batch = events.slice(index, index + batchSize);
    const { error } = await supabase.from("vessel_events").insert(batch);
    if (error) throw error;
  }

  const byPort = new Map();
  for (const r of records) {
    const key = r.port_code || r.port || "unknown";
    const current = byPort.get(key) || { port_code: r.port_code || null, port_name: r.port_name || r.port || null, total_vessels: 0, anchorage_vessels: 0, long_idle_vessels: 0, waiting_hours_total: 0, berth_hours_total: 0, score_total: 0 };
    current.total_vessels += 1;
    if (r.is_anchorage_waiting || (r.anchorage_hours || 0) > 0) current.anchorage_vessels += 1;
    if (r.is_long_idle) current.long_idle_vessels += 1;
    current.waiting_hours_total += Number(r.anchorage_hours || 0);
    current.berth_hours_total += Number(r.berth_hours || 0);
    current.score_total += Number(r.port_congestion_score || 0);
    byPort.set(key, current);
  }

  const congestionRows = [...byPort.values()].map(p => ({
    port_code: p.port_code,
    port_name: p.port_name,
    total_vessels: p.total_vessels,
    anchorage_vessels: p.anchorage_vessels,
    long_idle_vessels: p.long_idle_vessels,
    average_waiting_time: p.anchorage_vessels ? Math.round((p.waiting_hours_total / p.anchorage_vessels) * 10) / 10 : 0,
    berth_occupancy: p.total_vessels ? Math.min(100, Math.round((p.berth_hours_total / Math.max(1, p.total_vessels * 24)) * 100)) : 0,
    anchorage_density: p.total_vessels ? Math.min(100, Math.round((p.anchorage_vessels / p.total_vessels) * 100)) : 0,
    congestion_score: p.total_vessels ? Math.min(100, Math.round(p.score_total / p.total_vessels)) : 0,
    collected_at: now,
    payload: p
  }));

  for (let index = 0; index < congestionRows.length; index += batchSize) {
    const batch = congestionRows.slice(index, index + batchSize);
    const { error } = await supabase.from("port_congestion_snapshots").insert(batch);
    if (error) throw error;
  }

  return { recordsSaved, table: "vessel_snapshots", mode: "append_only", batchSize, entitiesSaved: entities.length, masterRowsSaved: masterRows.length, identityCandidatesSaved: identityCandidates.length, riskRowsSaved: riskRows.length, eventsSaved: events.length, congestionRowsSaved: congestionRows.length };
}
