export const normalizationStage = {
  name: "normalization",
  description: "Normalize port calls, vessel identity keys, GT, time fields, type groups, and source confidence.",
  owns: ["port_call_identity", "hybrid_entity_key", "data_quality_score"]
};
