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
 * Balanced phase-based weight configurations
 * Addresses the strategic issue of over-aggressive line clearing
 * that leads to speculative play and early game over
 */
export const PHASE_WEIGHTS: PhaseWeights = {
  /**
   * Early game phase (maxHeight <= 6)
   * Focus: Build stable foundation, modest line clearing
   */
  early: {
    landingHeight: -0.1, // Almost completely ignore height
    linesCleared: 5000.0, // EXTREME priority for line clearing
    rowTransitions: -0.1, // Almost completely ignore surface
    columnTransitions: -0.1, // Almost completely ignore columns
    holes: -500.0, // MASSIVE hole penalty
    wells: 0.0, // Completely ignore wells
    blocksAboveHoles: -500.0, // MASSIVE penalty for deep holes
    wellOpen: 0.0, // Ignore well accessibility
    escapeRoute: 0.0, // Ignore escape routes
    bumpiness: -0.18, // Penalty for surface roughness
  },

  /**
   * Mid game phase (6 < maxHeight <= 12)
   * Focus: Balanced play with increasing aggression
   */
  mid: {
    landingHeight: -0.1, // Almost completely ignore height
    linesCleared: 8000.0, // ULTRA HIGH line clearing priority
    rowTransitions: -0.1, // Almost completely ignore surface
    columnTransitions: -0.1, // Almost completely ignore columns
    holes: -800.0, // MASSIVE hole penalty
    wells: 0.0, // Ignore wells
    blocksAboveHoles: -800.0, // MASSIVE penalty for deep holes
    wellOpen: 0.0, // Ignore well accessibility
    escapeRoute: 0.0, // Ignore escape routes
    bumpiness: -0.18, // Penalty for surface roughness
  },

  /**
   * Late game phase (maxHeight > 12)
   * Focus: Immediate line clearing for survival
   */
  late: {
    landingHeight: -0.1, // Almost completely ignore height
    linesCleared: 15000.0, // ABSOLUTE MAXIMUM line clearing priority
    rowTransitions: -0.1, // Almost completely ignore surface
    columnTransitions: -0.1, // Almost completely ignore columns
    holes: -1500.0, // EXTREME hole penalty
    wells: 0.0, // Ignore wells
    blocksAboveHoles: -1500.0, // EXTREME penalty for deep holes
    wellOpen: 0.0, // Ignore well accessibility
    escapeRoute: 0.0, // Ignore escape routes
    bumpiness: -0.18, // Penalty for surface roughness
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
    linesCleared: weights.linesCleared * (1 + dangerLevel * 0.5),
    landingHeight: weights.landingHeight * (1 + dangerLevel * 0.5),
    holes: weights.holes * 0.8, // Reduce hole penalty in danger
    blocksAboveHoles: weights.blocksAboveHoles * (1 + dangerLevel * 0.3), // Increase deep hole penalty
    wellOpen: weights.wellOpen * (1 + dangerLevel * 0.5), // Increase well accessibility value
    escapeRoute: weights.escapeRoute * (1 + dangerLevel * 0.7), // Significantly increase escape route value
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
