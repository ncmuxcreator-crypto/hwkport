function knownPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function uniquePortCount(rows = []) {
  const ports = new Set();
  for (const row of rows) {
    const port = row?.port_name || row?.port || row?.current_port || row?.port_code;
    if (port) ports.add(String(port));
  }
  return ports.size;
}

export function resolvePortCount({ summary = {}, state = {} } = {}) {
  return knownPositiveNumber(summary.port_count) ??
    knownPositiveNumber(state.ports?.length) ??
    knownPositiveNumber(uniquePortCount(state.rows || [])) ??
    summary.port_count ??
    0;
}

export function buildKpiRows({ state, score, riskScore = score, statusText, salesRows }) {
  const summary = state.summary || {};
  const status = state.status || {};
  const rows = state.rows || [];
  const candidates = salesRows(rows);
  const hasRows = rows.length > 0;

  const totalVessels = hasRows
    ? rows.length
    : summary.all_vessels_count ?? summary.total_vessels ?? status.all_vessels_count ?? status.record_count ?? 0;

  const salesTargetCount = hasRows
    ? candidates.length
    : summary.sales_target_count ?? status.sales_candidate_count ?? 0;

  const immediateTargetCount = hasRows
    ? candidates.filter(vessel => score(vessel) >= 75).length
    : summary.immediate_target_count ?? status.immediate_target_count ?? 0;

  const highRiskCount = hasRows
    ? rows.filter(vessel => riskScore(vessel) >= 65).length
    : summary.high_risk_vessel_count ?? status.high_risk_vessel_count ?? 0;

  const arrivalCount = hasRows
    ? rows.filter(vessel => statusText(vessel) === "입항예정" || vessel.eta || vessel.predicted_arrival_time).length
    : status.arrival_pipeline_count ?? summary.arrival_pipeline_count ?? 0;

  const waitingCount = hasRows
    ? rows.filter(vessel => ["묘박/대기", "대기"].includes(statusText(vessel))).length
    : summary.anchorage_waiting_count ?? status.anchorage_waiting_count ?? 0;

  return [
    ["영업대상", salesTargetCount, "후보 목록과 동일"],
    ["즉시영업후보", immediateTargetCount, "HOT 우선"],
    ["고위험선박", highRiskCount, "오염·체류 리스크"],
    ["입항예정", arrivalCount, "ETA 보유"],
    ["묘박/대기", waitingCount, "대기 상태"],
    ["총 선박 수", totalVessels, `${resolvePortCount({ summary, state })}개 항만`]
  ];
}
