export async function activeDatasetRunId(supabase) {
  try {
    const { data, error } = await supabase
      .from("active_dataset_pointer")
      .select("active_run_id")
      .eq("id", "current")
      .limit(1);
    if (error) return null;
    return data?.[0]?.active_run_id || null;
  } catch {
    return null;
  }
}

export async function latestPromotedRunIds(supabase, limit = 1) {
  try {
    const { data, error } = await supabase
      .from("data_collection_runs")
      .select("run_id,started_at,promoted_at")
      .eq("status", "promoted")
      .order("started_at", { ascending: false })
      .limit(Math.max(1, Number(limit || 1)));
    if (error) return [];
    return (data || []).map(row => row.run_id).filter(Boolean);
  } catch {
    return [];
  }
}
