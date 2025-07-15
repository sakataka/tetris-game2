/**
 * Runtime AI weights loading
 * Prevents bundling large weight files
 */

import React from "react";

export interface AIWeights {
  landingHeight: number;
  linesCleared: number;
  potentialLinesFilled: number;
  rowTransitions: number;
  columnTransitions: number;
  holes: number;
  wells: number;
  blocksAboveHoles: number;
  wellOpen: number;
  escapeRoute: number;
  bumpiness: number;
  maxHeight: number;
  rowFillRatio: number;
  [key: string]: number;
}

export interface WeightPreset {
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  weights: AIWeights;
}

class AIWeightsLoader {
  private cache = new Map<string, WeightPreset>();
  private baseUrl: string;

  constructor(baseUrl = "/ai-weights") {
    this.baseUrl = baseUrl;
  }

  /**
   * Load AI weights for specific difficulty
   */
  async loadWeights(difficulty: string): Promise<AIWeights> {
    const preset = await this.loadPreset(difficulty);
    return preset.weights;
  }

  /**
   * Load complete weight preset
   */
  async loadPreset(difficulty: string): Promise<WeightPreset> {
    const cacheKey = `preset-${difficulty}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const url = `${this.baseUrl}/${difficulty}.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load weights: ${response.statusText}`);
      }

      const preset: WeightPreset = await response.json();

      // Validate weights structure
      this.validateWeights(preset.weights);

      this.cache.set(cacheKey, preset);
      return preset;
    } catch (error) {
      console.error(`Failed to load AI weights for ${difficulty}:`, error);

      // Fallback to default weights
      return this.getDefaultPreset(difficulty);
    }
  }

  /**
   * Load all available presets
   */
  async loadAllPresets(): Promise<WeightPreset[]> {
    const difficulties = ["easy", "medium", "hard", "expert"];
    const presets = await Promise.allSettled(difficulties.map((d) => this.loadPreset(d)));

    return presets
      .filter(
        (result): result is PromiseFulfilledResult<WeightPreset> => result.status === "fulfilled",
      )
      .map((result) => result.value);
  }

  /**
   * Validate weights structure
   */
  private validateWeights(weights: AIWeights): void {
    const requiredKeys = [
      "landingHeight",
      "linesCleared",
      "holes",
      "bumpiness",
      "maxHeight",
      "rowTransitions",
      "columnTransitions",
    ];

    for (const key of requiredKeys) {
      if (typeof weights[key] !== "number") {
        throw new Error(`Invalid weight value for ${key}`);
      }
    }
  }

  /**
   * Get default weights as fallback
   */
  private getDefaultPreset(difficulty: string): WeightPreset {
    const defaultWeights: Record<string, AIWeights> = {
      easy: {
        landingHeight: -1.0,
        linesCleared: 800.0,
        potentialLinesFilled: 150.0,
        rowTransitions: -0.8,
        columnTransitions: -2.0,
        holes: -3.0,
        wells: -0.8,
        blocksAboveHoles: -2.0,
        wellOpen: 0.0,
        escapeRoute: 0.0,
        bumpiness: -2.0,
        maxHeight: -10.0,
        rowFillRatio: 40.0,
      },
      medium: {
        landingHeight: -1.5,
        linesCleared: 1000.0,
        potentialLinesFilled: 200.0,
        rowTransitions: -1.0,
        columnTransitions: -3.0,
        holes: -5.0,
        wells: -1.0,
        blocksAboveHoles: -2.5,
        wellOpen: 0.0,
        escapeRoute: 0.0,
        bumpiness: -3.0,
        maxHeight: -15.0,
        rowFillRatio: 50.0,
      },
      hard: {
        landingHeight: -2.0,
        linesCleared: 1200.0,
        potentialLinesFilled: 250.0,
        rowTransitions: -1.2,
        columnTransitions: -3.5,
        holes: -7.0,
        wells: -1.2,
        blocksAboveHoles: -3.0,
        wellOpen: 0.0,
        escapeRoute: 0.0,
        bumpiness: -4.0,
        maxHeight: -18.0,
        rowFillRatio: 60.0,
      },
      expert: {
        landingHeight: -2.5,
        linesCleared: 1500.0,
        potentialLinesFilled: 300.0,
        rowTransitions: -1.5,
        columnTransitions: -4.0,
        holes: -10.0,
        wells: -1.5,
        blocksAboveHoles: -4.0,
        wellOpen: 0.0,
        escapeRoute: 0.0,
        bumpiness: -5.0,
        maxHeight: -25.0,
        rowFillRatio: 80.0,
      },
    };

    return {
      name: `Default ${difficulty}`,
      description: `Built-in ${difficulty} difficulty weights`,
      difficulty: difficulty as "easy" | "medium" | "hard" | "expert",
      weights: defaultWeights[difficulty] || defaultWeights.medium,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Preload weights for better UX
   */
  async preloadWeights(difficulties: string[] = ["easy", "medium"]): Promise<void> {
    const preloadPromises = difficulties.map((d) =>
      this.loadPreset(d).catch(() => {
        // Ignore preload errors
      }),
    );

    await Promise.all(preloadPromises);
  }
}

export const aiWeightsLoader = new AIWeightsLoader();

/**
 * Hook for loading AI weights
 */
export function useAIWeights(difficulty: string) {
  const [weights, setWeights] = React.useState<AIWeights | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadWeights() {
      try {
        setLoading(true);
        setError(null);

        const loadedWeights = await aiWeightsLoader.loadWeights(difficulty);

        if (!cancelled) {
          setWeights(loadedWeights);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load weights");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWeights();

    return () => {
      cancelled = true;
    };
  }, [difficulty]);

  return { weights, loading, error };
}

/**
 * Hook for loading all available presets
 */
export function useAIWeightPresets() {
  const [presets, setPresets] = React.useState<WeightPreset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadPresets() {
      try {
        setLoading(true);
        setError(null);

        const loadedPresets = await aiWeightsLoader.loadAllPresets();

        if (!cancelled) {
          setPresets(loadedPresets);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load presets");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPresets();

    return () => {
      cancelled = true;
    };
  }, []);

  const reload = React.useCallback(() => {
    aiWeightsLoader.clearCache();
    // Trigger re-fetch by updating a state that the effect depends on
    setLoading(true);
  }, []);

  return { presets, loading, error, reload };
}

/**
 * Preload critical weights on app start
 */
export function preloadCriticalAIWeights(): Promise<void> {
  return aiWeightsLoader.preloadWeights(["medium", "hard"]);
}
