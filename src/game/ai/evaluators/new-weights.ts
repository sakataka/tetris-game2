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
 * OPTIMIZED phase-based weight configurations
 * Based on El-Tetris research with realistic ratios for consistent gameplay
 * Line clearing ≈ 0.6~1.4 × |holes penalty| across all phases
 */
export const PHASE_WEIGHTS: PhaseWeights = {
  /**
   * Early game phase (maxHeight <= 6)
   * Focus: Build stable foundation, opportunistic line clearing
   */
  early: {
    landingHeight: -3.8, // Moderate penalty for height (El-Tetris scale)
    linesCleared: 20.0, // Balanced reward for line clearing
    rowTransitions: -2.8, // Moderate penalty for surface roughness
    columnTransitions: -8.0, // Strong penalty for column transitions
    holes: -30.0, // Strong penalty for holes
    wells: -2.8, // Moderate penalty for wells
    blocksAboveHoles: -12.0, // Strong penalty for deep holes
    wellOpen: 0.0, // Ignore well accessibility
    escapeRoute: 0.0, // Ignore escape routes
    bumpiness: -2.2, // Moderate penalty for surface roughness
  },

  /**
   * Mid game phase (6 < maxHeight <= 12)
   * Focus: Balanced play with increasing line clearing focus
   */
  mid: {
    landingHeight: -4.2, // Moderate penalty for height
    linesCleared: 35.0, // Strong reward for line clearing
    rowTransitions: -3.0, // Moderate penalty for surface roughness
    columnTransitions: -8.8, // Strong penalty for column transitions
    holes: -35.0, // Strong penalty for holes
    wells: -3.2, // Moderate penalty for wells
    blocksAboveHoles: -14.0, // Strong penalty for deep holes
    wellOpen: 0.0, // Ignore well accessibility
    escapeRoute: 0.0, // Ignore escape routes
    bumpiness: -2.4, // Moderate penalty for surface roughness
  },

  /**
   * Late game phase (maxHeight > 12)
   * Focus: Aggressive line clearing for survival
   */
  late: {
    landingHeight: -5.0, // Higher penalty for height
    linesCleared: 50.0, // Very strong reward for line clearing
    rowTransitions: -3.5, // Higher penalty for surface roughness
    columnTransitions: -10.0, // Higher penalty for column transitions
    holes: -40.0, // Very strong penalty for holes
    wells: -3.8, // Moderate penalty for wells
    blocksAboveHoles: -18.0, // Very strong penalty for deep holes
    wellOpen: 0.0, // Ignore well accessibility
    escapeRoute: 0.0, // Ignore escape routes
    bumpiness: -2.8, // Higher penalty for surface roughness
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
