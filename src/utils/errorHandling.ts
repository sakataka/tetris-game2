import type { GameError } from "../types/errors";
import { extractErrorInfo, isGameError, isRecoverableError } from "../types/errors";

/**
 * Configuration for error handling behavior
 */
export interface ErrorHandlingConfig {
  enableLogging: boolean;
  maxRetries: number;
  retryDelay: number;
  enableRecovery: boolean;
}

/**
 * Default error handling configuration
 */
export const DEFAULT_ERROR_CONFIG: ErrorHandlingConfig = {
  enableLogging: process.env.NODE_ENV === "development",
  maxRetries: 3,
  retryDelay: 1000,
  enableRecovery: true,
};

/**
 * Error logging levels
 */
export type LogLevel = "error" | "warn" | "info" | "debug";

/**
 * Logger interface for error handling
 */
export interface Logger {
  error: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  debug: (message: string, context?: Record<string, unknown>) => void;
}

/**
 * Default console logger implementation
 */
export const consoleLogger: Logger = {
  error: (message: string, context?: Record<string, unknown>) => {
    console.error("[Tetris Error]", message, context);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn("[Tetris Warning]", message, context);
  },
  info: (message: string, context?: Record<string, unknown>) => {
    console.info("[Tetris Info]", message, context);
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    console.debug("[Tetris Debug]", message, context);
  },
};

/**
 * Global error handling configuration
 */
let globalConfig = DEFAULT_ERROR_CONFIG;
let globalLogger = consoleLogger;

/**
 * Configure global error handling
 */
export function configureErrorHandling(config: Partial<ErrorHandlingConfig>, logger?: Logger) {
  globalConfig = { ...globalConfig, ...config };
  if (logger) {
    globalLogger = logger;
  }
}

/**
 * Log an error using the configured logger
 */
export function logError(error: GameError, level: LogLevel = "error") {
  if (!globalConfig.enableLogging) return;

  const errorInfo = extractErrorInfo(error);
  const message = `[${error.code}] ${error.message}`;

  globalLogger[level](message, errorInfo);
}

/**
 * Safe wrapper for functions that might throw game errors
 * Use sparingly - prefer letting errors bubble up for proper handling
 */
export async function safeExecute<T>(
  operation: () => T | Promise<T>,
  context?: string,
): Promise<{ success: true; data: T } | { success: false; error: GameError }> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    if (isGameError(error)) {
      logError(error);
      return { success: false, error };
    }

    // Convert unknown errors to GameError
    const gameError = new (await import("../types/errors")).GameStateError(
      "GAME_001",
      `Unexpected error${context ? ` in ${context}` : ""}: ${String(error)}`,
      { originalError: error },
      false,
    );

    logError(gameError);
    return { success: false, error: gameError };
  }
}

/**
 * Simple retry wrapper for specific transient failures (e.g., network issues)
 * Use sparingly - most game logic should fail fast
 */
export async function withRetry<T>(
  operation: () => T | Promise<T>,
  maxRetries = 2,
  delay = 1000,
  context?: string,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Only retry on the last attempt or for specific error types
      if (attempt === maxRetries) {
        throw error;
      }

      // Only retry for specific transient errors
      if (isGameError(error) && !isRecoverableError(error)) {
        throw error; // Don't retry non-recoverable errors
      }

      globalLogger.warn(
        `Retry attempt ${attempt + 1}/${maxRetries + 1} for ${context || "operation"}`,
        { error: String(error) },
      );

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error("Retry logic error - should not reach here");
}

/**
 * Error boundary helper for React components
 */
export function createErrorHandler(componentName: string) {
  return (error: Error, errorInfo: { componentStack?: string | null }) => {
    const gameError = isGameError(error)
      ? error
      : new (require("../types/errors").GameStateError)(
          "GAME_001",
          `Component error in ${componentName}: ${error.message}`,
          {
            originalError: error,
            componentStack: errorInfo.componentStack || "",
          },
          true,
        );

    logError(gameError);

    // Additional component-specific error handling can be added here
    // For example, sending error reports to monitoring services
  };
}

/**
 * Validation wrapper with error conversion
 */
export function validateWithError<T>(
  validator: () => T,
  errorCode: string,
  errorMessage: string,
  context?: Record<string, unknown>,
): T {
  try {
    return validator();
  } catch (error) {
    const { ValidationError, ERROR_CODES } = require("../types/errors");

    throw new ValidationError(
      ERROR_CODES[errorCode as keyof typeof ERROR_CODES] || errorCode,
      errorMessage,
      { ...context, originalError: error },
      false,
    );
  }
}

// Removed: withRecovery function - automatic recovery hides problems and delays detection

/**
 * Decorator for automatic error handling in class methods
 */
export function errorHandler(_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    try {
      const result = method.apply(this, args);

      // Handle async methods
      if (result instanceof Promise) {
        return result.catch((error: unknown) => {
          if (isGameError(error)) {
            logError(error);
          }
          throw error;
        });
      }

      return result;
    } catch (error) {
      if (isGameError(error)) {
        logError(error);
      }
      throw error;
    }
  };
}
