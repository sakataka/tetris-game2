import type { BitBoard } from "@/game/ai/core/bitboard";
import type { Move } from "@/game/ai/core/move-generator";
import { getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import type { RotationState, TetrominoTypeName } from "@/types/game";
import type {
  BaseEvaluator,
  BoardState,
  FeatureSet,
  MoveEvaluator,
  WeightedEvaluator,
} from "./base-evaluator";

/**
 * Stacking-focused evaluation features for Tetris AI
 * Based on o3 MCP research findings and DT-20 system
 *
 * Focus: Gradual line building rather than immediate clearing
 * Strategy: Single well + edge penalty + progressive stacking
 */
export interface StackingFeatures {
  /** Landing height: height of the piece's center of mass after placement */
  landingHeight: number;

  /** Lines cleared: number of complete lines removed by this placement */
  linesCleared: number;

  /** Potential lines filled: lines that would be completed by this move */
  potentialLinesFilled: number;

  /** Row transitions: horizontal empty-to-filled transitions */
  rowTransitions: number;

  /** Column transitions: vertical empty-to-filled transitions */
  columnTransitions: number;

  /** Holes: empty cells with filled cells above them */
  holes: number;

  /** Wells: sum of well depths (empty columns surrounded by filled cells) */
  wells: number;

  /** Surface bumpiness: sum of absolute height differences between adjacent columns */
  bumpiness: number;

  /** Edge penalty: penalty for placing pieces at edges (columns 0 and 9) */
  edgePenalty: number;

  /** Well depth: depth of the designated well (usually column 9) */
  wellDepth: number;

  /** Near full rows: rows with 1-2 empty cells that could be filled soon */
  nearFullRows: number;

  /** I-piece wait opportunity: bonus for waiting for I-piece when well is ready */
  iPieceWaitOpportunity: number;

  /** Stack height: maximum height of the board */
  stackHeight: number;
}

/**
 * Stacking-focused evaluation weights
 * Optimized for gradual line building and single well strategy
 */
export interface StackingWeights extends Record<string, number> {
  landingHeight: number;
  linesCleared: number;
  potentialLinesFilled: number;
  rowTransitions: number;
  columnTransitions: number;
  holes: number;
  wells: number;
  bumpiness: number;
  edgePenalty: number;
  wellDepth: number;
  nearFullRows: number;
  iPieceWaitOpportunity: number;
  stackHeight: number;
}

/**
 * Move evaluation result for stacking-focused AI
 */
export interface StackingMoveEvaluation {
  piece: TetrominoTypeName;
  x: number;
  y: number;
  rotation: RotationState;
  score: number;
  features: StackingFeatures;
  pieceBitRows: number[];
}

/**
 * Stacking-focused Tetris AI evaluator
 * Implements gradual line building strategy with single well approach
 */
export class StackingEvaluator implements BaseEvaluator, WeightedEvaluator, MoveEvaluator {
  private readonly weights: StackingWeights;
  private readonly wellColumn: number; // Designated well column (usually 9)

  constructor(weights?: Partial<StackingWeights>) {
    this.weights = {
      // DT-20 base weights
      landingHeight: -2.7,
      linesCleared: 40.0, // High reward for line clearing
      potentialLinesFilled: 15.0, // Reward for setting up future clears
      rowTransitions: -2.4,
      columnTransitions: -6.3,
      holes: -8.0,
      wells: -3.0,
      bumpiness: -2.0,

      // Stacking-specific weights
      edgePenalty: -5.0, // Penalty for edge placement
      wellDepth: 1.0, // Small bonus for well depth when <= 4
      nearFullRows: 8.0, // Bonus for creating near-full rows
      iPieceWaitOpportunity: 12.0, // Bonus for I-piece wait opportunity
      stackHeight: -1.5, // Penalty for height

      ...weights,
    };
    this.wellColumn = 9; // Right column as designated well
  }

  /**
   * Evaluate a move for compatibility with AI engine (MoveEvaluator interface)
   * @param board - Current board state
   * @param move - Move to evaluate
   * @returns Evaluation score
   */
  evaluateMove(board: BitBoard, move: Move): number {
    const result = this.evaluateMoveDetailed(board, move.piece, move.x, move.y, move.rotation);
    return result.score;
  }

  /**
   * Evaluate a move for stacking-focused play (detailed version)
   */
  evaluateMoveDetailed(
    board: BitBoard,
    piece: TetrominoTypeName,
    x: number,
    y: number,
    rotation: RotationState,
  ): StackingMoveEvaluation {
    const pieceBitRows = getPieceBitsAtPosition(piece, rotation, x);

    // Create a copy of the board and place the piece
    const tempBoard = board.clone();
    tempBoard.place(pieceBitRows, y);

    // Clear lines and get information about cleared lines
    const clearedLines = tempBoard.clearLines();

    // Extract features
    const features = this.extractFeatures(tempBoard, {
      piece,
      x,
      y,
      rotation,
      pieceBitRows,
      clearedLines,
    });

    // Calculate score
    const score = this.calculateScore(features);

    return {
      piece,
      x,
      y,
      rotation,
      score,
      features,
      pieceBitRows,
    };
  }

  /**
   * Extract all stacking-focused features from the board state
   */
  private extractFeatures(
    board: BitBoard,
    move: {
      piece: TetrominoTypeName;
      x: number;
      y: number;
      rotation: RotationState;
      pieceBitRows: number[];
      clearedLines: number[];
    },
  ): StackingFeatures {
    const features: StackingFeatures = {
      landingHeight: this.calculateLandingHeight(board, move),
      linesCleared: move.clearedLines.length,
      potentialLinesFilled: board.calculatePotentialLinesFilled(move.pieceBitRows, move.y),
      rowTransitions: this.calculateRowTransitions(board),
      columnTransitions: this.calculateColumnTransitions(board),
      holes: this.calculateHoles(board),
      wells: this.calculateWells(board),
      bumpiness: this.calculateBumpiness(board),
      edgePenalty: this.calculateEdgePenalty(move.x),
      wellDepth: this.calculateWellDepth(board),
      nearFullRows: this.calculateNearFullRows(board),
      iPieceWaitOpportunity: this.calculateIPieceWaitOpportunity(board, move.piece),
      stackHeight: this.calculateStackHeight(board),
    };

    return features;
  }

  /**
   * Calculate landing height (center of mass of placed piece)
   */
  private calculateLandingHeight(
    board: BitBoard,
    move: {
      piece: TetrominoTypeName;
      x: number;
      y: number;
      pieceBitRows: number[];
    },
  ): number {
    let totalHeight = 0;
    let cellCount = 0;

    for (let i = 0; i < move.pieceBitRows.length; i++) {
      const row = move.pieceBitRows[i];
      if (row === 0) continue;

      const y = move.y + i;
      const pieceRowHeight = board.getDimensions().height - y;

      // Count bits in this row
      const bits = row;
      let tempBits = bits;
      while (tempBits > 0) {
        if (tempBits & 1) {
          totalHeight += pieceRowHeight;
          cellCount++;
        }
        tempBits >>= 1;
      }
    }

    return cellCount > 0 ? totalHeight / cellCount : 0;
  }

  /**
   * Calculate row transitions (horizontal empty-to-filled transitions)
   */
  private calculateRowTransitions(board: BitBoard): number {
    let transitions = 0;
    const { height, width } = board.getDimensions();

    for (let y = 0; y < height; y++) {
      const row = board.getRowBits(y);
      let prevFilled = true; // Assume left wall is filled

      for (let x = 0; x < width; x++) {
        const currentFilled = (row & (1 << x)) !== 0;
        if (prevFilled !== currentFilled) {
          transitions++;
        }
        prevFilled = currentFilled;
      }

      // Check transition to right wall
      if (!prevFilled) {
        transitions++;
      }
    }

    return transitions;
  }

  /**
   * Calculate column transitions (vertical empty-to-filled transitions)
   */
  private calculateColumnTransitions(board: BitBoard): number {
    let transitions = 0;
    const { height, width } = board.getDimensions();

    for (let x = 0; x < width; x++) {
      let prevFilled = true; // Assume top wall is filled

      for (let y = 0; y < height; y++) {
        const currentFilled = (board.getRowBits(y) & (1 << x)) !== 0;
        if (prevFilled !== currentFilled) {
          transitions++;
        }
        prevFilled = currentFilled;
      }

      // Check transition to bottom wall
      if (!prevFilled) {
        transitions++;
      }
    }

    return transitions;
  }

  /**
   * Calculate holes (empty cells with filled cells above them)
   */
  private calculateHoles(board: BitBoard): number {
    let holes = 0;
    const { height, width } = board.getDimensions();

    for (let x = 0; x < width; x++) {
      let foundFilled = false;

      for (let y = 0; y < height; y++) {
        const filled = (board.getRowBits(y) & (1 << x)) !== 0;
        if (filled) {
          foundFilled = true;
        } else if (foundFilled) {
          holes++;
        }
      }
    }

    return holes;
  }

  /**
   * Calculate wells (sum of well depths)
   */
  private calculateWells(board: BitBoard): number {
    let wellSum = 0;
    const { height, width } = board.getDimensions();

    for (let x = 0; x < width; x++) {
      let wellDepth = 0;
      let wellStarted = false;

      for (let y = 0; y < height; y++) {
        const filled = (board.getRowBits(y) & (1 << x)) !== 0;
        const leftFilled = x > 0 ? (board.getRowBits(y) & (1 << (x - 1))) !== 0 : true;
        const rightFilled = x < width - 1 ? (board.getRowBits(y) & (1 << (x + 1))) !== 0 : true;

        if (!filled && (leftFilled || rightFilled)) {
          wellDepth++;
          wellStarted = true;
        } else if (filled && wellStarted) {
          wellSum += wellDepth * wellDepth; // Quadratic penalty for deep wells
          wellDepth = 0;
          wellStarted = false;
        }
      }

      if (wellStarted) {
        wellSum += wellDepth * wellDepth;
      }
    }

    return wellSum;
  }

  /**
   * Calculate surface bumpiness (sum of absolute height differences)
   */
  private calculateBumpiness(board: BitBoard): number {
    const columnHeights = this.getColumnHeights(board);
    let bumpiness = 0;

    for (let i = 0; i < columnHeights.length - 1; i++) {
      bumpiness += Math.abs(columnHeights[i] - columnHeights[i + 1]);
    }

    return bumpiness;
  }

  /**
   * Calculate edge penalty for placing pieces at edges
   */
  private calculateEdgePenalty(x: number): number {
    const maxHeight = 18; // Assume max height for scaling
    const currentHeight = 5; // Simplified - in real implementation, get actual height

    // Dynamic penalty that decreases as stack height increases
    const heightFactor = 1 - currentHeight / maxHeight;

    // Penalty for edge placement (columns 0 and 9)
    if (x === 0 || x === 9) {
      return 1.0 * heightFactor;
    }

    // Smaller penalty for near-edge placement
    if (x === 1 || x === 8) {
      return 0.5 * heightFactor;
    }

    return 0;
  }

  /**
   * Calculate well depth in the designated well column
   */
  private calculateWellDepth(board: BitBoard): number {
    const { height } = board.getDimensions();
    let wellDepth = 0;
    let foundFilled = false;

    // Check from top to bottom in the well column
    for (let y = 0; y < height; y++) {
      const filled = (board.getRowBits(y) & (1 << this.wellColumn)) !== 0;
      if (filled) {
        foundFilled = true;
        break;
      }
      if (!foundFilled) {
        wellDepth++;
      }
    }

    // Bonus for well depth <= 4, penalty for deeper wells
    if (wellDepth <= 4) {
      return wellDepth;
    }
    return -(wellDepth - 4); // Penalty for too deep wells
  }

  /**
   * Calculate near full rows (rows with 1-2 empty cells)
   */
  private calculateNearFullRows(board: BitBoard): number {
    return board.findNearFullRows(2).length;
  }

  /**
   * Calculate I-piece wait opportunity
   */
  private calculateIPieceWaitOpportunity(board: BitBoard, piece: TetrominoTypeName): number {
    // If current piece is I-piece, no wait opportunity
    if (piece === "I") {
      return 0;
    }

    // Check if well is ready for I-piece (depth 3-4)
    const wellDepth = this.calculateWellDepth(board);
    if (wellDepth >= 3 && wellDepth <= 4) {
      // Calculate expected value of waiting for I-piece
      const iPieceProbability = 1 / 7; // Probability of getting I-piece in next bag
      const tetrisValue = 4 * this.weights.linesCleared; // Value of 4-line clear
      const waitPenalty = this.weights.stackHeight * 0.1; // Small penalty for waiting

      return iPieceProbability * tetrisValue - waitPenalty;
    }

    return 0;
  }

  /**
   * Calculate stack height (maximum height of the board)
   */
  private calculateStackHeight(board: BitBoard): number {
    const columnHeights = this.getColumnHeights(board);
    return Math.max(...columnHeights);
  }

  /**
   * Get column heights for the board
   */
  private getColumnHeights(board: BitBoard): number[] {
    const heights: number[] = [];
    const { height, width } = board.getDimensions();

    for (let x = 0; x < width; x++) {
      let columnHeight = 0;
      for (let y = 0; y < height; y++) {
        if ((board.getRowBits(y) & (1 << x)) !== 0) {
          columnHeight = height - y;
          break;
        }
      }
      heights.push(columnHeight);
    }

    return heights;
  }

  /**
   * Calculate the final score based on features
   */
  private calculateScore(features: StackingFeatures): number {
    const score =
      features.landingHeight * this.weights.landingHeight +
      features.linesCleared * this.weights.linesCleared +
      features.potentialLinesFilled * this.weights.potentialLinesFilled +
      features.rowTransitions * this.weights.rowTransitions +
      features.columnTransitions * this.weights.columnTransitions +
      features.holes * this.weights.holes +
      features.wells * this.weights.wells +
      features.bumpiness * this.weights.bumpiness +
      features.edgePenalty * this.weights.edgePenalty +
      features.wellDepth * this.weights.wellDepth +
      features.nearFullRows * this.weights.nearFullRows +
      features.iPieceWaitOpportunity * this.weights.iPieceWaitOpportunity +
      features.stackHeight * this.weights.stackHeight;

    return score;
  }

  /**
   * Get the current weights
   */
  getWeights(): StackingWeights {
    return { ...this.weights };
  }

  /**
   * Update weights (for tuning)
   */
  updateWeights(newWeights: Partial<StackingWeights>): void {
    Object.assign(this.weights, newWeights);
  }

  /**
   * Reset weights to default values
   */
  resetWeights(): void {
    Object.assign(this.weights, {
      landingHeight: -2.7,
      linesCleared: 40.0,
      potentialLinesFilled: 15.0,
      rowTransitions: -2.4,
      columnTransitions: -6.3,
      holes: -8.0,
      wells: -3.0,
      bumpiness: -2.0,
      edgePenalty: -5.0,
      wellDepth: 1.0,
      nearFullRows: 8.0,
      iPieceWaitOpportunity: 12.0,
      stackHeight: -1.5,
    });
  }

  // BaseEvaluator interface implementation

  /**
   * Evaluate a board state (BaseEvaluator interface)
   * @param state - The current board state to evaluate
   * @returns Evaluation score
   */
  evaluate(state: BoardState): number;
  evaluate(board: BitBoard, move: Move): number;
  evaluate(boardOrState: BitBoard | BoardState, move?: Move): number {
    // Maintain backward compatibility - if called with BitBoard and Move, use evaluateMove
    if (move !== undefined) {
      return this.evaluateMove(boardOrState as BitBoard, move);
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
  calculateFeatures(board: BitBoard): FeatureSet {
    // Extract features for current board state without a specific move
    const features: FeatureSet = {
      landingHeight: 0, // No landing height in static evaluation
      linesCleared: 0, // No lines cleared in static evaluation
      potentialLinesFilled: 0, // No potential lines in static evaluation
      rowTransitions: this.calculateRowTransitions(board),
      columnTransitions: this.calculateColumnTransitions(board),
      holes: this.calculateHoles(board),
      wells: this.calculateWells(board),
      bumpiness: this.calculateBumpiness(board),
      edgePenalty: 0, // No edge penalty in static evaluation
      wellDepth: this.calculateWellDepth(board),
      nearFullRows: this.calculateNearFullRows(board),
      iPieceWaitOpportunity: 0, // No I-piece wait opportunity in static evaluation
      stackHeight: this.calculateStackHeight(board),
    };

    return features;
  }

  /**
   * Apply weights to features to compute a final score (BaseEvaluator interface)
   * @param features - The features to score
   * @returns Weighted evaluation score
   */
  applyWeights(features: FeatureSet): number {
    return this.calculateScore(features as unknown as StackingFeatures);
  }

  /**
   * Get the name of this evaluator (BaseEvaluator interface)
   * @returns Human-readable name of the evaluator
   */
  getName(): string {
    return "StackingEvaluator";
  }

  // WeightedEvaluator interface implementation is already provided by existing methods:
  // - getWeights(): StackingWeights
  // - updateWeights(newWeights: Partial<StackingWeights>): void
  // - resetWeights(): void

  // MoveEvaluator interface implementation is already provided by existing evaluateMove method
}
