/**
 * Dynamic import utilities for code splitting
 * Enables lazy loading of non-critical features
 */

import React, { type ComponentType, lazy, Suspense } from "react";

export interface LazyComponentProps {
  fallback?: ComponentType;
  error?: ComponentType<{ error: Error; retry: () => void }>;
}

/**
 * Create a lazy-loaded component with error handling and loading state
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentProps = {},
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error("Failed to load component:", error);

      // Return error component if provided
      if (options.error) {
        return {
          default: options.error as any,
        };
      }

      throw error;
    }
  });

  return (props: React.ComponentProps<T>) => {
    const FallbackComponent = options.fallback;
    const fallbackElement = FallbackComponent
      ? React.createElement(FallbackComponent)
      : React.createElement(
          "div",
          {
            className: "animate-pulse bg-muted rounded p-4",
          },
          "Loading...",
        );

    return React.createElement(
      Suspense,
      { fallback: fallbackElement },
      React.createElement(LazyComponent, props),
    );
  };
}

/**
 * Lazy load AI features
 */
export const LazyAIControlPanel = createLazyComponent(
  () =>
    import("../../features/ai-control/ui/AIControlPanel").then((m) => ({
      default: m.AIControlPanel,
    })),
  {
    fallback: () =>
      React.createElement(
        "div",
        {
          className: "animate-pulse bg-muted rounded p-4",
        },
        [
          React.createElement("div", {
            key: 1,
            className: "h-8 bg-muted-foreground/20 rounded mb-4",
          }),
          React.createElement("div", {
            key: 2,
            className: "h-6 bg-muted-foreground/20 rounded mb-2",
          }),
          React.createElement("div", {
            key: 3,
            className: "h-6 bg-muted-foreground/20 rounded mb-2",
          }),
          React.createElement("div", {
            key: 4,
            className: "h-10 bg-muted-foreground/20 rounded",
          }),
        ],
      ),
    error: ({ error: _error, retry }) =>
      React.createElement(
        "div",
        {
          className: "border border-destructive rounded p-4 text-center",
        },
        [
          React.createElement(
            "p",
            {
              key: 1,
              className: "text-destructive mb-2",
            },
            "Failed to load AI controls",
          ),
          React.createElement(
            "button",
            {
              key: 2,
              onClick: retry,
              className: "px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90",
            },
            "Retry",
          ),
        ],
      ),
  },
);

/**
 * Lazy load settings
 */
export const LazySettingsPanel = createLazyComponent(
  () =>
    import("../../features/settings/ui/SettingsPanel").then((m) => ({ default: m.SettingsPanel })),
  {
    fallback: () =>
      React.createElement(
        "div",
        {
          className: "animate-pulse bg-muted rounded p-4",
        },
        [
          React.createElement("div", {
            key: "header",
            className: "h-6 bg-muted-foreground/20 rounded mb-4",
          }),
          React.createElement(
            "div",
            {
              key: "space",
              className: "space-y-2",
            },
            Array.from({ length: 5 }, (_, i) =>
              React.createElement("div", {
                key: i,
                className: "h-10 bg-muted-foreground/20 rounded",
              }),
            ),
          ),
        ],
      ),
  },
);

/**
 * Lazy load advanced AI features
 */
export const LazyAdvancedAIControls = createLazyComponent(
  () =>
    import("../../components/game/AdvancedAIControls").then((m) => ({
      default: m.AdvancedAIControls,
    })),
  {
    fallback: () =>
      React.createElement(
        "div",
        {
          className: "animate-pulse bg-muted rounded p-4",
        },
        [
          React.createElement("div", {
            key: 1,
            className: "h-4 bg-muted-foreground/20 rounded mb-2",
          }),
          React.createElement("div", {
            key: 2,
            className: "h-4 bg-muted-foreground/20 rounded mb-4",
          }),
          React.createElement(
            "div",
            {
              key: 3,
              className: "grid grid-cols-2 gap-2",
            },
            [
              React.createElement("div", {
                key: "a",
                className: "h-8 bg-muted-foreground/20 rounded",
              }),
              React.createElement("div", {
                key: "b",
                className: "h-8 bg-muted-foreground/20 rounded",
              }),
            ],
          ),
        ],
      ),
  },
);

/**
 * Dynamic import with retry logic
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }

  throw lastError!;
}

/**
 * Preload critical features for better UX
 */
export function preloadCriticalFeatures(): Promise<(undefined | undefined)[]> {
  const preloadPromises = [
    // Preload game-play feature (always needed)
    import("../../features/game-play").catch(() => {}),

    // Preload scoring (usually needed)
    import("../../features/scoring").catch(() => {}),
  ];

  return Promise.all(preloadPromises) as Promise<unknown[]>;
}

/**
 * Load feature on demand with caching
 */
class FeatureLoader {
  private cache = new Map<string, Promise<any>>();

  async loadFeature(featureName: string): Promise<any> {
    if (this.cache.has(featureName)) {
      return this.cache.get(featureName)!;
    }

    const loadPromise = this.createFeatureLoader(featureName);
    this.cache.set(featureName, loadPromise);

    return loadPromise;
  }

  private createFeatureLoader(featureName: string): Promise<any> {
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

export const featureLoader = new FeatureLoader();

/**
 * Hook for managing feature loading state
 */
export function useFeatureLoader(featureName: string) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadFeature = React.useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await featureLoader.loadFeature(featureName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feature");
    } finally {
      setIsLoading(false);
    }
  }, [featureName, isLoading]);

  const preload = React.useCallback(() => {
    featureLoader.preloadFeature(featureName);
  }, [featureName]);

  return { loadFeature, preload, isLoading, error };
}

/**
 * Performance-aware lazy loading
 */
export function createPerformanceLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentProps & {
    /** Only load on high-performance devices */
    highPerformanceOnly?: boolean;
    /** Delay before loading (ms) */
    loadDelay?: number;
  } = {},
): ComponentType<React.ComponentProps<T>> {
  return createLazyComponent(async () => {
    // Check performance constraints
    if (options.highPerformanceOnly && navigator.hardwareConcurrency < 4) {
      throw new Error("Feature disabled on low-performance devices");
    }

    // Add delay if specified
    if (options.loadDelay) {
      await new Promise((resolve) => setTimeout(resolve, options.loadDelay));
    }

    return importFn();
  }, options);
}
