/**
 * Legacy compatibility shim.
 *
 * The production scoring engine now lives in scripts/update.js and the
 * Worker-side commercial visibility logic. This file is intentionally kept as
 * a thin wrapper so old maintenance scripts do not introduce a second,
 * conflicting scoring model.
 */
export function scoreRecord(record = {}) {
  const commercialValueScore = Number(
    record.commercial_value_score ??
    record.total_sales_priority_score ??
    record.predicted_cleaning_opportunity_score ??
    0
  );
  return {
    ...record,
    risk_score: Math.max(0, Math.min(100, commercialValueScore)),
    sales_reason: record.reason_codes || record.sales_reason || []
  };
}

export function scoreBatch(records = []) {
  return records
    .map(scoreRecord)
    .sort((a, b) => Number(b.risk_score || 0) - Number(a.risk_score || 0));
}
