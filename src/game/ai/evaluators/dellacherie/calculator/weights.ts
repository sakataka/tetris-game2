import type { EvaluationWeights } from "../types";

/**
 * LINE-CLEARING FOCUSED weights: Based on o3 MCP recommendations
 * MASSIVE priority for line clearing above all else
 * Other features reduced to 1/3 - 1/5 of original values
 */
export const DEFAULT_WEIGHTS: EvaluationWeights = {
  landingHeight: -1.5, // Reduced from -4.5 (1/3)
  linesCleared: 1000.0, // MASSIVE increase from 100.0 (10x) - TOP PRIORITY
  potentialLinesFilled: 200.0, // Increased from 80.0 (2.5x) - Secondary priority
  rowTransitions: -1.0, // Reduced from -3.2 (1/3)
  columnTransitions: -3.0, // Reduced from -9.3 (1/3)
  holes: -5.0, // Reduced from -15.0 (1/3)
  wells: -1.0, // Reduced from -3.4 (1/3)
  blocksAboveHoles: -2.5, // Reduced from -8.0 (1/3)
  wellOpen: 0.0, // Ignore well accessibility for simplicity
  escapeRoute: 0.0, // Ignore escape routes for simplicity
  bumpiness: -3.0, // Reduced from -10.0 (1/3)
  maxHeight: -15.0, // Reduced from -50.0 (1/3) - Allow higher stacks for line clearing
  rowFillRatio: 50.0, // Increased from 30.0 - Support horizontal filling
};

/**
 * Weight management class for dynamic evaluation adjustments
 */
export class WeightManager {
  private weights: EvaluationWeights;

  constructor(initialWeights: EvaluationWeights = DEFAULT_WEIGHTS) {
    this.weights = { ...initialWeights };
  }

  /**
   * Update evaluation weights dynamically
   * Allows for adaptive AI behavior based on game state
   *
   * @param newWeights - Updated weight configuration
   */
  updateWeights(newWeights: Partial<EvaluationWeights>): void {
    Object.assign(this.weights, newWeights);
  }

  /**
   * Get current evaluation weights
   * @returns Current weight configuration
   */
  getWeights(): EvaluationWeights {
    return { ...this.weights };
  }

  /**
   * Reset weights to default values
   */
  resetWeights(): void {
    Object.assign(this.weights, DEFAULT_WEIGHTS);
  }
}
