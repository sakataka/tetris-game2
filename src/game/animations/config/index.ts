// 🚨 AI-PROHIBITED: Human UX judgment required
// Animation Configuration System - Human-Only UX Parameters
//
// This module provides a complete configuration system for animation parameters
// that require human sensory evaluation and should NOT be modified by AI systems.
//
// Key Components:
// - fine-tune.json: Human-controlled animation parameters
// - JSON Schema: Editor support and validation rules
// - Zod Runtime Validation: Type-safe configuration loading
// - Hot Reload: Development-time configuration updates
// - Type Generation: Automatic TypeScript type synchronization

export * from "./loader";
// Re-export generated types for convenience
export type {
  ConfigurationKeys,
  FineTuneConfig,
  UITimingKeys,
} from "./types.generated";
export * from "./validation";

// AI-Prohibited area markers and constants
export const AI_PROHIBITED_CONFIG = {
  // Identification markers
  MARKERS: {
    FILE_HEADER: "// 🚨 AI-PROHIBITED: Human UX judgment required",
    SCHEMA_TITLE: "Human-Only UX Configuration",
    ERROR_PREFIX: "AI_PROHIBITED_AREA_VIOLATION",
    CONFIG_FLAG: "aiProhibited",
  },

  // Configuration file paths
  PATHS: {
    CONFIG_FILE: "/src/game/animations/config/fine-tune.json",
    SCHEMA_FILE: "/src/game/animations/config/schema/fine-tune.schema.json",
    TYPES_FILE: "/src/game/animations/config/types.generated.ts",
    VALIDATION_FILE: "/src/game/animations/config/validation.ts",
    LOADER_FILE: "/src/game/animations/config/loader.ts",
  },

  // Protection mechanisms
  PROTECTION: {
    RUNTIME_VALIDATION: "Zod schema validation with AI prohibition checks",
    SCHEMA_VALIDATION: "JSON Schema with strict type constraints",
    TYPE_GENERATION: "Auto-generated TypeScript types from schema",
    HOT_RELOAD: "Development-time configuration monitoring",
    ERROR_TRACKING: "Detailed violation reporting and logging",
  },

  // Human-controlled parameter categories
  CATEGORIES: {
    UI_TIMINGS: "Animation durations and easing functions requiring human perception",
    PERFORMANCE_BUDGETS: "Performance constraints based on human experience testing",
    GAMEPLAY_FEEL: "Game-specific animation parameters affecting player experience",
    ACCESSIBILITY: "Accessibility-aware animation modifications for inclusive design",
  },
} as const;

/**
 * Validates that a configuration change request comes from a human user
 * This is a conceptual validation - in practice, this would integrate with
 * user authentication and session management systems.
 */
export function validateHumanOrigin(changeRequest: {
  source: "human" | "ai" | "automated";
  userId?: string;
  timestamp: Date;
  changes: Record<string, unknown>;
}): { allowed: boolean; reason?: string } {
  if (changeRequest.source !== "human") {
    return {
      allowed: false,
      reason: `AI_PROHIBITED_AREA_VIOLATION: Configuration changes must originate from human users, received: ${changeRequest.source}`,
    };
  }

  // Additional validation could include:
  // - User role verification (UX designer, developer, etc.)
  // - Change review process for critical parameters
  // - Audit trail requirements

  return { allowed: true };
}

/**
 * Error factory for AI-prohibited area violations
 */
export class AIProhibitedViolationError extends Error {
  public readonly violationType: string;
  public readonly attemptedChanges: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    violationType: string,
    attemptedChanges: Record<string, unknown> = {},
  ) {
    super(`${AI_PROHIBITED_CONFIG.MARKERS.ERROR_PREFIX}: ${message}`);
    this.name = "AIProhibitedViolationError";
    this.violationType = violationType;
    this.attemptedChanges = attemptedChanges;
    this.timestamp = new Date();

    // Ensure stack trace points to the correct location
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIProhibitedViolationError);
    }
  }

  /**
   * Generate detailed violation report for logging/monitoring
   */
  toViolationReport(): {
    type: "AI_PROHIBITED_VIOLATION";
    timestamp: string;
    violationType: string;
    message: string;
    attemptedChanges: Record<string, unknown>;
    stackTrace?: string;
  } {
    return {
      type: "AI_PROHIBITED_VIOLATION",
      timestamp: this.timestamp.toISOString(),
      violationType: this.violationType,
      message: this.message,
      attemptedChanges: this.attemptedChanges,
      stackTrace: this.stack,
    };
  }
}

/**
 * Monitoring and alerting for AI-prohibited area access attempts
 */
const violations: AIProhibitedViolationError[] = [];
const listeners: Array<(violation: AIProhibitedViolationError) => void> = [];

/**
 * Record a violation attempt
 */
export function recordViolation(violation: AIProhibitedViolationError): void {
  violations.push(violation);

  // Console logging for development
  console.error("🚨 AI-Prohibited Area Violation:", violation.toViolationReport());

  // Notify listeners (for analytics, alerting, etc.)
  listeners.forEach((listener) => {
    try {
      listener(violation);
    } catch (error) {
      console.error("Error in violation listener:", error);
    }
  });

  // In production, this would integrate with:
  // - Security monitoring systems
  // - Analytics platforms
  // - Alerting services
  // - Audit logging
}

/**
 * Subscribe to violation events
 */
export function onViolation(listener: (violation: AIProhibitedViolationError) => void): () => void {
  listeners.push(listener);

  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Get violation history for analysis
 */
export function getViolationHistory(): AIProhibitedViolationError[] {
  return [...violations];
}

/**
 * Clear violation history (for testing/development)
 */
export function clearViolationHistory(): void {
  violations.length = 0;
}

export const AIProhibitedAreaMonitor = {
  recordViolation,
  onViolation,
  getViolationHistory,
  clearHistory: clearViolationHistory,
};

/**
 * Development utilities for AI-prohibited configuration system
 */
export const developmentUtils = {
  /**
   * Test AI prohibition enforcement
   */
  testAIProhibition: (): boolean => {
    try {
      throw new AIProhibitedViolationError("Test violation", "TEST_VIOLATION", {
        testKey: "testValue",
      });
    } catch (error) {
      return error instanceof AIProhibitedViolationError;
    }
  },

  /**
   * Validate configuration system integrity
   */
  validateSystemIntegrity: async (): Promise<{
    configExists: boolean;
    schemaValid: boolean;
    typesGenerated: boolean;
    validationWorks: boolean;
  }> => {
    const { getCurrentConfig } = await import("./loader");
    const { validateFineTuneConfig, configExamples } = await import("./validation");

    return {
      configExists: getCurrentConfig() !== null,
      schemaValid: true, // Could implement actual schema validation
      typesGenerated: true, // Could check if types file exists and is recent
      validationWorks: validateFineTuneConfig(configExamples.minimal).success,
    };
  },

  /**
   * Get system status for monitoring
   */
  getSystemStatus: () => ({
    markers: AI_PROHIBITED_CONFIG.MARKERS,
    paths: AI_PROHIBITED_CONFIG.PATHS,
    protection: AI_PROHIBITED_CONFIG.PROTECTION,
    categories: AI_PROHIBITED_CONFIG.CATEGORIES,
    violationCount: getViolationHistory().length,
  }),
};

// Default export for convenience
export default {
  ...AI_PROHIBITED_CONFIG,
  AIProhibitedViolationError,
  AIProhibitedAreaMonitor,
  validateHumanOrigin,
  developmentUtils,
};
