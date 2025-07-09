/**
 * Unified API for AI evaluators
 * This module provides a clean interface for importing all evaluator functionality
 */

// Advanced features and terrain analysis
export {
  AdvancedFeatures,
  type PerfectClearOpportunity,
  type TerrainEvaluation,
  type TSpinOpportunity,
} from "./advanced-features";
// Core evaluators
export * from "./dellacherie";
// Phase-based weight system
export {
  applyDangerAdjustments,
  determineGamePhase,
  type GamePhase,
  getPhaseWeights,
  PHASE_WEIGHTS,
  type PhaseWeights,
} from "./new-weights";
export {
  DEFAULT_PATTERN_CONFIG,
  PatternEvaluator,
  type PatternEvaluatorConfig,
} from "./pattern-evaluator";

// Pattern detection and matching
export {
  calculatePatternBonus,
  DEFAULT_PATTERN_WEIGHTS,
  evaluateWithPatterns,
  type FeasibilityResult,
  MidGamePatternDetector,
  PATTERN_TEMPLATES,
  type PatternMatch,
  PatternMatcher,
  type PatternTemplate,
  type PatternWeights,
} from "./patterns";
export {
  StackingEvaluator,
  type StackingFeatures,
  type StackingMoveEvaluation,
  type StackingWeights,
} from "./stacking-evaluator";
// Dynamic weight system
export { DynamicWeights, type GameSituation } from "./weights";

// Note: GamePhase is exported from both patterns.ts and new-weights.ts
// We export from new-weights.ts as the primary source
