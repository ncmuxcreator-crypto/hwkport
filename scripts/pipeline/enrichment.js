export const enrichmentStage = {
  name: "enrichment",
  description: "Attach reference dictionaries, vessel master cache, pilot, PNC, Ulsan, berth, operator, and contact intelligence.",
  owns: ["enrichment_match_candidates", "imo_recovery_queue", "operator_master", "agent_master"]
};
