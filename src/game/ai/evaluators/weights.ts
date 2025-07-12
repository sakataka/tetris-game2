import { getCachedConfiguration } from "@/game/ai/config/weight-loader";
import type { BitBoardData } from "@/game/ai/core/bitboard";
import { getRowBits } from "@/game/ai/core/bitboard";
import type { EvaluationWeights } from "./dellacherie";
import { DEFAULT_WEIGHTS } from "./dellacherie";
import {
  applyDangerAdjustments,
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
  private useExternalWeights: boolean;

  constructor(
    baseWeights: EvaluationWeights = PHASE_WEIGHTS.early,
    useNewWeightSystem = true,
    useExternalWeights = false,
  ) {
    this.baseWeights = { ...baseWeights };
    this.useNewWeightSystem = useNewWeightSystem;
    this.useExternalWeights = useExternalWeights;
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
  analyzeSituation(board: BitBoardData, linesCleared = 0, level = 1): GameSituation {
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
    // Use external weight configuration if enabled
    if (this.useExternalWeights) {
      return this.adjustWeightsFromExternalConfig(situation);
    }

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
   * Adjust weights using external configuration system
   * Loads weights from YAML configuration and applies appropriate adjustments
   *
   * @param situation - Current game situation analysis
   * @returns Adjusted evaluation weights from external configuration
   */
  private adjustWeightsFromExternalConfig(situation: GameSituation): EvaluationWeights {
    // For now, fallback to synchronous behavior with cached weights
    // In a full implementation, this would handle async loading
    try {
      const cached = getCachedConfiguration();

      if (cached) {
        const phase = newDetermineGamePhase(situation.maxHeight);
        let weights = { ...cached.evaluators.phaseWeights[phase] };

        // Apply danger adjustments for critical situations
        if (situation.maxHeight > 15) {
          const dangerAdjustments = cached.adjustments.dangerZone;
          weights = this.applyExternalDangerAdjustments(
            weights,
            dangerAdjustments,
            situation.maxHeight,
          );
        }

        // Apply phase-specific adjustments
        const phaseAdjustments = cached.adjustments.phaseAdjustments[phase];
        weights = this.applyExternalPhaseAdjustments(weights, phaseAdjustments);

        // Apply situational adjustments
        if (situation.gamePhase === "danger" || situation.maxHeight > 15) {
          const survivalAdjustments = cached.adjustments.survival;
          weights = this.applyExternalSurvivalAdjustments(weights, survivalAdjustments);
        }

        if (situation.gamePhase === "early" && situation.maxHeight < 6) {
          const earlyGameAdjustments = cached.adjustments.earlyGame;
          weights = this.applyExternalEarlyGameAdjustments(weights, earlyGameAdjustments);
        }

        if (situation.totalHoles > 3 || situation.roughness > 5) {
          const cleanupAdjustments = cached.adjustments.cleanup;
          weights = this.applyExternalCleanupAdjustments(weights, cleanupAdjustments);
        }

        return weights;
      }
    } catch (error) {
      console.warn("Failed to load external weights, falling back to hardcoded weights:", error);
    }

    // Fallback to hardcoded weights if external config fails
    return this.useNewWeightSystem
      ? this.adjustWeightsFromHardcodedConfig(situation)
      : this.adjustWeightsFromLegacyConfig(situation);
  }

  /**
   * Apply external danger adjustments from configuration
   */
  private applyExternalDangerAdjustments(
    weights: EvaluationWeights,
    adjustments: Record<string, number>,
    maxHeight: number,
  ): EvaluationWeights {
    if (maxHeight <= 15) {
      return weights;
    }

    return {
      ...weights,
      linesCleared: weights.linesCleared * (adjustments.linesCleared || 1.0),
      potentialLinesFilled:
        weights.potentialLinesFilled * (adjustments.potentialLinesFilled || 1.0),
      landingHeight: weights.landingHeight * (adjustments.landingHeight || 1.0),
      holes: weights.holes * (adjustments.holes || 1.0),
      blocksAboveHoles: weights.blocksAboveHoles * (adjustments.blocksAboveHoles || 1.0),
      wellOpen: weights.wellOpen * (adjustments.wellOpen || 1.0),
      escapeRoute: weights.escapeRoute * (adjustments.escapeRoute || 1.0),
    };
  }

  /**
   * Apply external phase adjustments from configuration
   */
  private applyExternalPhaseAdjustments(
    weights: EvaluationWeights,
    adjustments: Record<string, number>,
  ): EvaluationWeights {
    const result = { ...weights };

    for (const [key, multiplier] of Object.entries(adjustments)) {
      if (key in result) {
        result[key as keyof EvaluationWeights] =
          result[key as keyof EvaluationWeights] * multiplier;
      }
    }

    return result;
  }

  /**
   * Apply external survival adjustments from configuration
   */
  private applyExternalSurvivalAdjustments(
    weights: EvaluationWeights,
    adjustments: Record<string, number>,
  ): EvaluationWeights {
    const result = { ...weights };

    for (const [key, multiplier] of Object.entries(adjustments)) {
      if (key in result && key !== "maxMultiplier") {
        result[key as keyof EvaluationWeights] =
          result[key as keyof EvaluationWeights] * multiplier;
      }
    }

    return result;
  }

  /**
   * Apply external early game adjustments from configuration
   */
  private applyExternalEarlyGameAdjustments(
    weights: EvaluationWeights,
    adjustments: Record<string, number>,
  ): EvaluationWeights {
    const result = { ...weights };

    for (const [key, multiplier] of Object.entries(adjustments)) {
      if (key in result) {
        result[key as keyof EvaluationWeights] =
          result[key as keyof EvaluationWeights] * multiplier;
      }
    }

    return result;
  }

  /**
   * Apply external cleanup adjustments from configuration
   */
  private applyExternalCleanupAdjustments(
    weights: EvaluationWeights,
    adjustments: Record<string, number>,
  ): EvaluationWeights {
    const result = { ...weights };

    for (const [key, multiplier] of Object.entries(adjustments)) {
      if (key in result) {
        result[key as keyof EvaluationWeights] =
          result[key as keyof EvaluationWeights] * multiplier;
      }
    }

    return result;
  }

  /**
   * Fallback method for hardcoded new weight system
   */
  private adjustWeightsFromHardcodedConfig(situation: GameSituation): EvaluationWeights {
    const phase = newDetermineGamePhase(situation.maxHeight);
    let weights = { ...PHASE_WEIGHTS[phase] };

    if (situation.maxHeight > 15) {
      weights = applyDangerAdjustments(weights, situation.maxHeight);
    }

    return weights;
  }

  /**
   * Fallback method for legacy weight system
   */
  private adjustWeightsFromLegacyConfig(situation: GameSituation): EvaluationWeights {
    let weights = { ...this.baseWeights };

    weights = this.applyPhaseAdjustments(weights, situation);

    if (situation.gamePhase === "danger" || situation.maxHeight > 15) {
      weights = this.applySurvivalMode(weights, situation);
    }

    if (situation.gamePhase === "early" && situation.maxHeight < 6) {
      weights = this.applyEarlyGameStrategy(weights, situation);
    }

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
        // Focus on building solid foundation with balanced line clearing
        return {
          ...weights,
          landingHeight: weights.landingHeight * 0.9, // Allow more building
          linesCleared: weights.linesCleared * 1.2, // Moderate line clearing priority
          rowTransitions: weights.rowTransitions * 0.9, // Allow more terrain building
          columnTransitions: weights.columnTransitions * 0.9, // Allow more column variance
          holes: weights.holes * 0.9, // Slightly reduce hole penalty
          blocksAboveHoles: weights.blocksAboveHoles * 0.9, // Reduce deep hole penalty in early game
          wellOpen: weights.wellOpen * 1.1, // Increase well accessibility value
          escapeRoute: weights.escapeRoute * 1.1, // Slight increase in escape route value
        };

      case "mid":
        // Balanced approach with increased line clearing focus
        return {
          ...weights,
          landingHeight: weights.landingHeight * 0.95, // Allow slightly more building
          linesCleared: weights.linesCleared * 1.3, // Moderate priority for line clears
          holes: weights.holes * 0.95, // Slightly reduce hole penalty
          wells: weights.wells * 0.9, // Slightly reduce well penalty
          blocksAboveHoles: weights.blocksAboveHoles * 0.95, // Slightly reduce deep hole penalty
          wellOpen: weights.wellOpen * 1.2, // Increase well accessibility value
          escapeRoute: weights.escapeRoute * 1.1, // Increase escape route value
        };

      case "late":
        // Focus on aggressive line clearing for survival
        return {
          ...weights,
          landingHeight: weights.landingHeight * 1.0, // Normal penalty for height
          linesCleared: weights.linesCleared * 1.5, // Increased line clearing priority
          holes: weights.holes * 1.0, // Normal hole penalty
          wells: weights.wells * 1.0, // Normal well penalty
          blocksAboveHoles: weights.blocksAboveHoles * 1.1, // Slightly increase deep hole penalty
          wellOpen: weights.wellOpen * 1.3, // Increase well accessibility value
          escapeRoute: weights.escapeRoute * 1.2, // Increase escape route value
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
   * Conservative multipliers prevent extreme behavior (≤1.8x total)
   */
  private applySurvivalMode(
    weights: EvaluationWeights,
    situation: GameSituation,
  ): EvaluationWeights {
    const dangerMultiplier = Math.min(1.3, 1.0 + (situation.maxHeight - 15) * 0.08);

    return {
      ...weights,
      landingHeight: weights.landingHeight * dangerMultiplier, // Moderate priority to stay low
      linesCleared: weights.linesCleared * 1.6, // Moderate increase for line clearing
      holes: weights.holes * 1.15, // Slightly increase hole penalty
      wells: weights.wells * 1.1, // Slightly increase well penalty
      rowTransitions: weights.rowTransitions * 1.15, // Increase surface concern
      columnTransitions: weights.columnTransitions * 1.1, // Increase column concern
      blocksAboveHoles: weights.blocksAboveHoles * 1.2, // Increase deep hole penalty
      wellOpen: weights.wellOpen * 1.4, // Increase well accessibility value
      escapeRoute: weights.escapeRoute * 1.6, // Increase escape route value
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
      landingHeight: weights.landingHeight * 0.85, // Allow more building
      linesCleared: weights.linesCleared * 1.4, // Moderate increase for line clearing
      rowTransitions: weights.rowTransitions * 0.85, // Allow more terrain variance
      columnTransitions: weights.columnTransitions * 0.85, // Allow more column variance
      holes: weights.holes * 0.85, // Reduce hole penalty slightly
      wells: weights.wells * 0.75, // Wells useful for I-pieces
      blocksAboveHoles: weights.blocksAboveHoles * 0.85, // Reduce deep hole penalty early
      wellOpen: weights.wellOpen * 1.15, // Increase well accessibility importance
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
    return {
      ...weights,
      linesCleared: weights.linesCleared * 1.2, // Moderate increase for clearing
      holes: weights.holes * 1.1, // Slightly increase hole penalty
      rowTransitions: weights.rowTransitions * 1.0, // Normal surface concerns
      columnTransitions: weights.columnTransitions * 1.0, // Normal column concerns
      blocksAboveHoles: weights.blocksAboveHoles * 1.2, // Increase deep hole penalty in cleanup
      wellOpen: weights.wellOpen * 1.2, // Increase well accessibility value
      escapeRoute: weights.escapeRoute * 1.1, // Slight increase escape route value
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
  private getColumnHeights(board: BitBoardData): number[] {
    const heights: number[] = [];

    for (let x = 0; x < 10; x++) {
      let height = 0;
      for (let y = 0; y < 20; y++) {
        if ((getRowBits(board, y) >> x) & 1) {
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
  private countTotalHoles(board: BitBoardData): number {
    let holes = 0;

    for (let x = 0; x < 10; x++) {
      let blockFound = false;
      for (let y = 0; y < 20; y++) {
        const bit = (getRowBits(board, y) >> x) & 1;
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
  private countDeepWells(board: BitBoardData): number {
    let deepWells = 0;

    for (let x = 0; x < 10; x++) {
      let wellDepth = 0;
      let inWell = false;

      for (let y = 19; y >= 0; y--) {
        const current = (getRowBits(board, y) >> x) & 1;
        const left = x > 0 ? (getRowBits(board, y) >> (x - 1)) & 1 : 1;
        const right = x < 9 ? (getRowBits(board, y) >> (x + 1)) & 1 : 1;

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

  /**
   * Enable or disable external weight loading from YAML configuration
   * @param useExternal - Whether to use external YAML configuration
   */
  setExternalWeightSystem(useExternal: boolean): void {
    this.useExternalWeights = useExternal;

    // Pre-load configuration if enabling external weights
    if (useExternal) {
      this.preloadExternalConfiguration();
    }
  }

  /**
   * Check if external weight system is enabled
   * @returns true if using external YAML configuration
   */
  isUsingExternalWeights(): boolean {
    return this.useExternalWeights;
  }

  /**
   * Pre-load external configuration for performance
   */
  private async preloadExternalConfiguration(): Promise<void> {
    // External weights would be loaded if configuration system was implemented
    // For now, this is a no-op
  }
}

// Re-export functions from new-weights for external use
export { determineGamePhase, getPhaseWeights } from "./new-weights";
