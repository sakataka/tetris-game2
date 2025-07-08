import type { BitBoard } from "@/game/ai/core/bitboard";
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
 * Pattern-aware evaluator that extends Dellacherie with advanced pattern recognition
 * Integrates PCO, DT Cannon, and ST-Stack pattern detection and evaluation
 */
export class PatternEvaluator extends DellacherieEvaluator {
  private patternMatcher: PatternMatcher;
  private midGameDetector: MidGamePatternDetector;
  private dynamicWeights: DynamicWeights;
  private config: PatternEvaluatorConfig;
  private pieceQueue: TetrominoTypeName[] = [];
  private currentLines = 0;
  private currentLevel = 1;

  constructor(
    weights?: EvaluationWeights,
    config: PatternEvaluatorConfig = DEFAULT_PATTERN_CONFIG,
  ) {
    super(weights);
    this.config = config;
    this.patternMatcher = new PatternMatcher();
    this.midGameDetector = new MidGamePatternDetector();
    this.dynamicWeights = new DynamicWeights(weights, config.useDynamicWeights);
  }

  /**
   * Update game state information for pattern detection
   */
  updateGameState(pieceQueue: TetrominoTypeName[], lines: number, level: number): void {
    this.pieceQueue = pieceQueue.slice(0, this.config.queueLookahead);
    this.currentLines = lines;
    this.currentLevel = level;
  }

  /**
   * Evaluate board state with pattern detection
   */
  evaluate(board: BitBoard, move: Move): number {
    // Skip pattern evaluation if disabled or no piece queue
    if (!this.config.enablePatterns || this.pieceQueue.length === 0) {
      return super.evaluate(board, move);
    }

    // Get base Dellacherie evaluation
    const baseScore = super.evaluate(board, move);

    // Analyze game situation
    const situation = this.dynamicWeights.analyzeSituation(
      board,
      this.currentLines,
      this.currentLevel,
    );

    // Get current board height
    const currentHeight = this.getMaxHeight(board);

    // Convert board to Uint32Array for pattern matching
    const boardArray = new Uint32Array(20);
    for (let i = 0; i < 20; i++) {
      boardArray[i] = board.getRowBits(i);
    }

    // Apply pattern evaluation
    const patternScore = evaluateWithPatterns(
      boardArray,
      this.pieceQueue,
      situation.gamePhase,
      baseScore,
      currentHeight,
      this.config.patternWeights,
    );

    // Check for mid-game patterns if enabled
    if (this.config.enableMidGamePatterns && situation.gamePhase === "mid") {
      const hasSTOpportunity = this.midGameDetector.detectSTStackOpportunity(
        boardArray,
        this.pieceQueue,
        currentHeight,
      );

      if (hasSTOpportunity) {
        // Add bonus for ST-Stack setup
        return patternScore + this.config.patternWeights.ST_Stack * 0.5;
      }
    }

    return patternScore;
  }

  /**
   * Get maximum height of the board
   */
  private getMaxHeight(board: BitBoard): number {
    for (let row = 19; row >= 0; row--) {
      if (board.getRowBits(row) !== 0) {
        return row + 1;
      }
    }
    return 0;
  }

  /**
   * Get available patterns for current board state
   */
  getAvailablePatterns(board: BitBoard): string[] {
    const boardArray = new Uint32Array(20);
    for (let i = 0; i < 20; i++) {
      boardArray[i] = board.getRowBits(i);
    }
    const currentHeight = this.getMaxHeight(board);

    const matches = this.patternMatcher.detectPatterns(boardArray, this.pieceQueue, currentHeight);

    return matches.map((match) => match.pattern.name);
  }

  /**
   * Get pattern detection info for debugging
   */
  getPatternInfo(board: BitBoard): {
    detectedPatterns: string[];
    gamePhase: GamePhase;
    currentHeight: number;
    queuePreview: TetrominoTypeName[];
  } {
    const situation = this.dynamicWeights.analyzeSituation(
      board,
      this.currentLines,
      this.currentLevel,
    );

    const currentHeight = this.getMaxHeight(board);
    const detectedPatterns = this.getAvailablePatterns(board);

    return {
      detectedPatterns,
      gamePhase: situation.gamePhase,
      currentHeight,
      queuePreview: this.pieceQueue,
    };
  }

  /**
   * Update pattern weights
   */
  setPatternWeights(weights: Partial<PatternWeights>): void {
    this.config.patternWeights = {
      ...this.config.patternWeights,
      ...weights,
    };
  }

  /**
   * Enable or disable pattern detection
   */
  setPatternEnabled(enabled: boolean): void {
    this.config.enablePatterns = enabled;
  }
}
