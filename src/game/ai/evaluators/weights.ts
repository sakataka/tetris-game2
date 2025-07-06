import type { BitBoard } from "@/game/ai/core/bitboard";
import type { EvaluationWeights } from "./dellacherie";
import { DEFAULT_WEIGHTS } from "./dellacherie";

/**
 * Game situation analysis for dynamic weight adjustment
 * Categorizes current board state to inform AI strategy
 */
export interface GameSituation {
  /** Maximum height of any column on the board */
  maxHeight: number;

  /** Total number of holes in the board */
  totalHoles: number;

  /** Current game phase based on progress */
  gamePhase: "early" | "mid" | "late" | "danger";

  /** Number of lines cleared so far (optional) */
  linesCleared?: number;

  /** Current level (affects drop speed) */
  level?: number;

  /** Board roughness (height variance between columns) */
  roughness: number;

  /** Number of wells (deeper than 2 cells) */
  deepWells: number;
}

/**
 * Dynamic weight adjustment system for Dellacherie evaluator
 * Adapts AI strategy based on current game situation
 */
export class DynamicWeights {
  private baseWeights: EvaluationWeights;

  constructor(baseWeights: EvaluationWeights = DEFAULT_WEIGHTS) {
    this.baseWeights = { ...baseWeights };
  }

  /**
   * Analyze current board state and return situation assessment
   * Used to determine appropriate weight adjustments
   *
   * @param board - Current board state
   * @param linesCleared - Total lines cleared so far
   * @param level - Current game level
   * @returns Detailed game situation analysis
   */
  analyzeSituation(board: BitBoard, linesCleared = 0, level = 1): GameSituation {
    const heights = this.getColumnHeights(board);
    const maxHeight = Math.max(...heights);
    const totalHoles = this.countTotalHoles(board);
    const roughness = this.calculateRoughness(heights);
    const deepWells = this.countDeepWells(board);

    const gamePhase = this.determineGamePhase(maxHeight, linesCleared, level);

    return {
      maxHeight,
      totalHoles,
      gamePhase,
      linesCleared,
      level,
      roughness,
      deepWells,
    };
  }

  /**
   * Adjust evaluation weights based on current game situation
   * Returns modified weights optimized for the current state
   *
   * @param situation - Current game situation analysis
   * @returns Adjusted evaluation weights
   */
  adjustWeights(situation: GameSituation): EvaluationWeights {
    let weights = { ...this.baseWeights };

    // Apply phase-specific adjustments
    weights = this.applyPhaseAdjustments(weights, situation);

    // Apply danger-specific adjustments
    if (situation.gamePhase === "danger" || situation.maxHeight > 15) {
      weights = this.applySurvivalMode(weights, situation);
    }

    // Apply early game optimizations
    if (situation.gamePhase === "early" && situation.maxHeight < 6) {
      weights = this.applyEarlyGameStrategy(weights, situation);
    }

    // Handle board quality issues
    if (situation.totalHoles > 3 || situation.roughness > 5) {
      weights = this.applyCleanupMode(weights, situation);
    }

    return weights;
  }

  /**
   * Apply phase-specific weight adjustments
   * Modifies strategy based on game progression
   */
  private applyPhaseAdjustments(
    weights: EvaluationWeights,
    situation: GameSituation,
  ): EvaluationWeights {
    switch (situation.gamePhase) {
      case "early":
        // Focus on building solid foundation with line clearing priority
        return {
          ...weights,
          landingHeight: weights.landingHeight * 0.9, // Still stay relatively low
          linesCleared: weights.linesCleared * 1.2, // Encourage early line clears for practice
          rowTransitions: weights.rowTransitions * 0.9, // Allow some terrain building
          columnTransitions: weights.columnTransitions * 1.1, // Prefer smoother columns
          holes: weights.holes * 1.2, // Strongly avoid holes from start
        };

      case "mid":
        // Balanced approach with slight emphasis on efficiency
        return {
          ...weights,
          linesCleared: weights.linesCleared * 1.1, // Start prioritizing clears
          holes: weights.holes * 1.1, // Avoid creating problems
        };

      case "late":
        // Focus on survival and efficiency
        return {
          ...weights,
          landingHeight: weights.landingHeight * 1.2, // Stay low
          linesCleared: weights.linesCleared * 1.3, // Clear aggressively
          holes: weights.holes * 1.2, // Avoid holes
        };

      case "danger":
        // Emergency survival mode (handled separately)
        return weights;

      default:
        return weights;
    }
  }

  /**
   * Apply survival mode adjustments for dangerous situations
   * Prioritizes immediate survival over long-term optimization
   */
  private applySurvivalMode(
    weights: EvaluationWeights,
    situation: GameSituation,
  ): EvaluationWeights {
    const dangerMultiplier = Math.min(2.0, 1.0 + (situation.maxHeight - 15) * 0.2);

    return {
      ...weights,
      landingHeight: weights.landingHeight * dangerMultiplier, // Desperately stay low
      linesCleared: weights.linesCleared * 2.0, // Clear anything possible
      holes: weights.holes * dangerMultiplier, // Absolutely avoid holes
      wells: weights.wells * dangerMultiplier, // Avoid deep wells
      rowTransitions: weights.rowTransitions * 0.8, // Less concerned about transitions
      columnTransitions: weights.columnTransitions * 1.3, // Keep columns smooth for clearing
    };
  }

  /**
   * Apply early game strategy adjustments
   * Focuses on building good foundation and setting up advanced techniques
   */
  private applyEarlyGameStrategy(
    weights: EvaluationWeights,
    _situation: GameSituation,
  ): EvaluationWeights {
    return {
      ...weights,
      landingHeight: weights.landingHeight * 0.6, // Allow building height
      linesCleared: weights.linesCleared * 0.7, // Don't rush single line clears
      rowTransitions: weights.rowTransitions * 0.8, // Allow terrain for T-spins
      columnTransitions: weights.columnTransitions * 0.9, // Some variance acceptable
      holes: weights.holes * 1.3, // Still avoid holes but less critical
      wells: weights.wells * 0.8, // Wells can be useful for I-pieces
    };
  }

  /**
   * Apply cleanup mode adjustments for problematic board states
   * Focuses on fixing existing issues before they become critical
   */
  private applyCleanupMode(
    weights: EvaluationWeights,
    _situation: GameSituation,
  ): EvaluationWeights {
    const problemSeverity = Math.min(
      1.5,
      1.0 + (_situation.totalHoles + _situation.roughness) * 0.1,
    );

    return {
      ...weights,
      linesCleared: weights.linesCleared * problemSeverity, // Clear to fix problems
      holes: weights.holes * problemSeverity, // Don't make it worse
      rowTransitions: weights.rowTransitions * 1.2, // Smooth out the board
      columnTransitions: weights.columnTransitions * 1.2, // Reduce variance
    };
  }

  /**
   * Determine current game phase based on board state and progress
   */
  private determineGamePhase(
    maxHeight: number,
    linesCleared: number,
    level: number,
  ): GameSituation["gamePhase"] {
    // Danger zone check first
    if (maxHeight > 16) {
      return "danger";
    }

    // Phase determination based on lines cleared and level
    if (linesCleared < 10 && level <= 2) {
      return "early";
    }

    if (linesCleared < 40 && level <= 5) {
      return "mid";
    }

    return "late";
  }

  /**
   * Get height of each column on the board
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
   * Count total number of holes in the board
   */
  private countTotalHoles(board: BitBoard): number {
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
   * Calculate board roughness (height variance between adjacent columns)
   */
  private calculateRoughness(heights: number[]): number {
    let roughness = 0;

    for (let i = 0; i < heights.length - 1; i++) {
      roughness += Math.abs(heights[i] - heights[i + 1]);
    }

    return roughness;
  }

  /**
   * Count wells deeper than 2 cells
   */
  private countDeepWells(board: BitBoard): number {
    let deepWells = 0;

    for (let x = 0; x < 10; x++) {
      let wellDepth = 0;
      let inWell = false;

      for (let y = 19; y >= 0; y--) {
        const current = (board.getRowBits(y) >> x) & 1;
        const left = x > 0 ? (board.getRowBits(y) >> (x - 1)) & 1 : 1;
        const right = x < 9 ? (board.getRowBits(y) >> (x + 1)) & 1 : 1;

        if (current === 0 && left === 1 && right === 1) {
          if (!inWell) {
            inWell = true;
            wellDepth = 1;
          } else {
            wellDepth++;
          }
        } else {
          if (inWell && wellDepth > 2) {
            deepWells++;
          }
          inWell = false;
          wellDepth = 0;
        }
      }

      if (inWell && wellDepth > 2) {
        deepWells++;
      }
    }

    return deepWells;
  }

  /**
   * Update base weights used for adjustments
   * @param newBaseWeights - New baseline weights
   */
  updateBaseWeights(newBaseWeights: EvaluationWeights): void {
    this.baseWeights = { ...newBaseWeights };
  }

  /**
   * Get current base weights
   * @returns Copy of current base weights
   */
  getBaseWeights(): EvaluationWeights {
    return { ...this.baseWeights };
  }
}

/**
 * Predefined weight configurations for common scenarios
 * These can be used directly or as starting points for custom adjustments
 */
export const WEIGHT_PRESETS = {
  /** Conservative play focused on survival */
  SURVIVAL: {
    landingHeight: -8.0,
    linesCleared: 5.0,
    rowTransitions: -2.5,
    columnTransitions: -12.0,
    holes: -15.0,
    wells: -8.0,
  } as EvaluationWeights,

  /** Aggressive play focused on high scores */
  AGGRESSIVE: {
    landingHeight: -2.0,
    linesCleared: 6.0,
    rowTransitions: -4.0,
    columnTransitions: -6.0,
    holes: -5.0,
    wells: -2.0,
  } as EvaluationWeights,

  /** Balanced play for general use */
  BALANCED: DEFAULT_WEIGHTS,

  /** T-Spin focused strategy */
  TSPIN_SETUP: {
    landingHeight: -3.0,
    linesCleared: 2.0,
    rowTransitions: -2.0,
    columnTransitions: -5.0,
    holes: -8.0,
    wells: -2.0,
  } as EvaluationWeights,

  /** Early game foundation building */
  FOUNDATION: {
    landingHeight: -2.0,
    linesCleared: 1.0,
    rowTransitions: -2.0,
    columnTransitions: -8.0,
    holes: -10.0,
    wells: -1.0,
  } as EvaluationWeights,
} as const;

/**
 * Create a dynamic weights instance with a specific preset
 * @param preset - Preset configuration to use as base
 * @returns New DynamicWeights instance
 */
export function createDynamicWeights(
  preset: keyof typeof WEIGHT_PRESETS = "BALANCED",
): DynamicWeights {
  return new DynamicWeights(WEIGHT_PRESETS[preset]);
}
