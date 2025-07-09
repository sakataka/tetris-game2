// Re-export types for backward compatibility

// Re-export weights and constants
export { DEFAULT_WEIGHTS } from "./calculator/weights";

// Re-export main evaluator class
export { DellacherieEvaluator } from "./core/evaluator";
export {
  calculateBumpiness,
  calculateEscapeRoute,
  calculateMaxHeight,
  calculateRowFillRatio,
} from "./features/board-analysis";
export { calculateBlocksAboveHoles, calculateHoles } from "./features/holes";

// Re-export all feature calculators for external use if needed
export { calculateLandingHeight } from "./features/landing-height";
export { calculateColumnTransitions, calculateRowTransitions } from "./features/transitions";
export { calculateWellOpen, calculateWells } from "./features/wells";
export type { EvaluationFeatures, EvaluationWeights, Move } from "./types";
// Re-export utility functions
export { createMove, findDropPosition } from "./utils";
