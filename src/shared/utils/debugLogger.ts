/**
 * Development-only debug logger utility
 * Logs are only output in development environment to reduce production bundle size
 */

export const createDebugLogger = (namespace: string) => ({
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(`[${namespace}]`, ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(`[${namespace}]`, ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.error(`[${namespace}]`, ...args);
    }
  },
});

// Pre-configured loggers for common use cases
export const aiLogger = createDebugLogger("AI");
