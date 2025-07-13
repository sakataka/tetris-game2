// 🚨 AI-PROHIBITED: Human UX judgment required
// Configuration loader with hot reload capability for human-controlled animation parameters

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type FineTuneConfig, type ValidationResult, validateFineTuneConfig } from "./validation";

// Configuration loading state
export interface ConfigState {
  config: FineTuneConfig | null;
  error: string | null;
  warnings: string[];
  isLoading: boolean;
  lastLoaded: Date | null;
  loadAttempts: number;
}

// Hot reload configuration
interface HotReloadOptions {
  enabled: boolean;
  interval: number; // milliseconds
  maxRetries: number;
  onReload?: (config: FineTuneConfig) => void;
  onError?: (error: string) => void;
}

const DEFAULT_HOT_RELOAD_OPTIONS: HotReloadOptions = {
  enabled: process.env.NODE_ENV === "development",
  interval: 1000, // 1 second in development
  maxRetries: 3,
};

// Cache for configuration to avoid unnecessary reloads
let configCache: {
  data: FineTuneConfig | null;
  timestamp: number;
  etag: string | null;
} = {
  data: null,
  timestamp: 0,
  etag: null,
};

/**
 * Loads configuration from fine-tune.json with validation
 */
async function loadConfigFromFile(): Promise<ValidationResult> {
  try {
    // Try to load from public directory first (for built app)
    let response: Response;

    try {
      response = await fetch("/src/game/animations/config/fine-tune.json", {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
    } catch {
      // Fallback for development mode - try relative import
      response = await fetch("./fine-tune.json", {
        cache: "no-cache",
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
    }

    // Check ETag for caching
    const etag = response.headers.get("etag");
    if (etag && etag === configCache.etag && configCache.data) {
      return {
        success: true,
        data: configCache.data,
      };
    }

    const rawConfig = await response.json();
    const validationResult = validateFineTuneConfig(rawConfig);

    if (validationResult.success) {
      // Update cache
      configCache = {
        data: validationResult.data,
        timestamp: Date.now(),
        etag,
      };
    }

    return validationResult;
  } catch (error) {
    return {
      success: false,
      error: `Configuration loading failed: ${error instanceof Error ? error.message : String(error)}`,
      violationType: "SCHEMA_VIOLATION",
    };
  }
}

/**
 * React hook for loading and hot-reloading fine-tune configuration
 * @param options - Hot reload configuration options
 * @returns Configuration state and reload function
 */
export function useFineTuneConfig(
  options: Partial<HotReloadOptions> = {},
): ConfigState & { reload: () => Promise<void> } {
  const [state, setState] = useState<ConfigState>({
    config: null,
    error: null,
    warnings: [],
    isLoading: true,
    lastLoaded: null,
    loadAttempts: 0,
  });

  const hotReloadOptions = useMemo(
    () => ({ ...DEFAULT_HOT_RELOAD_OPTIONS, ...options }),
    [options],
  );
  const intervalRef = useRef<number | null>(null);
  const loadingRef = useRef(false);

  const loadConfig = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setState((prev) => ({
      ...prev,
      isLoading: true,
      loadAttempts: prev.loadAttempts + 1,
    }));

    try {
      const result = await loadConfigFromFile();

      if (result.success) {
        setState((prev) => ({
          ...prev,
          config: result.data,
          error: null,
          warnings: result.warnings || [],
          isLoading: false,
          lastLoaded: new Date(),
        }));

        hotReloadOptions.onReload?.(result.data);
      } else {
        const errorMessage = `${result.error}${result.details ? `: ${result.details.join(", ")}` : ""}`;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        hotReloadOptions.onError?.(errorMessage);
        console.error("🚨 Fine-tune config validation failed:", errorMessage);
      }
    } catch (error) {
      const errorMessage = `Unexpected error loading configuration: ${error instanceof Error ? error.message : String(error)}`;
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      hotReloadOptions.onError?.(errorMessage);
      console.error("🚨 Configuration loading error:", error);
    } finally {
      loadingRef.current = false;
    }
  }, [hotReloadOptions]);

  // Initial load
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Hot reload setup
  useEffect(() => {
    if (!hotReloadOptions.enabled) return;

    const startHotReload = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = window.setInterval(() => {
        // Only reload if not currently loading and no critical errors
        if (!loadingRef.current && !state.error?.includes("AI_PROHIBITED_AREA_VIOLATION")) {
          loadConfig();
        }
      }, hotReloadOptions.interval);
    };

    startHotReload();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hotReloadOptions.enabled, hotReloadOptions.interval, loadConfig, state.error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    reload: loadConfig,
  };
}

/**
 * Synchronous configuration getter for non-React contexts
 * Note: Returns cached configuration, may be stale
 */
export function getCurrentConfig(): FineTuneConfig | null {
  return configCache.data;
}

/**
 * Configuration preloader for critical path optimization
 * Call this early in app lifecycle to avoid loading delays
 */
export async function preloadConfig(): Promise<void> {
  try {
    await loadConfigFromFile();
  } catch (error) {
    console.warn("Configuration preload failed:", error);
  }
}

/**
 * Development utilities for configuration testing
 */
export const configUtils = {
  /**
   * Force reload configuration (bypasses cache)
   */
  forceReload: async (): Promise<ValidationResult> => {
    configCache.etag = null; // Clear cache
    return loadConfigFromFile();
  },

  /**
   * Get cache status for debugging
   */
  getCacheInfo: () => ({
    hasData: configCache.data !== null,
    timestamp: configCache.timestamp,
    etag: configCache.etag,
    age: Date.now() - configCache.timestamp,
  }),

  /**
   * Clear configuration cache
   */
  clearCache: () => {
    configCache = {
      data: null,
      timestamp: 0,
      etag: null,
    };
  },

  /**
   * Validate arbitrary configuration object
   */
  validateConfig: validateFineTuneConfig,
};

// Type exports for consumers
export type { FineTuneConfig, ValidationResult } from "./validation";
export type { HotReloadOptions };
