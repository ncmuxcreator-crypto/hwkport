function stableNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function withStableDashboardSummaryFields(summary = {}) {
  const allVesselsCount = stableNumber(
    summary.all_vessels_count ?? summary.total_vessels ?? summary.record_count
  );
  const recordCount = stableNumber(summary.record_count);
  const salesTargetCount = stableNumber(summary.sales_target_count);
  const immediateTargetCount = stableNumber(summary.immediate_target_count);
  const portCount = stableNumber(summary.port_count);

  return {
    ...summary,
    record_count: recordCount,
    all_vessels_count: allVesselsCount,
    total_vessels: stableNumber(summary.total_vessels, allVesselsCount),
    sales_target_count: salesTargetCount,
    immediate_target_count: immediateTargetCount,
    port_count: portCount,
    data_mode: summary.data_mode || summary.data_source_used || "static_json_snapshot",
    generated_at: summary.generated_at || new Date().toISOString()
  };
}
