/**
 * Dynamic import utilities for code splitting
 * Enables lazy loading of non-critical features
 */

// Removed createLazyComponent as it's not used anywhere in the codebase

/**
 * Preload critical features for better UX
 */
export function preloadCriticalFeatures(): Promise<unknown[]> {
  const preloadPromises = [
    // Preload game-play feature (always needed)
    import("../../features/game-play").catch(() => {}),

    // Preload scoring (usually needed)
    import("../../features/scoring").catch(() => {}),
  ];

  return Promise.all(preloadPromises);
}

/**
 * Load feature on demand with caching
 */
export class FeatureLoader {
  private cache = new Map<string, Promise<unknown>>();

  async loadFeature(featureName: string): Promise<unknown> {
    if (this.cache.has(featureName)) {
      const cached = this.cache.get(featureName);
      if (cached) return cached;
    }

    const loadPromise = this.createFeatureLoader(featureName);
    this.cache.set(featureName, loadPromise);

    return loadPromise;
  }

  private createFeatureLoader(featureName: string): Promise<unknown> {
    switch (featureName) {
      case "ai-control":
        return import("../../features/ai-control");
      case "settings":
        return import("../../features/settings");
      case "ai-visualization":
        return import("../../components/game/AIVisualization");
      case "ai-replay":
        return import("../../components/game/AIReplay");
      default:
        return Promise.reject(new Error(`Unknown feature: ${featureName}`));
    }
  }

  /**
   * Preload feature without waiting
   */
  preloadFeature(featureName: string): void {
    this.loadFeature(featureName).catch(() => {
      // Ignore preload errors
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Note: This instance is kept for potential future use but currently unused
// const _featureLoader = new FeatureLoader();
