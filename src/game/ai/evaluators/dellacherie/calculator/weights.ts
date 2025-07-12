import { getCachedConfiguration, loadDellacherieWeights } from "@/game/ai/config/weight-loader";
import type { EvaluationWeights } from "@/game/ai/evaluators/dellacherie/types";

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
 * Weight manager state interface
 */
export interface WeightManagerState {
  weights: EvaluationWeights;
  useExternalWeights: boolean;
}

/**
 * Create a new weight manager state
 * @param initialWeights - Initial weight configuration
 * @param useExternalWeights - Whether to use external YAML configuration
 * @returns Weight manager state
 */
export function createWeightManager(
  initialWeights: EvaluationWeights = DEFAULT_WEIGHTS,
  useExternalWeights = false,
): WeightManagerState {
  return {
    weights: { ...initialWeights },
    useExternalWeights,
  };
}

/**
 * Update evaluation weights dynamically
 * Allows for adaptive AI behavior based on game state
 *
 * @param state - Current weight manager state
 * @param newWeights - Updated weight configuration
 * @returns Updated weight manager state
 */
export function updateWeights(
  state: WeightManagerState,
  newWeights: Partial<EvaluationWeights>,
): WeightManagerState {
  return {
    ...state,
    weights: Object.assign({}, state.weights, newWeights),
  };
}

/**
 * Get current evaluation weights
 * @param state - Weight manager state
 * @returns Current weight configuration
 */
export function getWeights(state: WeightManagerState): EvaluationWeights {
  if (state.useExternalWeights) {
    return getExternalWeights(state);
  }
  return { ...state.weights };
}

/**
 * Get weights from external configuration
 * Falls back to internal weights if loading fails
 */
function getExternalWeights(state: WeightManagerState): EvaluationWeights {
  try {
    const cached = getCachedConfiguration();

    if (cached) {
      return { ...cached.evaluators.dellacherie };
    }
  } catch (error) {
    console.warn("Failed to load external weights, falling back to internal weights:", error);
  }

  return { ...state.weights };
}

/**
 * Reset weights to default values
 * @param state - Current weight manager state
 * @returns Weight manager state with default weights
 */
export function resetWeights(state: WeightManagerState): WeightManagerState {
  return {
    ...state,
    weights: { ...DEFAULT_WEIGHTS },
  };
}

/**
 * Enable or disable external weight loading from YAML configuration
 * @param state - Current weight manager state
 * @param useExternal - Whether to use external YAML configuration
 * @returns Updated weight manager state
 */
export function setExternalWeightSystem(
  state: WeightManagerState,
  useExternal: boolean,
): WeightManagerState {
  return {
    ...state,
    useExternalWeights: useExternal,
  };
}

/**
 * Check if external weight system is enabled
 * @param state - Weight manager state
 * @returns true if using external YAML configuration
 */
export function isUsingExternalWeights(state: WeightManagerState): boolean {
  return state.useExternalWeights;
}

/**
 * Load weights from external configuration asynchronously
 * @param state - Weight manager state
 * @returns Promise resolving to loaded weights or fallback weights
 */
export async function loadExternalWeights(state: WeightManagerState): Promise<EvaluationWeights> {
  if (!state.useExternalWeights) {
    return getWeights(state);
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

  return getWeights(state);
}
