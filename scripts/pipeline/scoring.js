export const COMMERCIAL_SCORING_ENGINE = "commercial_value_v2";

export const candidateRules = {
  watchlist: "commercial_value_score 50-64",
  sales_target: "commercial_value_score >= 65 plus global/port percentile qualification",
  immediate_target: "commercial_value_score >= 75 plus current or near-term work feasibility"
};

export const scoringStage = {
  name: "scoring",
  description: "Single production commercial scoring and candidate classification engine.",
  engine: COMMERCIAL_SCORING_ENGINE,
  owns: ["commercial_value_score", "candidate_band", "reason_codes", "score_components"],
  candidateRules
};
