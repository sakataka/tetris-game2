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

  /** Potential lines filled: number of lines that would be completed by this move */
  potentialLinesFilled: number;

  /** Row transitions: number of empty-to-filled and filled-to-empty transitions horizontally */
  rowTransitions: number;

  /** Column transitions: number of empty-to-filled and filled-to-empty transitions vertically */
  columnTransitions: number;

  /** Holes: number of empty cells with at least one filled cell above them */
  holes: number;

  /** Wells: sum of well depths (empty columns surrounded by filled cells) */
  wells: number;

  /** Blocks above holes: number of blocks above each hole (depth penalty) */
  blocksAboveHoles: number;

  /** Well open: whether the deepest well is accessible for I-piece placement */
  wellOpen: boolean;

  /** Escape route: reachability score for recovery from critical situations */
  escapeRoute: number;

  /** Bumpiness: sum of absolute height differences between adjacent columns */
  bumpiness: number;

  /** Maximum height: highest column on the board */
  maxHeight: number;

  /** Row fill ratio: completion percentage of near-full rows */
  rowFillRatio: number;
}

/**
 * Evaluation weights optimized for general Tetris gameplay
 * These values are derived from extensive machine learning research
 */
export interface EvaluationWeights {
  landingHeight: number;
  linesCleared: number;
  potentialLinesFilled: number;
  rowTransitions: number;
  columnTransitions: number;
  holes: number;
  wells: number;
  blocksAboveHoles: number;
  wellOpen: number;
  escapeRoute: number;
  bumpiness: number;
  maxHeight: number;
  rowFillRatio: number;
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
  /** Number of lines cleared by this move */
  linesCleared?: number;
  /** Evaluation score for this move */
  evaluationScore?: number;
}

/**
 * LINE-CLEARING FOCUSED weights: Based on o3 MCP recommendations
 * MASSIVE priority for line clearing above all else
 * Other features reduced to 1/3 - 1/5 of original values
 */
export const DEFAULT_WEIGHTS: EvaluationWeights = {
  landingHeight: -1.5, // Reduced from -4.5 (1/3)
  linesCleared: 1000.0, // MASSIVE increase from 100.0 (10x) - TOP PRIORITY
  potentialLinesFilled: 200.0, // Increased from 80.0 (2.5x) - Secondary priority
  rowTransitions: -1.0, // Reduced from -3.2 (1/3)
  columnTransitions: -3.0, // Reduced from -9.3 (1/3)
  holes: -5.0, // Reduced from -15.0 (1/3)
  wells: -1.0, // Reduced from -3.4 (1/3)
  blocksAboveHoles: -2.5, // Reduced from -8.0 (1/3)
  wellOpen: 0.0, // Ignore well accessibility for simplicity
  escapeRoute: 0.0, // Ignore escape routes for simplicity
  bumpiness: -3.0, // Reduced from -10.0 (1/3)
  maxHeight: -15.0, // Reduced from -50.0 (1/3) - Allow higher stacks for line clearing
  rowFillRatio: 50.0, // Increased from 30.0 - Support horizontal filling
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
      landingHeight: this.calculateLandingHeight(board, move),
      linesCleared: clearedLines.length,
      potentialLinesFilled,
      rowTransitions: this.calculateRowTransitions(preClearBoard),
      columnTransitions: this.calculateColumnTransitions(preClearBoard),
      holes: this.calculateHoles(preClearBoard),
      wells: this.calculateWells(preClearBoard),
      blocksAboveHoles: this.calculateBlocksAboveHoles(preClearBoard),
      wellOpen: this.calculateWellOpen(preClearBoard),
      escapeRoute: this.calculateEscapeRoute(preClearBoard),
      bumpiness: this.calculateBumpiness(preClearBoard),
      maxHeight: this.calculateMaxHeight(preClearBoard),
      rowFillRatio: this.calculateRowFillRatio(preClearBoard),
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
   * Calculate blocks above holes penalty
   * Counts the number of blocks above each hole to assess depth penalty
   * Deep holes are exponentially harder to clear
   *
   * @param board - Board state to analyze
   * @returns Number of blocks above all holes
   */
  private calculateBlocksAboveHoles(board: BitBoard): number {
    let penalty = 0;

    for (let x = 0; x < 10; x++) {
      const holes: number[] = [];
      let blockFound = false;

      // First pass: identify all holes in this column
      for (let y = 0; y < 20; y++) {
        const cellFilled = (board.getRowBits(y) >> x) & 1;

        if (cellFilled) {
          blockFound = true;
        } else if (blockFound) {
          // This is a hole
          holes.push(y);
        }
      }

      // Second pass: for each hole, count blocks above it
      for (const holeY of holes) {
        let blocksAbove = 0;
        for (let y = holeY - 1; y >= 0; y--) {
          const cellFilled = (board.getRowBits(y) >> x) & 1;
          if (cellFilled) {
            blocksAbove++;
          }
        }
        penalty += blocksAbove;
      }
    }

    return penalty;
  }

  /**
   * Calculate well open detection
   * Determines if the deepest well is accessible for I-piece placement
   *
   * @param board - Board state to analyze
   * @returns true if well is accessible, false otherwise
   */
  private calculateWellOpen(board: BitBoard): boolean {
    const heights = this.getColumnHeights(board);
    const maxHeight = Math.max(...heights);

    // If board is very low, consider wells open
    if (maxHeight <= 3) {
      return true;
    }

    // Find wells - columns that are significantly lower than neighbors
    for (let x = 0; x < 10; x++) {
      const currentHeight = heights[x];
      const leftHeight = x > 0 ? heights[x - 1] : currentHeight + 10;
      const rightHeight = x < 9 ? heights[x + 1] : currentHeight + 10;

      // Check if this forms a well (lower than both neighbors by at least 1)
      const isWell = currentHeight + 1 <= leftHeight && currentHeight + 1 <= rightHeight;

      if (isWell) {
        // Check if there's enough space for an I-piece (at least 4 rows)
        const availableSpace = Math.min(leftHeight, rightHeight) - currentHeight;
        if (availableSpace >= 4) {
          // Additional check: well must be at least 4 rows deep from bottom
          const wellDepth = 20 - currentHeight;
          if (wellDepth >= 4) {
            // Make sure the well isn't blocked by very high columns elsewhere
            const averageHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
            if (currentHeight <= averageHeight + 2) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Calculate escape route analysis
   * Evaluates recovery potential from critical situations
   *
   * @param board - Board state to analyze
   * @returns Escape route score (higher = better recovery potential)
   */
  private calculateEscapeRoute(board: BitBoard): number {
    const heights = this.getColumnHeights(board);
    const maxHeight = Math.max(...heights);
    const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    const heightVariance =
      heights.reduce((sum, h) => sum + Math.abs(h - avgHeight), 0) / heights.length;

    // Base escape potential
    let escapeScore = 0;

    // Lower board height = better escape potential
    escapeScore += Math.max(0, 10 - maxHeight);

    // Lower height variance = more stable board
    escapeScore += Math.max(0, 5 - heightVariance);

    // Check for well accessibility
    const wellOpen = this.calculateWellOpen(board);
    if (wellOpen) {
      escapeScore += 5;
    }

    // Penalty for blocks above holes
    const blocksAboveHoles = this.calculateBlocksAboveHoles(board);
    escapeScore -= blocksAboveHoles * 0.5;

    return escapeScore;
  }

  /**
   * Calculate bumpiness feature
   * Sum of absolute height differences between adjacent columns
   * Lower values indicate a flatter, more stable surface
   *
   * @param board - BitBoard to analyze
   * @returns Bumpiness value (0 = perfectly flat)
   */
  private calculateBumpiness(board: BitBoard): number {
    const heights = this.getColumnHeights(board);
    let bumpiness = 0;

    // Sum absolute differences between adjacent columns
    for (let x = 0; x < heights.length - 1; x++) {
      bumpiness += Math.abs(heights[x] - heights[x + 1]);
    }

    return bumpiness;
  }

  /**
   * Get height of each column on the board
   * @param board - Board state to analyze
   * @returns Array of column heights
   */
  private getColumnHeights(board: BitBoard): number[] {
    const heights: number[] = [];

    for (let x = 0; x < 10; x++) {
      let height = 0;
      for (let y = 0; y < 20; y++) {
        if ((board.getRowBits(y) >> x) & 1) {
          height = 20 - y;
          break;
        }
      }
      heights.push(height);
    }

    return heights;
  }

  /**
   * Calculate maximum height feature
   * Returns the height of the tallest column on the board
   * Critical for height control and dangerous stacking prevention
   *
   * @param board - Board state to analyze
   * @returns Maximum column height
   */
  private calculateMaxHeight(board: BitBoard): number {
    const heights = this.getColumnHeights(board);
    return Math.max(...heights);
  }

  /**
   * Calculate row fill ratio feature
   * Evaluates how close rows are to completion for strategic horizontal filling
   * Rewards moves that work toward completing nearly-full rows
   *
   * @param board - Board state to analyze
   * @returns Row fill ratio score (higher = better horizontal filling)
   */
  private calculateRowFillRatio(board: BitBoard): number {
    let totalScore = 0;
    let significantRows = 0;

    for (let y = 0; y < 20; y++) {
      const rowBits = board.getRowBits(y);
      if (rowBits === 0) continue; // Skip empty rows

      // Count filled cells in this row using Brian Kernighan's algorithm
      let filledCells = 0;
      let bits = rowBits;
      while (bits) {
        filledCells++;
        bits &= bits - 1; // Clear the lowest set bit
      }
      const fillRatio = filledCells / 10; // 10 is board width

      // Apply weighted scoring for near-complete rows
      if (fillRatio >= 0.7) {
        // Rows that are 70%+ complete get exponential scoring
        const completionBonus = fillRatio ** 3 * 10;
        totalScore += completionBonus;
        significantRows++;
      } else if (fillRatio >= 0.5) {
        // Rows that are 50%+ complete get linear scoring
        totalScore += fillRatio * 2;
        significantRows++;
      }
    }

    // Normalize by number of significant rows to avoid favoring tall stacks
    return significantRows > 0 ? totalScore / significantRows : 0;
  }

  /**
   * Calculate weighted score from feature values
   * Combines all features using learned weights
   * Enhanced with exponential line clearing bonuses and NO-CLEAR PENALTY
   *
   * @param features - Extracted feature values
   * @returns Final heuristic score
   */
  private calculateScore(features: EvaluationFeatures): number {
    // Apply MASSIVE bonus for line clears
    const lineClearBonus = features.linesCleared * this.weights.linesCleared;

    // Apply NO-CLEAR PENALTY: Strong penalty when no lines are cleared
    const noClearPenalty = features.linesCleared === 0 ? -150.0 : 0;

    // Apply bonus for potential line fills
    const potentialLinesBonus = features.potentialLinesFilled * this.weights.potentialLinesFilled;

    // Apply maxHeight with thresholded height cost (THC)
    const heightThreshold = 15; // Increased threshold to allow higher stacks for line clearing
    const maxHeightScore = features.maxHeight * this.weights.maxHeight;
    const thresholdedHeightPenalty =
      features.maxHeight > heightThreshold
        ? (features.maxHeight - heightThreshold) ** 2 * -10.0 // Reduced penalty to allow stacking
        : 0;

    // Apply row fill ratio bonus
    const rowFillBonus = features.rowFillRatio * this.weights.rowFillRatio;

    // Base score calculation
    const baseScore =
      features.landingHeight * this.weights.landingHeight +
      features.rowTransitions * this.weights.rowTransitions +
      features.columnTransitions * this.weights.columnTransitions +
      features.holes * this.weights.holes +
      features.wells * this.weights.wells +
      features.blocksAboveHoles * this.weights.blocksAboveHoles +
      (features.wellOpen ? 1 : 0) * this.weights.wellOpen +
      features.escapeRoute * this.weights.escapeRoute +
      features.bumpiness * this.weights.bumpiness +
      maxHeightScore +
      thresholdedHeightPenalty;

    const totalScore =
      baseScore + lineClearBonus + potentialLinesBonus + rowFillBonus + noClearPenalty;

    // DEBUG: Log scoring details for ALL moves to track decision making
    if (features.linesCleared > 0 || features.potentialLinesFilled > 0 || features.maxHeight > 8) {
      console.log(`🎯 [Dellacherie] Score Details:
        Lines Cleared: ${features.linesCleared} × ${this.weights.linesCleared} = ${lineClearBonus}
        No-Clear Penalty: ${noClearPenalty}
        Potential Lines: ${features.potentialLinesFilled} × ${this.weights.potentialLinesFilled} = ${potentialLinesBonus}
        Max Height: ${features.maxHeight} (Penalty: ${maxHeightScore.toFixed(2)} + Threshold: ${thresholdedHeightPenalty.toFixed(2)})
        Row Fill Ratio: ${features.rowFillRatio.toFixed(2)} (Bonus: ${rowFillBonus.toFixed(2)})
        Bumpiness: ${features.bumpiness} (Penalty: ${(features.bumpiness * this.weights.bumpiness).toFixed(2)})
        Holes: ${features.holes} (Penalty: ${(features.holes * this.weights.holes).toFixed(2)})
        Base Score: ${baseScore.toFixed(2)}
        Total Score: ${totalScore.toFixed(2)}`);
    }

    return totalScore;
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
