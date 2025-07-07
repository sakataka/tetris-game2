import type { BitBoard } from "@/game/ai/core/bitboard";
import { getPieceBitPattern, getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import type { RotationState, TetrominoTypeName } from "@/types/game";

/**
 * Dellacherie heuristic evaluation features for Tetris AI
 * Based on the acclaimed Dellacherie algorithm with 6 core features
 *
 * Reference: "A Study of Tetris AI" by Pierre Dellacherie
 * Performance target: 2x survival time compared to random placement
 */
export interface EvaluationFeatures {
  /** Landing height: height of the piece's center of mass after placement */
  landingHeight: number;

  /** Lines cleared: number of complete lines removed by this placement */
  linesCleared: number;

  /** Row transitions: number of empty-to-filled and filled-to-empty transitions horizontally */
  rowTransitions: number;

  /** Column transitions: number of empty-to-filled and filled-to-empty transitions vertically */
  columnTransitions: number;

  /** Holes: number of empty cells with at least one filled cell above them */
  holes: number;

  /** Wells: sum of well depths (empty columns surrounded by filled cells) */
  wells: number;
}

/**
 * Evaluation weights optimized for general Tetris gameplay
 * These values are derived from extensive machine learning research
 */
export interface EvaluationWeights {
  landingHeight: number;
  linesCleared: number;
  rowTransitions: number;
  columnTransitions: number;
  holes: number;
  wells: number;
}

/**
 * Move representation for AI evaluation
 * Contains all information needed to simulate a piece placement
 */
export interface Move {
  piece: TetrominoTypeName;
  rotation: RotationState;
  x: number;
  y: number;
  /** Cached bit patterns for performance optimization */
  pieceBitRows?: number[];
}

/**
 * ULTRA-AGGRESSIVE line-clearing focused Dellacherie evaluation weights
 * Optimized for maximum line clearing with exponential rewards
 * Dramatically prioritizes line clearing over ALL other considerations
 */
export const DEFAULT_WEIGHTS: EvaluationWeights = {
  landingHeight: -3.0, // Minimal penalty for high placement - allow aggressive building
  linesCleared: 100.0, // MAXIMUM reward for line clearing - absolute priority
  rowTransitions: -1.0, // Minimal penalty for horizontal roughness
  columnTransitions: -5.0, // Reduced penalty for column inconsistency
  holes: -8.0, // Reduced penalty for holes - clearing is more important
  wells: -3.0, // Minimal penalty for wells - can be useful for I-pieces
};

/**
 * High-performance Dellacherie heuristic evaluator
 * Implements the 6-feature evaluation system with optimized algorithms
 */
export class DellacherieEvaluator {
  private readonly weights: EvaluationWeights;

  constructor(weights: EvaluationWeights = DEFAULT_WEIGHTS) {
    this.weights = { ...weights };
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
    return this.calculateScore(features);
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

    return {
      landingHeight: this.calculateLandingHeight(board, move),
      linesCleared: clearedLines.length,
      rowTransitions: this.calculateRowTransitions(tempBoard),
      columnTransitions: this.calculateColumnTransitions(tempBoard),
      holes: this.calculateHoles(tempBoard),
      wells: this.calculateWells(tempBoard),
    };
  }

  /**
   * Calculate landing height feature
   * Height of the piece's center of mass plus contributing factor
   *
   * @param board - Original board state
   * @param move - Move being evaluated
   * @returns Landing height value
   */
  private calculateLandingHeight(_board: BitBoard, move: Move): number {
    const pattern = getPieceBitPattern(move.piece, move.rotation);

    // Calculate piece center of mass Y coordinate
    let totalY = 0;
    let cellCount = 0;

    for (let i = 0; i < pattern.rows.length; i++) {
      const rowBits = pattern.rows[i];
      let bits = rowBits;
      while (bits) {
        totalY += move.y + i;
        cellCount++;
        bits &= bits - 1; // Clear lowest set bit
      }
    }

    const centerY = cellCount > 0 ? totalY / cellCount : move.y;

    // Convert to height from bottom (higher values = closer to top)
    return 20 - centerY;
  }

  /**
   * Calculate row transitions (horizontal discontinuities)
   * Counts transitions between empty and filled cells along rows
   *
   * @param board - Board state to analyze
   * @returns Number of row transitions
   */
  private calculateRowTransitions(board: BitBoard): number {
    let transitions = 0;

    for (let y = 0; y < 20; y++) {
      const rowBits = board.getRowBits(y);

      // Only count transitions for non-empty rows
      if (rowBits === 0) continue;

      let lastBit = 1; // Left wall considered filled

      for (let x = 0; x < 10; x++) {
        const currentBit = (rowBits >> x) & 1;
        if (currentBit !== lastBit) {
          transitions++;
        }
        lastBit = currentBit;
      }

      // Right wall transition
      if (lastBit === 0) {
        transitions++;
      }
    }

    return transitions;
  }

  /**
   * Calculate column transitions (vertical discontinuities)
   * Counts transitions between empty and filled cells along columns
   *
   * @param board - Board state to analyze
   * @returns Number of column transitions
   */
  private calculateColumnTransitions(board: BitBoard): number {
    let transitions = 0;

    for (let x = 0; x < 10; x++) {
      let lastBit = 1; // Bottom floor considered filled

      for (let y = 19; y >= 0; y--) {
        const currentBit = (board.getRowBits(y) >> x) & 1;
        if (currentBit !== lastBit) {
          transitions++;
        }
        lastBit = currentBit;
      }

      // Top boundary transition
      if (lastBit === 0) {
        transitions++;
      }
    }

    return transitions;
  }

  /**
   * Calculate holes (empty cells covered by filled cells)
   * A hole is an empty cell with at least one filled cell above it
   *
   * @param board - Board state to analyze
   * @returns Number of holes
   */
  private calculateHoles(board: BitBoard): number {
    let holes = 0;

    for (let x = 0; x < 10; x++) {
      let blockFound = false;

      for (let y = 0; y < 20; y++) {
        const bit = (board.getRowBits(y) >> x) & 1;

        if (bit === 1) {
          blockFound = true;
        } else if (blockFound) {
          holes++;
        }
      }
    }

    return holes;
  }

  /**
   * Calculate wells (empty columns surrounded by filled cells)
   * Uses depth-weighted scoring: deeper wells are penalized more heavily
   *
   * @param board - Board state to analyze
   * @returns Sum of weighted well depths
   */
  private calculateWells(board: BitBoard): number {
    let wells = 0;

    for (let x = 0; x < 10; x++) {
      // Track well depths from bottom to top
      let wellDepth = 0;
      let inWell = false;

      for (let y = 19; y >= 0; y--) {
        const current = (board.getRowBits(y) >> x) & 1;
        const left = x > 0 ? (board.getRowBits(y) >> (x - 1)) & 1 : 1;
        const right = x < 9 ? (board.getRowBits(y) >> (x + 1)) & 1 : 1;

        if (current === 0 && left === 1 && right === 1) {
          // Empty cell surrounded by filled cells (well)
          if (!inWell) {
            inWell = true;
            wellDepth = 1;
          } else {
            wellDepth++;
          }
        } else {
          // Not a well cell
          if (inWell) {
            // End of well - add weighted depth
            wells += (wellDepth * (wellDepth + 1)) / 2;
            inWell = false;
            wellDepth = 0;
          }
        }
      }

      // Handle well that extends to the top
      if (inWell) {
        wells += (wellDepth * (wellDepth + 1)) / 2;
      }
    }

    return wells;
  }

  /**
   * Calculate weighted score from feature values
   * Combines all features using learned weights
   * Enhanced with exponential line clearing bonuses
   *
   * @param features - Extracted feature values
   * @returns Final heuristic score
   */
  private calculateScore(features: EvaluationFeatures): number {
    // Apply exponential bonus for multiple line clears
    const lineClearBonus =
      features.linesCleared > 0 ? features.linesCleared ** 2.5 * this.weights.linesCleared : 0;

    // Base score calculation
    const baseScore =
      features.landingHeight * this.weights.landingHeight +
      features.rowTransitions * this.weights.rowTransitions +
      features.columnTransitions * this.weights.columnTransitions +
      features.holes * this.weights.holes +
      features.wells * this.weights.wells;

    // Massive bonus for any line clearing
    return baseScore + lineClearBonus;
  }

  /**
   * Update evaluation weights dynamically
   * Allows for adaptive AI behavior based on game state
   *
   * @param newWeights - Updated weight configuration
   */
  updateWeights(newWeights: Partial<EvaluationWeights>): void {
    Object.assign(this.weights, newWeights);
  }

  /**
   * Get current evaluation weights
   * @returns Current weight configuration
   */
  getWeights(): EvaluationWeights {
    return { ...this.weights };
  }

  /**
   * Reset weights to default values
   */
  resetWeights(): void {
    Object.assign(this.weights, DEFAULT_WEIGHTS);
  }
}

/**
 * Utility function to create a move object
 * Helps with type safety and consistency
 *
 * @param piece - Tetromino type
 * @param rotation - Rotation state
 * @param x - X position
 * @param y - Y position
 * @returns Properly formatted move object
 */
export function createMove(
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
  y: number,
): Move {
  return {
    piece,
    rotation,
    x,
    y,
    pieceBitRows: getPieceBitsAtPosition(piece, rotation, x),
  };
}

/**
 * Find the drop position for a piece at given X and rotation
 * Simulates gravity to find where the piece would naturally land
 *
 * @param board - Current board state
 * @param piece - Tetromino type
 * @param rotation - Rotation state
 * @param x - X position
 * @returns Y position where piece would land, or -1 if invalid
 */
export function findDropPosition(
  board: BitBoard,
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
): number {
  const pieceBitRows = getPieceBitsAtPosition(piece, rotation, x);

  if (pieceBitRows.length === 0) {
    return -1; // Invalid position
  }

  // Start from top and find first valid position
  for (let y = 0; y <= 20 - pieceBitRows.length; y++) {
    if (board.canPlace(pieceBitRows, y)) {
      // Check if the piece would be supported (can't fall further)
      const nextY = y + 1;
      if (nextY + pieceBitRows.length > 20 || !board.canPlace(pieceBitRows, nextY)) {
        return y;
      }
    }
  }

  return -1; // No valid position found
}
