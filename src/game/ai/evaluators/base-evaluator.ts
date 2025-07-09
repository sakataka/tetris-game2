import type { BitBoard } from "@/game/ai/core/bitboard";
import type { Move } from "@/game/ai/core/move-generator";

/**
 * Feature set that can be extracted from a board state
 * This is a generic type that can be extended by specific evaluators
 */
export type FeatureSet = Record<string, number | boolean>;

/**
 * Board state representation for evaluation
 * Includes the BitBoard and any additional context needed
 */
export interface BoardState {
  /** The current board state */
  board: BitBoard;
  /** Current lines cleared in the game */
  lines?: number;
  /** Current level */
  level?: number;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * Base interface for all Tetris AI evaluators
 *
 * This interface defines the contract that all evaluators must implement,
 * ensuring consistency and making it easy to add new evaluation strategies.
 *
 * @example
 * ```typescript
 * class MyEvaluator implements BaseEvaluator {
 *   evaluate(state: BoardState): number {
 *     const features = this.calculateFeatures(state.board);
 *     return this.applyWeights(features);
 *   }
 *
 *   calculateFeatures(board: BitBoard): FeatureSet {
 *     return {
 *       holes: this.countHoles(board),
 *       height: this.getMaxHeight(board),
 *       // ... other features
 *     };
 *   }
 *
 *   applyWeights(features: FeatureSet): number {
 *     return features.holes * -10 + features.height * -2;
 *   }
 *
 *   getName(): string {
 *     return "MyEvaluator";
 *   }
 * }
 * ```
 */
export interface BaseEvaluator {
  /**
   * Evaluate a board state and return a score
   * Higher scores indicate better positions
   *
   * @param state - The current board state to evaluate
   * @returns Evaluation score
   */
  evaluate(state: BoardState): number;

  /**
   * Calculate features from the board
   * Features are the raw values extracted from the board state
   *
   * @param board - The board to analyze
   * @returns Set of features extracted from the board
   */
  calculateFeatures(board: BitBoard): FeatureSet;

  /**
   * Apply weights to features to compute a final score
   * This separates feature extraction from scoring logic
   *
   * @param features - The features to score
   * @returns Weighted evaluation score
   */
  applyWeights(features: FeatureSet): number;

  /**
   * Get the name of this evaluator
   * Used for debugging and configuration
   *
   * @returns Human-readable name of the evaluator
   */
  getName(): string;
}

/**
 * Interface for evaluators that support dynamic weight adjustment
 */
export interface WeightedEvaluator extends BaseEvaluator {
  /**
   * Get current evaluation weights
   * @returns Current weight configuration
   */
  getWeights(): Record<string, number>;

  /**
   * Update evaluation weights
   * @param weights - New weight values (partial update supported)
   */
  updateWeights(weights: Partial<Record<string, number>>): void;

  /**
   * Reset weights to default values
   */
  resetWeights(): void;
}

/**
 * Interface for evaluators that can evaluate specific moves
 * This is used by evaluators that need move context for evaluation
 */
export interface MoveEvaluator {
  /**
   * Evaluate a specific move on a board
   * @param board - Current board state
   * @param move - Move to evaluate
   * @returns Evaluation score for the move
   */
  evaluateMove(board: BitBoard, move: Move): number;
}

/**
 * Helper type to check if an evaluator implements MoveEvaluator
 */
export function isMoveEvaluator(evaluator: unknown): evaluator is MoveEvaluator {
  return (
    typeof evaluator === "object" &&
    evaluator !== null &&
    "evaluateMove" in evaluator &&
    typeof (evaluator as MoveEvaluator).evaluateMove === "function"
  );
}

/**
 * Helper type to check if an evaluator implements WeightedEvaluator
 */
export function isWeightedEvaluator(evaluator: BaseEvaluator): evaluator is WeightedEvaluator {
  return "getWeights" in evaluator && "updateWeights" in evaluator && "resetWeights" in evaluator;
}
