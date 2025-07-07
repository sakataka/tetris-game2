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
    landingHeight: -4.5, // Moderate penalty for height
    linesCleared: 3.0, // Conservative line clearing reward
    rowTransitions: -3.2, // Maintain clean horizontal structure
    columnTransitions: -9.3, // Strong column consistency
    holes: -10.0, // High penalty for holes
    wells: 2.0, // Small reward for I-piece preparation
  },

  /**
   * Mid game phase (6 < maxHeight <= 12)
   * Focus: Balanced play with increasing aggression
   */
  mid: {
    landingHeight: -3.5, // Reduced height penalty
    linesCleared: 8.0, // Moderate line clearing priority
    rowTransitions: -2.0, // More flexibility allowed
    columnTransitions: -7.0, // Reduced column strictness
    holes: -8.0, // Still significant hole penalty
    wells: 4.0, // Increased well value
  },

  /**
   * Late game phase (maxHeight > 12)
   * Focus: Immediate line clearing for survival
   */
  late: {
    landingHeight: -2.0, // Minimal height concern
    linesCleared: 20.0, // High priority for immediate clearing
    rowTransitions: -1.0, // Minimal transition penalty
    columnTransitions: -4.0, // Accept rougher terrain
    holes: -6.0, // Reduced hole penalty
    wells: 1.0, // Wells less important
  },
};

/**
 * Danger zone adjustments (maxHeight > 15)
 * Emergency modifications applied on top of phase weights
 */
export interface DangerAdjustments {
  /** Multiplier for line clearing reward */
  linesClearedMultiplier: number;
  /** Additional penalty for maximum height */
  maxHeightPenalty: number;
  /** Bonus for moves that immediately reduce height */
  immediateEscape: number;
}

export const DANGER_ADJUSTMENTS: DangerAdjustments = {
  linesClearedMultiplier: 1.5, // 50% bonus for line clearing
  maxHeightPenalty: -50.0, // Severe penalty for high placement
  immediateEscape: 15.0, // Reward for height reduction
};

/**
 * Special situation modifiers
 * Applied based on specific board conditions
 */
export interface SituationModifiers {
  /** When T-Spin setup is detected */
  tSpinPotential: number;
  /** When perfect clear opportunity exists */
  perfectClearBonus: number;
  /** Multiple lines ready to clear */
  multiLineOpportunity: number;
}

export const SITUATION_MODIFIERS: SituationModifiers = {
  tSpinPotential: 5.0, // Bonus for T-Spin setups (mid/late only)
  perfectClearBonus: 30.0, // Significant bonus for PC opportunity
  multiLineOpportunity: 10.0, // Bonus when 2+ lines can be cleared
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
