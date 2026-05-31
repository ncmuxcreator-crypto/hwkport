import { fmt } from "./utils.js";

export function buildHealthRows({
  summary = {},
  status = {},
  health = {},
  count = 0,
  dataSourceLabel = "확인 불가",
  sample = false,
  fallback = false,
  noLive = false,
  lastUpdated = ""
} = {}) {
  const errorReason =
    status.error_reason ||
    status.fallback_reason ||
    summary.fallback_reason ||
    health.error_reason ||
    health.failure_reason ||
    "없음";

  return [
    ["데이터 소스", dataSourceLabel],
    ["데이터 상태", sample ? "샘플 데이터" : fallback || noLive ? "주의" : "정상"],
    ["마지막 성공 갱신", lastUpdated || "확인 불가"],
    ["현재 실행 상태", health.status || status.status || summary.status?.current_run_status || "확인 중"],
    ["선박 데이터 수", fmt(count)],
    ["Supabase 저장 상태", status.supabase_write?.status || health.supabase_write_status || "확인 필요"],
    ["데이터 묶음 승격 상태", status.promotion_status || health.promotion_status || "확인 필요"],
    ["대체 데이터 사용 여부", fallback || sample ? "예" : "아니오"],
    ["오류 원인", fallback || noLive || sample ? errorReason : "없음"]
  ];
}
