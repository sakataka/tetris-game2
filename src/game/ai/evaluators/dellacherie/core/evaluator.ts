import type { BitBoard } from "@/game/ai/core/bitboard";
import { getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import { calculateScore } from "../calculator/scorer";
import { DEFAULT_WEIGHTS, WeightManager } from "../calculator/weights";
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
export class DellacherieEvaluator {
  private readonly weightManager: WeightManager;

  constructor(weights: EvaluationWeights = DEFAULT_WEIGHTS) {
    this.weightManager = new WeightManager(weights);
  }

  /**
   * Evaluate a move and return its heuristic score
   * Higher scores indicate better moves
   *
   * @param board - Current board state
   * @param move - Move to evaluate
   * @returns Heuristic score for the move
   */
  evaluate(board: BitBoard, move: Move): number {
    const features = this.extractFeatures(board, move);
    return calculateScore(features, this.weightManager.getWeights());
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
  extractFeatures(board: BitBoard, move: Move): EvaluationFeatures {
    // Create a simulation board to test the move
    const tempBoard = board.clone();

    // Get piece bit patterns if not cached
    if (!move.pieceBitRows) {
      move.pieceBitRows = getPieceBitsAtPosition(move.piece, move.rotation, move.x);
    }

    // Simulate piece placement
    tempBoard.place(move.pieceBitRows, move.y);

    // Clear lines and get count
    const clearedLines = tempBoard.clearLines();

    // DEBUG: Log line clearing activity
    if (clearedLines.length > 0) {
      console.log(
        `🎯 [Dellacherie] Line Clear! Piece: ${move.piece}, Position: (${move.x}, ${move.y}), Lines: ${clearedLines.length}`,
      );
    }

    // Calculate potential lines filled by this move (using original board)
    const potentialLinesFilled = board.calculatePotentialLinesFilled(move.pieceBitRows, move.y);

    // Create pre-clear board for feature extraction (board + piece, before line clearing)
    const preClearBoard = board.clone();
    preClearBoard.place(move.pieceBitRows, move.y);

    return {
      landingHeight: calculateLandingHeight(board, move),
      linesCleared: clearedLines.length,
      potentialLinesFilled,
      rowTransitions: calculateRowTransitions(preClearBoard),
      columnTransitions: calculateColumnTransitions(preClearBoard),
      holes: calculateHoles(preClearBoard),
      wells: calculateWells(preClearBoard),
      blocksAboveHoles: calculateBlocksAboveHoles(preClearBoard),
      wellOpen: calculateWellOpen(preClearBoard),
      escapeRoute: calculateEscapeRoute(preClearBoard),
      bumpiness: calculateBumpiness(preClearBoard),
      maxHeight: calculateMaxHeight(preClearBoard),
      rowFillRatio: calculateRowFillRatio(preClearBoard),
    };
  }

  /**
   * Update evaluation weights dynamically
   * Allows for adaptive AI behavior based on game state
   *
   * @param newWeights - Updated weight configuration
   */
  updateWeights(newWeights: Partial<EvaluationWeights>): void {
    this.weightManager.updateWeights(newWeights);
  }

  /**
   * Get current evaluation weights
   * @returns Current weight configuration
   */
  getWeights(): EvaluationWeights {
    return this.weightManager.getWeights();
  }

  /**
   * Reset weights to default values
   */
  resetWeights(): void {
    this.weightManager.resetWeights();
  }
}
