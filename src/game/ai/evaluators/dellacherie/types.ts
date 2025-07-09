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
