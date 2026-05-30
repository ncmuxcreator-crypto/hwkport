export const sourceOfTruthTables = {
  vessel_master: "Persistent vessel identity.",
  port_call_master: "Unique port visit and commercial opportunity context.",
  vessel_snapshots: "Run-level collected and normalized state.",
  active_dataset_pointer: "Current live dashboard dataset pointer.",
  daily_snapshot_tables: "Long-term intelligence warehouse, retained separately from short-lived run snapshots."
};

export const persistenceStage = {
  name: "persistence",
  description: "Persist run state, active pointers, daily warehouse rows, and raw archive pointers.",
  owns: Object.keys(sourceOfTruthTables),
  retention: {
    active_run_snapshots: "short retention",
    daily_warehouse: "long-term retention",
    raw_payloads: "Google Drive archive, not Supabase long-term storage"
  }
};
