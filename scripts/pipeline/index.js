import { collectionStage } from "./collection.js";
import { normalizationStage } from "./normalization.js";
import { enrichmentStage } from "./enrichment.js";
import { scoringStage } from "./scoring.js";
import { predictionStage } from "./prediction.js";
import { persistenceStage, sourceOfTruthTables } from "./persistence.js";
import { reportingStage } from "./reporting.js";

export const PIPELINE_STAGES = [
  collectionStage,
  normalizationStage,
  enrichmentStage,
  scoringStage,
  predictionStage,
  persistenceStage,
  reportingStage
];

export { sourceOfTruthTables };
