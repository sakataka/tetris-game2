import type { EvaluationWeights } from "./dellacherie";

/**
 * Game phase types for strategic weight adjustment
 */
export type GamePhase = "early" | "mid" | "late";

/**
 * Phase-specific weight configurations
 * Designed to provide balanced gameplay progression
 */
export interface PhaseWeights {
  early: EvaluationWeights;
  mid: EvaluationWeights;
  late: EvaluationWeights;
}

/**
 * LINE-CLEARING PRIORITY phase-based weight configurations
 * Based on O3 MCP recommendations: MASSIVE line clearing priority above all else
 * Line clearing weight = 1000 (10x increase) across all phases
 * Other features reduced to 1/3 - 1/5 of original values
 */
export const PHASE_WEIGHTS: PhaseWeights = {
  /**
   * Early game phase (maxHeight <= 6)
   * Focus: AGGRESSIVE line clearing from the start
   */
  early: {
    landingHeight: -1.3, // Reduced from -3.8 (1/3)
    linesCleared: 1000.0, // MASSIVE increase from 100.0 (10x) - TOP PRIORITY
    potentialLinesFilled: 200.0, // Increased from 80.0 (2.5x) - Secondary priority
    rowTransitions: -1.0, // Reduced from -2.8 (1/3)
    columnTransitions: -2.7, // Reduced from -8.0 (1/3)
    holes: -5.0, // Reduced from -15.0 (1/3)
    wells: -1.0, // Reduced from -2.8 (1/3)
    blocksAboveHoles: -2.7, // Reduced from -8.0 (1/3)
    wellOpen: 0.0, // Ignore well accessibility
    escapeRoute: 0.0, // Ignore escape routes
    bumpiness: -0.7, // Reduced from -2.2 (1/3)
    maxHeight: -10.0, // Reduced from -30.0 (1/3) - Allow higher stacks for line clearing
    rowFillRatio: 50.0, // Increased from 20.0 (2.5x) - Support horizontal filling
  },

  /**
   * Mid game phase (6 < maxHeight <= 12)
   * Focus: CONTINUED aggressive line clearing
   */
  mid: {
    landingHeight: -1.4, // Reduced from -4.2 (1/3)
    linesCleared: 1000.0, // MASSIVE increase from 120.0 (8.3x) - TOP PRIORITY
    potentialLinesFilled: 250.0, // Increased from 100.0 (2.5x) - Secondary priority
    rowTransitions: -1.0, // Reduced from -3.0 (1/3)
    columnTransitions: -3.0, // Reduced from -8.8 (1/3)
    holes: -6.0, // Reduced from -18.0 (1/3)
    wells: -1.1, // Reduced from -3.2 (1/3)
    blocksAboveHoles: -3.3, // Reduced from -10.0 (1/3)
    wellOpen: 0.0, // Ignore well accessibility
    escapeRoute: 0.0, // Ignore escape routes
    bumpiness: -0.8, // Reduced from -2.4 (1/3)
    maxHeight: -13.3, // Reduced from -40.0 (1/3) - Allow higher stacks for line clearing
    rowFillRatio: 60.0, // Increased from 25.0 (2.4x) - Support horizontal filling
  },

  /**
   * Late game phase (maxHeight > 12)
   * Focus: MAXIMUM line clearing priority for survival
   */
  late: {
    landingHeight: -1.7, // Reduced from -5.0 (1/3)
    linesCleared: 1000.0, // MASSIVE increase from 150.0 (6.7x) - TOP PRIORITY
    potentialLinesFilled: 300.0, // Increased from 120.0 (2.5x) - Secondary priority
    rowTransitions: -1.2, // Reduced from -3.5 (1/3)
    columnTransitions: -3.3, // Reduced from -10.0 (1/3)
    holes: -6.7, // Reduced from -20.0 (1/3)
    wells: -1.3, // Reduced from -3.8 (1/3)
    blocksAboveHoles: -4.0, // Reduced from -12.0 (1/3)
    wellOpen: 0.0, // Ignore well accessibility
    escapeRoute: 0.0, // Ignore escape routes
    bumpiness: -0.9, // Reduced from -2.8 (1/3)
    maxHeight: -20.0, // Reduced from -60.0 (1/3) - Allow higher stacks for line clearing
    rowFillRatio: 80.0, // Increased from 40.0 (2x) - Support horizontal filling
  },
};

/**
 * Determine game phase based on maximum board height
 * Simple and predictable phase detection
 *
 * @param maxHeight - Maximum height of any column
 * @returns Current game phase
 */
export function determineGamePhase(maxHeight: number): GamePhase {
  if (maxHeight <= 6) {
    return "early";
  }
  if (maxHeight <= 12) {
    return "mid";
  }
  return "late";
}

/**
 * Get phase-appropriate weights
 *
 * @param phase - Current game phase
 * @returns Evaluation weights for the phase
 */
export function getPhaseWeights(phase: GamePhase): EvaluationWeights {
  return { ...PHASE_WEIGHTS[phase] };
}

/**
 * Apply danger zone adjustments to weights
 * Used when board height becomes critical (>15)
 * Conservative multipliers prevent extreme behavior (≤1.8x total)
 *
 * @param weights - Base weights to modify
 * @param maxHeight - Current maximum height
 * @returns Modified weights for danger situation
 */
export function applyDangerAdjustments(
  weights: EvaluationWeights,
  maxHeight: number,
): EvaluationWeights {
  if (maxHeight <= 15) {
    return weights;
  }

  const dangerLevel = Math.min(1.0, (maxHeight - 15) / 5); // 0-1 scale

  return {
    ...weights,
    linesCleared: weights.linesCleared * (1 + dangerLevel * 0.4), // Max 1.4x
    potentialLinesFilled: weights.potentialLinesFilled * (1 + dangerLevel * 0.3), // Max 1.3x
    landingHeight: weights.landingHeight * (1 + dangerLevel * 0.3), // Max 1.3x
    holes: weights.holes * (1 - dangerLevel * 0.1), // Slight reduction in danger
    blocksAboveHoles: weights.blocksAboveHoles * (1 + dangerLevel * 0.2), // Max 1.2x
    wellOpen: weights.wellOpen * (1 + dangerLevel * 0.3), // Max 1.3x
    escapeRoute: weights.escapeRoute * (1 + dangerLevel * 0.5), // Max 1.5x
  };
}

/**
 * Progressive weight system that avoids speculative play
 * Key differences from current aggressive system:
 *
 * 1. Lower base line clearing rewards (3.0 -> 8.0 -> 20.0)
 *    vs current (100.0 base * 2-5x multiplier)
 *
 * 2. Maintains focus on board quality throughout all phases
 *
 * 3. Gradual progression prevents sudden strategy shifts
 *
 * 4. Danger adjustments are modest (+50%) vs extreme (5x)
 *
 * This should resolve the "Lines: 0" issue by encouraging
 * realistic line clearing opportunities rather than
 * speculative multi-line setups that never materialize.
 */
