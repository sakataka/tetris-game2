// 🚨 AI-PROHIBITED: Human UX judgment required
// This validation file protects animation configuration that requires human perception evaluation.
// AI systems should NOT modify values in this file.

import { z } from "zod";

// AI-Prohibited area markers for error identification
export const AI_PROHIBITED_MARKERS = {
  FILE_HEADER: "// 🚨 AI-PROHIBITED: Human UX judgment required",
  SCHEMA_TITLE: "Human-Only UX Configuration",
  ERROR_PREFIX: "AI_PROHIBITED_AREA_VIOLATION",
} as const;

// Easing function validation pattern
const easingPattern =
  /^(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\(\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*\))$/;

const easingSchema = z
  .string()
  .regex(
    easingPattern,
    "Invalid easing function. Must be one of: linear, ease, ease-in, ease-out, ease-in-out, or cubic-bezier(x1, y1, x2, y2)",
  );

// Version pattern validation
const versionSchema = z
  .string()
  .regex(
    /^(prototype|v)\d+\.\d+(\.\d+)?(-[a-zA-Z0-9]+)?$/,
    "Version must follow semantic versioning: prototype-1.0, v1.0.0, v1.2.3-beta",
  );

// UI Timing configuration schema
const uiTimingSchema = z.object({
  duration: z
    .number()
    .min(50, "Animation duration must be at least 50ms for visibility")
    .max(3000, "Animation duration must not exceed 3000ms for UX responsiveness"),
  easing: easingSchema,
  cancellable: z.boolean().optional(),
});

// Performance budgets schema
const performanceBudgetsSchema = z.object({
  mainThreadBlocking: z
    .number()
    .min(1, "Main thread blocking must be at least 1ms")
    .max(16, "Main thread blocking must not exceed 16ms (60fps budget)"),
  layoutThrashing: z
    .number()
    .min(0, "Layout thrashing cannot be negative")
    .max(10, "Layout thrashing must not exceed 10 operations per frame"),
  maxAnimations: z
    .number()
    .min(1, "Must allow at least 1 concurrent animation")
    .max(20, "Too many concurrent animations can cause performance issues")
    .optional(),
  frameDropThreshold: z
    .number()
    .min(1, "Frame drop threshold must be at least 1")
    .max(10, "Frame drop threshold should not exceed 10 frames")
    .optional(),
});

// Gameplay feel parameters schema
const gameplayFeelSchema = z
  .object({
    pieceDropEasing: easingSchema.optional(),
    lockDelayFeedback: z
      .object({
        duration: z.number().min(50).max(500),
        intensity: z.number().min(0).max(1),
      })
      .optional(),
    softDropAcceleration: z
      .number()
      .min(1, "Soft drop acceleration must be at least 1x")
      .max(5, "Soft drop acceleration should not exceed 5x for playability")
      .optional(),
    hardDropImpact: z
      .object({
        duration: z.number().min(50).max(300),
        dampening: z.number().min(0).max(1),
      })
      .optional(),
  })
  .optional();

// Accessibility overrides schema
const accessibilityOverridesSchema = z
  .object({
    reduceMotion: z
      .object({
        durationMultiplier: z
          .number()
          .min(0.1, "Duration multiplier must be at least 0.1")
          .max(2, "Duration multiplier should not exceed 2x"),
        disableEasing: z.boolean(),
      })
      .optional(),
    highContrast: z
      .object({
        emphasisMultiplier: z
          .number()
          .min(1, "Emphasis multiplier must be at least 1x")
          .max(2, "Emphasis multiplier should not exceed 2x"),
      })
      .optional(),
  })
  .optional();

// Metadata schema
const metadataSchema = z
  .object({
    lastModified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    description: z.string(),
    aiProhibited: z.literal(true),
  })
  .optional();

// Main fine-tune configuration schema
const fineTuneSchema = z.object({
  $schema: z.string().optional(),
  version: versionSchema,
  metadata: metadataSchema,
  uiTimings: z.record(
    z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "UI timing keys must be valid identifiers"),
    uiTimingSchema,
  ),
  performanceBudgets: performanceBudgetsSchema,
  gameplayFeelParams: gameplayFeelSchema,
  accessibilityOverrides: accessibilityOverridesSchema,
});

// Type inference from schema
export type FineTuneConfig = z.infer<typeof fineTuneSchema>;
export type UITimingConfig = z.infer<typeof uiTimingSchema>;
export type PerformanceBudgets = z.infer<typeof performanceBudgetsSchema>;
export type GameplayFeelParams = z.infer<typeof gameplayFeelSchema>;
export type AccessibilityOverrides = z.infer<typeof accessibilityOverridesSchema>;

// Validation result types
export interface ValidationSuccess {
  success: true;
  data: FineTuneConfig;
  warnings?: string[];
}

export interface ValidationError {
  success: false;
  error: string;
  details?: string[];
  violationType: "SCHEMA_VIOLATION" | "AI_PROHIBITED_AREA_VIOLATION" | "PERFORMANCE_VIOLATION";
}

export type ValidationResult = ValidationSuccess | ValidationError;

// Performance validation rules
const performanceValidationRules = {
  maxTotalDuration: 5000, // Maximum combined duration for all animations
  warnAbove: 1000, // Warn if single animation exceeds this duration
};

// Custom validation for performance impact
function validatePerformanceImpact(config: FineTuneConfig): string[] {
  const warnings: string[] = [];

  // Check individual animation durations
  for (const [key, timing] of Object.entries(config.uiTimings)) {
    if (timing.duration > performanceValidationRules.warnAbove) {
      warnings.push(
        `Animation '${key}' duration (${timing.duration}ms) exceeds recommended maximum (${performanceValidationRules.warnAbove}ms)`,
      );
    }
  }

  // Check total animation burden
  const totalDuration = Object.values(config.uiTimings).reduce(
    (sum, timing) => sum + timing.duration,
    0,
  );

  if (totalDuration > performanceValidationRules.maxTotalDuration) {
    warnings.push(
      `Total animation duration (${totalDuration}ms) exceeds performance budget (${performanceValidationRules.maxTotalDuration}ms)`,
    );
  }

  return warnings;
}

/**
 * Validates fine-tune configuration with comprehensive error handling
 * @param config - Raw configuration object to validate
 * @returns Validation result with success/error state and detailed information
 */
export function validateFineTuneConfig(config: unknown): ValidationResult {
  try {
    // Check for AI prohibition markers
    if (typeof config === "object" && config !== null) {
      const configObj = config as Record<string, unknown>;
      const metadata = configObj.metadata as Record<string, unknown> | undefined;

      if (metadata?.aiProhibited !== true) {
        return {
          success: false,
          error: `${AI_PROHIBITED_MARKERS.ERROR_PREFIX}: Configuration must include aiProhibited marker`,
          violationType: "AI_PROHIBITED_AREA_VIOLATION",
        };
      }
    }

    // Perform Zod validation
    const validatedConfig = fineTuneSchema.parse(config);

    // Perform additional performance validation
    const warnings = validatePerformanceImpact(validatedConfig);

    return {
      success: true,
      data: validatedConfig,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map(
        (err) => `${String(err.path?.join?.(".") || err.path || "unknown")}: ${err.message}`,
      );

      return {
        success: false,
        error: `${AI_PROHIBITED_MARKERS.ERROR_PREFIX}: Invalid configuration structure`,
        details,
        violationType: "SCHEMA_VIOLATION",
      };
    }

    return {
      success: false,
      error: `${AI_PROHIBITED_MARKERS.ERROR_PREFIX}: Unexpected validation error`,
      details: [error instanceof Error ? error.message : String(error)],
      violationType: "SCHEMA_VIOLATION",
    };
  }
}

/**
 * Validates a single UI timing configuration
 * @param timing - UI timing object to validate
 * @returns Validation result for the timing configuration
 */
export function validateUITiming(timing: unknown): ValidationResult {
  try {
    const validatedTiming = uiTimingSchema.parse(timing);

    const warnings: string[] = [];
    if (validatedTiming.duration > performanceValidationRules.warnAbove) {
      warnings.push(`Duration (${validatedTiming.duration}ms) exceeds recommended maximum`);
    }

    return {
      success: true,
      data: validatedTiming as unknown as FineTuneConfig, // Type assertion for consistent return type
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid UI timing configuration",
        details: error.issues.map((err) => err.message),
        violationType: "SCHEMA_VIOLATION",
      };
    }

    return {
      success: false,
      error: "Unexpected validation error",
      violationType: "SCHEMA_VIOLATION",
    };
  }
}

/**
 * Development helper: Provides configuration examples for testing
 */
export const configExamples = {
  minimal: {
    version: "prototype-1.0",
    metadata: {
      lastModified: "2025-07-13",
      description: "Minimal configuration for testing",
      aiProhibited: true,
    },
    uiTimings: {
      test: {
        duration: 100,
        easing: "ease-out",
      },
    },
    performanceBudgets: {
      mainThreadBlocking: 4,
      layoutThrashing: 1,
    },
  },

  invalid: {
    version: "invalid-version",
    uiTimings: {
      "invalid-key!": {
        duration: -1, // Invalid duration
        easing: "invalid-easing",
      },
    },
    performanceBudgets: {
      mainThreadBlocking: 100, // Exceeds maximum
      layoutThrashing: -1, // Invalid value
    },
  },
} as const;
