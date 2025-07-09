import { getWeightLoader, loadDellacherieWeights } from "@/game/ai/config/weight-loader";
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
  private useExternalWeights: boolean;

  constructor(initialWeights: EvaluationWeights = DEFAULT_WEIGHTS, useExternalWeights = false) {
    this.weights = { ...initialWeights };
    this.useExternalWeights = useExternalWeights;
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
    if (this.useExternalWeights) {
      return this.getExternalWeights();
    }
    return { ...this.weights };
  }

  /**
   * Get weights from external configuration
   * Falls back to internal weights if loading fails
   */
  private getExternalWeights(): EvaluationWeights {
    try {
      const weightLoader = getWeightLoader();
      const cached = weightLoader.getCachedConfiguration();

      if (cached) {
        return { ...cached.evaluators.dellacherie };
      }
    } catch (error) {
      console.warn("Failed to load external weights, falling back to internal weights:", error);
    }

    return { ...this.weights };
  }

  /**
   * Reset weights to default values
   */
  resetWeights(): void {
    Object.assign(this.weights, DEFAULT_WEIGHTS);
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
    try {
      const weightLoader = getWeightLoader();
      await weightLoader.loadConfiguration();
    } catch (error) {
      console.warn("Failed to preload external weight configuration:", error);
    }
  }

  /**
   * Load weights from external configuration asynchronously
   * @returns Promise resolving to loaded weights or fallback weights
   */
  async loadExternalWeights(): Promise<EvaluationWeights> {
    if (!this.useExternalWeights) {
      return this.getWeights();
    }

    try {
      const result = await loadDellacherieWeights();
      if (result.success) {
        return result.data;
      }
      console.warn("Failed to load external weights:", result.error);
    } catch (error) {
      console.warn("Failed to load external weights:", error);
    }

    return this.getWeights();
  }
}
