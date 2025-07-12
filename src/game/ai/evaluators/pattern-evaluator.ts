import type { BitBoardData } from "@/game/ai/core/bitboard";
import { getRowBits } from "@/game/ai/core/bitboard";
import type { Move } from "@/game/ai/core/move-generator";
import type { TetrominoTypeName } from "@/types/game";
import { DellacherieEvaluator, type EvaluationWeights } from "./dellacherie";
import {
  DEFAULT_PATTERN_WEIGHTS,
  evaluateWithPatterns,
  type GamePhase,
  MidGamePatternDetector,
  PatternMatcher,
  type PatternWeights,
} from "./patterns";
import { DynamicWeights } from "./weights";

/**
 * Configuration for pattern-aware evaluator
 */
export interface PatternEvaluatorConfig {
  /** Enable pattern detection and evaluation */
  enablePatterns: boolean;
  /** Pattern weights configuration */
  patternWeights: PatternWeights;
  /** Enable dynamic weight adjustment */
  useDynamicWeights: boolean;
  /** Piece queue lookahead for pattern detection */
  queueLookahead: number;
  /** Enable mid-game pattern detection */
  enableMidGamePatterns: boolean;
}

/**
 * Default configuration for pattern evaluator
 */
export const DEFAULT_PATTERN_CONFIG: PatternEvaluatorConfig = {
  enablePatterns: true,
  patternWeights: DEFAULT_PATTERN_WEIGHTS,
  useDynamicWeights: true,
  queueLookahead: 7,
  enableMidGamePatterns: true,
};

/**
 * Pattern evaluator state containing all dependencies and configuration
 */
export interface PatternEvaluatorState {
  baseEvaluator: DellacherieEvaluator;
  patternMatcher: PatternMatcher;
  midGameDetector: MidGamePatternDetector;
  dynamicWeights: DynamicWeights;
  config: PatternEvaluatorConfig;
  pieceQueue: TetrominoTypeName[];
  currentLines: number;
  currentLevel: number;
}

/**
 * Factory function to create pattern evaluator state
 */
export function createPatternEvaluatorState(
  weights?: EvaluationWeights,
  config: PatternEvaluatorConfig = DEFAULT_PATTERN_CONFIG,
): PatternEvaluatorState {
  return {
    baseEvaluator: new DellacherieEvaluator(weights),
    patternMatcher: new PatternMatcher(),
    midGameDetector: new MidGamePatternDetector(),
    dynamicWeights: new DynamicWeights(weights, config.useDynamicWeights),
    config,
    pieceQueue: [],
    currentLines: 0,
    currentLevel: 1,
  };
}

/**
 * Update game state information for pattern detection
 */
export function updatePatternEvaluatorGameState(
  state: PatternEvaluatorState,
  pieceQueue: TetrominoTypeName[],
  lines: number,
  level: number,
): PatternEvaluatorState {
  return {
    ...state,
    pieceQueue: pieceQueue.slice(0, state.config.queueLookahead),
    currentLines: lines,
    currentLevel: level,
  };
}

/**
 * Evaluate board state with pattern detection
 */
export function evaluatePatternMove(
  state: PatternEvaluatorState,
  board: BitBoardData,
  move: Move,
): number {
  // Skip pattern evaluation if disabled or no piece queue
  if (!state.config.enablePatterns || state.pieceQueue.length === 0) {
    return state.baseEvaluator.evaluateMove(board, move);
  }

  // Get base Dellacherie evaluation
  const baseScore = state.baseEvaluator.evaluateMove(board, move);

  // Analyze game situation
  const situation = state.dynamicWeights.analyzeSituation(
    board,
    state.currentLines,
    state.currentLevel,
  );

  // Get current board height
  const currentHeight = getPatternMaxHeight(board);

  // Convert board to Uint32Array for pattern matching
  const boardArray = new Uint32Array(20);
  for (let i = 0; i < 20; i++) {
    boardArray[i] = getRowBits(board, i);
  }

  // Apply pattern evaluation
  const patternScore = evaluateWithPatterns(
    boardArray,
    state.pieceQueue,
    situation.gamePhase,
    baseScore,
    currentHeight,
    state.config.patternWeights,
  );

  // Check for mid-game patterns if enabled
  if (state.config.enableMidGamePatterns && situation.gamePhase === "mid") {
    const hasSTOpportunity = state.midGameDetector.detectSTStackOpportunity(
      boardArray,
      state.pieceQueue,
      currentHeight,
    );

    if (hasSTOpportunity) {
      // Add bonus for ST-Stack setup
      return patternScore + state.config.patternWeights.ST_Stack * 0.5;
    }
  }

  return patternScore;
}

/**
 * Get maximum height of the board
 */
function getPatternMaxHeight(board: BitBoardData): number {
  for (let row = 19; row >= 0; row--) {
    if (getRowBits(board, row) !== 0) {
      return row + 1;
    }
  }
  return 0;
}

/**
 * Get available patterns for current board state
 */
export function getAvailablePatterns(state: PatternEvaluatorState, board: BitBoardData): string[] {
  const boardArray = new Uint32Array(20);
  for (let i = 0; i < 20; i++) {
    boardArray[i] = getRowBits(board, i);
  }
  const currentHeight = getPatternMaxHeight(board);

  const matches = state.patternMatcher.detectPatterns(boardArray, state.pieceQueue, currentHeight);

  return matches.map((match) => match.pattern.name);
}

/**
 * Get pattern detection info for debugging
 */
export function getPatternInfo(
  state: PatternEvaluatorState,
  board: BitBoardData,
): {
  detectedPatterns: string[];
  gamePhase: GamePhase;
  currentHeight: number;
  queuePreview: TetrominoTypeName[];
} {
  const situation = state.dynamicWeights.analyzeSituation(
    board,
    state.currentLines,
    state.currentLevel,
  );

  const currentHeight = getPatternMaxHeight(board);
  const detectedPatterns = getAvailablePatterns(state, board);

  return {
    detectedPatterns,
    gamePhase: situation.gamePhase,
    currentHeight,
    queuePreview: state.pieceQueue,
  };
}

/**
 * Update pattern weights
 */
export function setPatternWeights(
  state: PatternEvaluatorState,
  weights: Partial<PatternWeights>,
): PatternEvaluatorState {
  return {
    ...state,
    config: {
      ...state.config,
      patternWeights: {
        ...state.config.patternWeights,
        ...weights,
      },
    },
  };
}

/**
 * Enable or disable pattern detection
 */
export function setPatternEnabled(
  state: PatternEvaluatorState,
  enabled: boolean,
): PatternEvaluatorState {
  return {
    ...state,
    config: {
      ...state.config,
      enablePatterns: enabled,
    },
  };
}

/**
 * Get the name of this evaluator (BaseEvaluator interface)
 * @returns Human-readable name of the evaluator
 */
export function getPatternEvaluatorName(): string {
  return "PatternEvaluator";
}

/**
 * Legacy class wrapper for backward compatibility
 * @deprecated Use functional API instead
 */
export class PatternEvaluator extends DellacherieEvaluator {
  private state: PatternEvaluatorState;

  constructor(
    weights?: EvaluationWeights,
    config: PatternEvaluatorConfig = DEFAULT_PATTERN_CONFIG,
  ) {
    super(weights);
    this.state = createPatternEvaluatorState(weights, config);
  }

  updateGameState(pieceQueue: TetrominoTypeName[], lines: number, level: number): void {
    this.state = updatePatternEvaluatorGameState(this.state, pieceQueue, lines, level);
  }

  evaluateMove(board: BitBoardData, move: Move): number {
    return evaluatePatternMove(this.state, board, move);
  }

  getAvailablePatterns(board: BitBoardData): string[] {
    return getAvailablePatterns(this.state, board);
  }

  getPatternInfo(board: BitBoardData): {
    detectedPatterns: string[];
    gamePhase: GamePhase;
    currentHeight: number;
    queuePreview: TetrominoTypeName[];
  } {
    return getPatternInfo(this.state, board);
  }

  setPatternWeights(weights: Partial<PatternWeights>): void {
    this.state = setPatternWeights(this.state, weights);
  }

  setPatternEnabled(enabled: boolean): void {
    this.state = setPatternEnabled(this.state, enabled);
  }

  getName(): string {
    return getPatternEvaluatorName();
  }
}
