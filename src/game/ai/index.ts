// Core AI Engine exports

// Re-export commonly used types for convenience
export type {
  GameState,
  Position,
  // GameState and related types are from "@/types/game"
  Tetromino,
  TetrominoTypeName,
} from "@/types/game";
export {
  type AdvancedAIConfig,
  type AdvancedAIDecision,
  AdvancedAIEngine,
  type AdvancedAIStats,
  DEFAULT_ADVANCED_CONFIG,
} from "./core/advanced-ai-engine";
export {
  type AIConfig,
  type AIDecision,
  AIEngine,
  type AIStats,
  DEFAULT_AI_CONFIG,
} from "./core/ai-engine";
export { type BitBoardData, createBitBoard } from "./core/bitboard";
export {
  DEFAULT_MOVE_OPTIONS,
  type GameAction,
  type GameActionType,
  type Move,
  type MoveGenerationOptions,
  MoveGenerator,
} from "./core/move-generator";
export {
  AdvancedFeatures,
  type PerfectClearOpportunity,
  type TerrainEvaluation,
  type TSpinOpportunity,
} from "./evaluators/advanced-features";

// Evaluators exports
export { DellacherieEvaluator } from "./evaluators/dellacherie";
export { DynamicWeights } from "./evaluators/weights";
// Search algorithms exports
export {
  BeamSearch,
  type BeamSearchConfig,
  DEFAULT_BEAM_CONFIG,
  type SearchNode,
  type SearchResult,
} from "./search/beam-search";
export {
  DEFAULT_HOLD_OPTIONS,
  HoldAwareSearch,
  type HoldSearchOptions,
  type HoldSearchResult,
  type HoldStrategyEvaluation,
} from "./search/hold-search";
