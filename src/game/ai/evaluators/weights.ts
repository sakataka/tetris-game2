import type { BitBoard } from "@/game/ai/core/bitboard";
import type { EvaluationWeights } from "./dellacherie";
import { DEFAULT_WEIGHTS } from "./dellacherie";
import {
  applyDangerAdjustments,
  determineGamePhase,
  getPhaseWeights,
  determineGamePhase as newDetermineGamePhase,
  PHASE_WEIGHTS,
} from "./new-weights";

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
  private useNewWeightSystem: boolean;

  constructor(baseWeights: EvaluationWeights = PHASE_WEIGHTS.early, useNewWeightSystem = true) {
    this.baseWeights = { ...baseWeights };
    this.useNewWeightSystem = useNewWeightSystem;
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
    // Use new balanced weight system if enabled
    if (this.useNewWeightSystem) {
      const phase = newDetermineGamePhase(situation.maxHeight);
      let weights = { ...PHASE_WEIGHTS[phase] };

      // Apply danger adjustments for critical situations
      if (situation.maxHeight > 15) {
        weights = applyDangerAdjustments(weights, situation.maxHeight);
      }

      return weights;
    }

    // Legacy aggressive weight system
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
        // Focus on building solid foundation with ULTRA-aggressive line clearing
        return {
          ...weights,
          landingHeight: weights.landingHeight * 0.5, // Allow much more building
          linesCleared: weights.linesCleared * 2.0, // EXTREME line clearing priority
          rowTransitions: weights.rowTransitions * 0.5, // Allow much more terrain building
          columnTransitions: weights.columnTransitions * 0.7, // Reduced column consistency
          holes: weights.holes * 0.8, // Reduce hole penalty
          blocksAboveHoles: weights.blocksAboveHoles * 0.7, // Reduce deep hole penalty in early game
          wellOpen: weights.wellOpen * 1.2, // Increase well accessibility value
          escapeRoute: weights.escapeRoute * 1.1, // Slight increase in escape route value
        };

      case "mid":
        // Aggressive approach with MAXIMUM emphasis on line clearing
        return {
          ...weights,
          landingHeight: weights.landingHeight * 0.7, // Allow more building
          linesCleared: weights.linesCleared * 2.5, // MAXIMUM priority for line clears
          holes: weights.holes * 0.8, // Reduce hole penalty
          wells: weights.wells * 0.6, // Reduce well penalty
          blocksAboveHoles: weights.blocksAboveHoles * 0.9, // Moderate deep hole penalty
          wellOpen: weights.wellOpen * 1.3, // Increase well accessibility value
          escapeRoute: weights.escapeRoute * 1.2, // Increase escape route value
        };

      case "late":
        // Focus on EXTREME line clearing for survival
        return {
          ...weights,
          landingHeight: weights.landingHeight * 0.8, // Allow building for clearing
          linesCleared: weights.linesCleared * 3.0, // EXTREME line clearing
          holes: weights.holes * 0.9, // Reduce hole penalty
          wells: weights.wells * 0.7, // Reduce well penalty
          blocksAboveHoles: weights.blocksAboveHoles * 1.2, // Increase deep hole penalty
          wellOpen: weights.wellOpen * 1.5, // High value for well accessibility
          escapeRoute: weights.escapeRoute * 1.4, // High value for escape routes
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
    const dangerMultiplier = Math.min(2.5, 1.0 + (situation.maxHeight - 15) * 0.3);

    return {
      ...weights,
      landingHeight: weights.landingHeight * dangerMultiplier, // Desperately stay low
      linesCleared: weights.linesCleared * 5.0, // ABSOLUTE MAXIMUM priority for line clearing
      holes: weights.holes * 0.7, // Reduce hole penalty (clearing is everything)
      wells: weights.wells * 0.8, // Reduce well penalty
      rowTransitions: weights.rowTransitions * 0.3, // Minimal concern for transitions
      columnTransitions: weights.columnTransitions * 0.8, // Allow roughness for clearing
      blocksAboveHoles: weights.blocksAboveHoles * 1.5, // Increase deep hole penalty in danger
      wellOpen: weights.wellOpen * 2.0, // Critical for survival
      escapeRoute: weights.escapeRoute * 2.5, // Extremely important for survival
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
      landingHeight: weights.landingHeight * 0.3, // Allow maximum building
      linesCleared: weights.linesCleared * 2.0, // EXTREME line clearing from start
      rowTransitions: weights.rowTransitions * 0.4, // Allow much more terrain
      columnTransitions: weights.columnTransitions * 0.5, // Much more variance acceptable
      holes: weights.holes * 0.6, // Reduce hole penalty
      wells: weights.wells * 0.4, // Wells very useful for I-pieces
      blocksAboveHoles: weights.blocksAboveHoles * 0.5, // Reduce deep hole penalty early
      wellOpen: weights.wellOpen * 1.3, // Increase well accessibility importance
      escapeRoute: weights.escapeRoute * 1.1, // Slight increase in escape route value
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
      2.0,
      1.2 + (_situation.totalHoles + _situation.roughness) * 0.1,
    );

    return {
      ...weights,
      linesCleared: weights.linesCleared * (problemSeverity * 2.0), // EXTREME clearing to fix problems
      holes: weights.holes * 0.8, // Reduce hole penalty (clearing fixes everything)
      rowTransitions: weights.rowTransitions * 0.8, // Allow roughness for clearing
      columnTransitions: weights.columnTransitions * 0.9, // Allow variance for clearing
      blocksAboveHoles: weights.blocksAboveHoles * 1.3, // Increase deep hole penalty in cleanup
      wellOpen: weights.wellOpen * 1.4, // Increase well accessibility value
      escapeRoute: weights.escapeRoute * 1.2, // Increase escape route value
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

  /**
   * Toggle between new balanced and legacy aggressive weight systems
   * @param useNew - Whether to use the new balanced weight system
   */
  setWeightSystem(useNew: boolean): void {
    this.useNewWeightSystem = useNew;
    if (useNew) {
      // Reset to early phase weights when switching to new system
      this.baseWeights = { ...PHASE_WEIGHTS.early };
    } else {
      // Reset to aggressive defaults when switching to legacy
      this.baseWeights = { ...DEFAULT_WEIGHTS };
    }
  }

  /**
   * Check which weight system is currently active
   * @returns true if using new balanced system, false for legacy
   */
  isUsingNewWeightSystem(): boolean {
    return this.useNewWeightSystem;
  }
}

// Re-export functions from new-weights for external use
export { determineGamePhase, getPhaseWeights } from "./new-weights";
