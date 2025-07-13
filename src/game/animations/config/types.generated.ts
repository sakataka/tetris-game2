// 🚨 AUTO-GENERATED - DO NOT EDIT
// 🚨 AI-PROHIBITED: Generated from human-controlled UX schema
// Generated from fine-tune.schema.json on 2025-07-13T12:57:06.325Z
//
// This file contains TypeScript types for animation configuration parameters
// that require human judgment and should NOT be modified by AI systems.
//
// To update these types:
// 1. Modify the JSON Schema at: src/game/animations/config/schema/fine-tune.schema.json
// 2. Run: bun run scripts/generate-config-types.ts
// 3. Commit both schema and generated types together
//
// DO NOT manually edit this file - changes will be overwritten!

// TypeScript definitions for Fine-Tune Animation Configuration

/**
 * Animation timing and easing parameters that require human sensory evaluation and should NOT be modified by AI systems
 */
export interface FineTuneConfig {
  /**
   * JSON Schema reference
   */
  $schema?: string;
  /**
   * Configuration version following semantic versioning
   */
  version: string;
  /**
   * Configuration metadata and AI prohibition markers
   */
  metadata?: {
    /**
     * Last modification date in YYYY-MM-DD format
     */
    lastModified?: string;
    /**
     * Human-readable description of configuration purpose
     */
    description?: string;
    /**
     * Marker indicating this configuration requires human judgment
     */
    aiProhibited?: true;
  };
  /**
   * UI animation timing configurations requiring human perception validation
   */
  uiTimings: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^[a-zA-Z][a-zA-Z0-9]*$".
     */
    [k: string]: {
      /**
       * Animation duration in milliseconds (50-3000ms for optimal UX)
       */
      duration: number;
      /**
       * CSS easing function or cubic-bezier curve
       */
      easing: string;
      /**
       * Whether animation can be interrupted by user interaction
       */
      cancellable?: boolean;
    };
  };
  /**
   * Performance constraints to prevent animation-induced frame drops
   */
  performanceBudgets: {
    /**
     * Maximum allowed main thread blocking time in milliseconds
     */
    mainThreadBlocking: number;
    /**
     * Maximum allowed layout recalculations per animation frame
     */
    layoutThrashing: number;
    /**
     * Maximum concurrent animations to prevent performance degradation
     */
    maxAnimations?: number;
    /**
     * Maximum allowed consecutive frame drops before animation reduction
     */
    frameDropThreshold?: number;
  };
  /**
   * Gameplay-specific animation parameters affecting game feel
   */
  gameplayFeelParams?: {
    /**
     * Easing function for piece drop animations
     */
    pieceDropEasing?: string;
    lockDelayFeedback?: {
      /**
       * Lock delay feedback animation duration
       */
      duration?: number;
      /**
       * Feedback intensity from 0 (subtle) to 1 (pronounced)
       */
      intensity?: number;
    };
    /**
     * Acceleration multiplier for soft drop animations
     */
    softDropAcceleration?: number;
    hardDropImpact?: {
      /**
       * Duration of hard drop impact animation
       */
      duration?: number;
      /**
       * Impact dampening factor (0 = no dampening, 1 = full dampening)
       */
      dampening?: number;
    };
  };
  /**
   * Accessibility-aware animation modifications
   */
  accessibilityOverrides?: {
    /**
     * Modifications when prefers-reduced-motion is enabled
     */
    reduceMotion?: {
      /**
       * Multiplier for animation durations when reducing motion
       */
      durationMultiplier?: number;
      /**
       * Whether to disable easing functions for reduced motion
       */
      disableEasing?: boolean;
    };
    /**
     * Modifications for high contrast mode
     */
    highContrast?: {
      /**
       * Multiplier for animation emphasis in high contrast mode
       */
      emphasisMultiplier?: number;
    };
  };
}

// Utility types for configuration validation and type safety
export type ConfigurationKeys = keyof FineTuneConfig;
export type UITimingKeys = keyof FineTuneConfig["uiTimings"];

// Type guards for runtime type checking
export function isFineTuneConfig(value: unknown): value is FineTuneConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    "uiTimings" in value &&
    "performanceBudgets" in value
  );
}

export function isUITimingConfig(value: unknown): value is FineTuneConfig["uiTimings"][string] {
  return (
    typeof value === "object" &&
    value !== null &&
    "duration" in value &&
    "easing" in value &&
    typeof (value as Record<string, unknown>).duration === "number" &&
    typeof (value as Record<string, unknown>).easing === "string"
  );
}

// Configuration validation helpers
export interface ConfigValidationContext {
  path: string[];
  value: unknown;
  schema: object;
}

export type ConfigValidator<T> = (value: T, context: ConfigValidationContext) => string | null;

// Performance budget validation
export function validatePerformanceBudget(
  budget: FineTuneConfig["performanceBudgets"],
  _context: ConfigValidationContext,
): string | null {
  if (budget.mainThreadBlocking > 16) {
    return "Main thread blocking exceeds 60fps budget (16ms)";
  }

  if (budget.layoutThrashing > 5) {
    return "Layout thrashing count too high for smooth animation";
  }

  return null;
}

// Accessibility compliance helpers
export function getAccessibilityAdjustedConfig(
  config: FineTuneConfig,
  preferences: {
    prefersReducedMotion?: boolean;
    prefersHighContrast?: boolean;
  },
): FineTuneConfig {
  if (!preferences.prefersReducedMotion && !preferences.prefersHighContrast) {
    return config;
  }

  const adjusted = { ...config };

  if (preferences.prefersReducedMotion && config.accessibilityOverrides?.reduceMotion) {
    const multiplier = config.accessibilityOverrides.reduceMotion.durationMultiplier ?? 1;
    adjusted.uiTimings = Object.fromEntries(
      Object.entries(config.uiTimings).map(([key, timing]) => [
        key,
        {
          ...timing,
          duration: Math.round(timing.duration * multiplier),
          easing: config.accessibilityOverrides?.reduceMotion?.disableEasing
            ? "linear"
            : timing.easing,
        },
      ]),
    );
  }

  return adjusted;
}

// Development utilities
export const configTypeUtils = {
  /**
   * Get all UI timing keys for iteration
   */
  getUITimingKeys: (config: FineTuneConfig): UITimingKeys[] =>
    Object.keys(config.uiTimings) as UITimingKeys[],

  /**
   * Validate configuration structure at compile time
   */
  validateStructure: (_config: FineTuneConfig): true => true,

  /**
   * Get default configuration values
   */
  getDefaults: (): Partial<FineTuneConfig> => ({
    version: "prototype-1.0",
    performanceBudgets: {
      mainThreadBlocking: 4,
      layoutThrashing: 1,
    },
  }),
} as const;
