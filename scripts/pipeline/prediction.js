export const predictionStage = {
  name: "prediction",
  description: "Generate arrival, anchorage, work-window, cleaning-opportunity, and fleet forecasts after scoring.",
  owns: ["predicted_arrivals", "route_patterns", "vessel_route_history", "prediction_error_hours"]
};
