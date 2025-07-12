import type { BitBoardData } from "@/game/ai/core/bitboard";
import { calculatePotentialLinesFilled, clearLines, clone, place } from "@/game/ai/core/bitboard";
import { getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import type {
  BaseEvaluator,
  BoardState,
  FeatureSet,
  MoveEvaluator,
  WeightedEvaluator,
} from "../../base-evaluator";
import { calculateScore } from "../calculator/scorer";
import {
  createWeightManager,
  DEFAULT_WEIGHTS,
  getWeights,
  resetWeights,
  updateWeights,
  type WeightManagerState,
} from "../calculator/weights";
import {
  calculateBumpiness,
  calculateEscapeRoute,
  calculateMaxHeight,
  calculateRowFillRatio,
} from "../features/board-analysis";
import { calculateBlocksAboveHoles, calculateHoles } from "../features/holes";
import { calculateLandingHeight } from "../features/landing-height";
import { calculateColumnTransitions, calculateRowTransitions } from "../features/transitions";
import { calculateWellOpen, calculateWells } from "../features/wells";
import type { EvaluationFeatures, EvaluationWeights, Move } from "../types";

/**
 * High-performance Dellacherie heuristic evaluator
 * Implements the 6-feature evaluation system with optimized algorithms
 */
export class DellacherieEvaluator implements BaseEvaluator, WeightedEvaluator, MoveEvaluator {
  private weightManagerState: WeightManagerState;

  constructor(weights: EvaluationWeights = DEFAULT_WEIGHTS) {
    this.weightManagerState = createWeightManager(weights);
  }

  /**
   * Evaluate a move and return its heuristic score
   * Higher scores indicate better moves
   *
   * @param board - Current board state
   * @param move - Move to evaluate
   * @returns Heuristic score for the move
   */
  evaluateMove(board: BitBoardData, move: Move): number {
    const features = this.extractFeatures(board, move);
    return calculateScore(features, getWeights(this.weightManagerState));
  }

  /**
   * Extract all 6 evaluation features for a given move
   * Uses board simulation to accurately compute post-placement features
   * Enhanced with exponential line clearing rewards
   *
   * @param board - Current board state
   * @param move - Move to analyze
   * @returns Complete feature set for evaluation
   */
  extractFeatures(board: BitBoardData, move: Move): EvaluationFeatures {
    // Create a simulation board to test the move
    const tempBoard = clone(board);

    // Get piece bit patterns if not cached
    if (!move.pieceBitRows) {
      move.pieceBitRows = getPieceBitsAtPosition(move.piece, move.rotation, move.x);
    }

    // Simulate piece placement
    const placedBoard = place(tempBoard, move.pieceBitRows, move.y);

    // Clear lines and get count
    const clearResult = clearLines(placedBoard);
    const clearedLines = clearResult.clearedLines;

    // DEBUG: Log line clearing activity
    if (clearedLines.length > 0) {
      console.log(
        `🎯 [Dellacherie] Line Clear! Piece: ${move.piece}, Position: (${move.x}, ${move.y}), Lines: ${clearedLines.length}`,
      );
    }

    // Calculate potential lines filled by this move (using original board)
    const potentialLinesFilled = calculatePotentialLinesFilled(board, move.pieceBitRows, move.y);

    // Create pre-clear board for feature extraction (board + piece, before line clearing)
    const preClearBoard = clone(board);
    const preClearBoardWithPiece = place(preClearBoard, move.pieceBitRows, move.y);

    return {
      landingHeight: calculateLandingHeight(board, move),
      linesCleared: clearedLines.length,
      potentialLinesFilled,
      rowTransitions: calculateRowTransitions(preClearBoardWithPiece),
      columnTransitions: calculateColumnTransitions(preClearBoardWithPiece),
      holes: calculateHoles(preClearBoardWithPiece),
      wells: calculateWells(preClearBoardWithPiece),
      blocksAboveHoles: calculateBlocksAboveHoles(preClearBoardWithPiece),
      wellOpen: calculateWellOpen(preClearBoardWithPiece),
      escapeRoute: calculateEscapeRoute(preClearBoardWithPiece),
      bumpiness: calculateBumpiness(preClearBoardWithPiece),
      maxHeight: calculateMaxHeight(preClearBoardWithPiece),
      rowFillRatio: calculateRowFillRatio(preClearBoardWithPiece),
    };
  }

  /**
   * Update evaluation weights dynamically
   * Allows for adaptive AI behavior based on game state
   *
   * @param newWeights - Updated weight configuration
   */
  updateWeights(newWeights: Partial<EvaluationWeights>): void {
    this.weightManagerState = updateWeights(this.weightManagerState, newWeights);
  }

  /**
   * Get current evaluation weights
   * @returns Current weight configuration
   */
  getWeights(): EvaluationWeights {
    return getWeights(this.weightManagerState);
  }

  /**
   * Reset weights to default values
   */
  resetWeights(): void {
    this.weightManagerState = resetWeights(this.weightManagerState);
  }

  // BaseEvaluator interface implementation

  /**
   * Evaluate a board state (BaseEvaluator interface)
   * @param state - The current board state to evaluate
   * @returns Evaluation score
   */
  evaluate(state: BoardState): number;
  evaluate(board: BitBoardData, move: Move): number;
  evaluate(boardOrState: BitBoardData | BoardState, move?: Move): number {
    // Maintain backward compatibility - if called with BitBoard and Move, use evaluateMove
    if (move !== undefined) {
      return this.evaluateMove(boardOrState as BitBoardData, move);
    }

    // New BaseEvaluator interface - evaluate board state
    const state = boardOrState as BoardState;
    const features = this.calculateFeatures(state.board);
    return this.applyWeights(features);
  }

  /**
   * Calculate features from the board (BaseEvaluator interface)
   * @param board - The board to analyze
   * @returns Set of features extracted from the board
   */
  calculateFeatures(board: BitBoardData): FeatureSet {
    // Calculate features for the current board state without a specific move
    // This provides a baseline evaluation of the board
    return {
      rowTransitions: calculateRowTransitions(board),
      columnTransitions: calculateColumnTransitions(board),
      holes: calculateHoles(board),
      wells: calculateWells(board),
      blocksAboveHoles: calculateBlocksAboveHoles(board),
      wellOpen: calculateWellOpen(board) ? 1 : 0,
      escapeRoute: calculateEscapeRoute(board),
      bumpiness: calculateBumpiness(board),
      maxHeight: calculateMaxHeight(board),
      rowFillRatio: calculateRowFillRatio(board),
      linesCleared: 0, // No lines cleared in static evaluation
      landingHeight: 0, // No landing height in static evaluation
      potentialLinesFilled: 0, // No potential lines in static evaluation
    };
  }

  /**
   * Apply weights to features to compute a final score (BaseEvaluator interface)
   * @param features - The features to score
   * @returns Weighted evaluation score
   */
  applyWeights(features: FeatureSet): number {
    return calculateScore(
      features as unknown as EvaluationFeatures,
      getWeights(this.weightManagerState),
    );
  }

  /**
   * Get the name of this evaluator (BaseEvaluator interface)
   * @returns Human-readable name of the evaluator
   */
  getName(): string {
    return "DellacherieEvaluator";
  }

  // MoveEvaluator interface implementation is already provided by existing evaluateMove method

  // WeightedEvaluator interface implementation is already provided by existing methods:
  // - getWeights(): EvaluationWeights
  // - updateWeights(newWeights: Partial<EvaluationWeights>): void
  // - resetWeights(): void
}
