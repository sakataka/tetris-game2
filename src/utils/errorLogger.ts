import type { GameError } from "../types/errors";
import { extractErrorInfo, isGameError } from "../types/errors";

/**
 * Log entry interface
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    recoverable?: boolean;
  };
  sessionId: string;
  userAgent: string;
  url: string;
  gameState?: Record<string, unknown>;
}

/**
 * Log levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Logger configuration
 */
export interface LoggerConfig {
  maxLogEntries: number;
  enableConsoleOutput: boolean;
  enableLocalStorage: boolean;
  enableRemoteLogging: boolean;
  logLevels: LogLevel[];
  sessionDurationMs: number;
  remoteEndpoint?: string;
  includeGameState: boolean;
  includeUserAgent: boolean;
  includeUrl: boolean;
}

/**
 * Default logger configuration
 */
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  maxLogEntries: 1000,
  enableConsoleOutput: process.env.NODE_ENV === "development",
  enableLocalStorage: true,
  enableRemoteLogging: false,
  logLevels: ["info", "warn", "error", "fatal"],
  sessionDurationMs: 24 * 60 * 60 * 1000, // 24 hours
  includeGameState: false, // Privacy consideration
  includeUserAgent: true,
  includeUrl: true,
};

/**
 * Error logger class for collecting and managing error logs
 */
export class ErrorLogger {
  private config: LoggerConfig;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private sessionStartTime: number;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_LOGGER_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    this.initializeLogger();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize logger and load existing logs
   */
  private initializeLogger(): void {
    if (this.config.enableLocalStorage) {
      this.loadLogsFromStorage();
    }

    // Clean up old sessions
    this.cleanupOldSessions();

    // Setup global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Load existing logs from localStorage
   */
  private loadLogsFromStorage(): void {
    try {
      const storedLogs = localStorage.getItem("tetris_error_logs");
      if (storedLogs) {
        const logs = JSON.parse(storedLogs) as LogEntry[];
        this.logBuffer = logs.map((log) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.warn("Failed to load logs from localStorage:", error);
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveLogsToStorage(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      // Keep only recent logs to prevent localStorage bloat
      const recentLogs = this.logBuffer.slice(-this.config.maxLogEntries);
      localStorage.setItem("tetris_error_logs", JSON.stringify(recentLogs));
    } catch (error) {
      console.warn("Failed to save logs to localStorage:", error);
    }
  }

  /**
   * Clean up old session logs
   */
  private cleanupOldSessions(): void {
    const cutoffTime = Date.now() - this.config.sessionDurationMs;
    this.logBuffer = this.logBuffer.filter((log) => log.timestamp.getTime() > cutoffTime);
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promises
    window.addEventListener("unhandledrejection", (event) => {
      this.logError("Unhandled Promise Rejection", { reason: event.reason }, "fatal");
    });

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      this.logError(
        `Uncaught Error: ${event.message}`,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        },
        "fatal",
      );
    });
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error | GameError,
  ): LogEntry {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      context,
      sessionId: this.sessionId,
      userAgent: this.config.includeUserAgent ? navigator.userAgent : "",
      url: this.config.includeUrl ? window.location.href : "",
    };

    // Add error information if provided
    if (error) {
      if (isGameError(error)) {
        const errorInfo = extractErrorInfo(error);
        entry.error = {
          name: errorInfo.name,
          message: errorInfo.message,
          stack: errorInfo.stack,
          code: errorInfo.code,
          recoverable: errorInfo.recoverable,
        };
        entry.context = { ...entry.context, ...errorInfo.context };
      } else {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      }
    }

    return entry;
  }

  /**
   * Add a log entry
   */
  private addLogEntry(entry: LogEntry): void {
    // Check if this log level is enabled
    if (!this.config.logLevels.includes(entry.level)) {
      return;
    }

    // Add to buffer
    this.logBuffer.push(entry);

    // Maintain buffer size
    if (this.logBuffer.length > this.config.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxLogEntries);
    }

    // Console output
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(entry);
    }

    // Save to localStorage
    if (this.config.enableLocalStorage) {
      this.saveLogsToStorage();
    }

    // Send to remote endpoint
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.sessionId}]`;

    switch (entry.level) {
      case "debug":
        console.debug(prefix, entry.message, entry.context);
        break;
      case "info":
        console.info(prefix, entry.message, entry.context);
        break;
      case "warn":
        console.warn(prefix, entry.message, entry.context);
        break;
      case "error":
      case "fatal":
        console.error(prefix, entry.message, entry.error, entry.context);
        break;
    }
  }

  /**
   * Send log entry to remote endpoint
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Don't log remote logging failures to avoid infinite loops
      if (this.config.enableConsoleOutput) {
        console.warn("Failed to send log to remote endpoint:", error);
      }
    }
  }

  /**
   * Public logging methods
   */

  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry("debug", message, context);
    this.addLogEntry(entry);
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry("info", message, context);
    this.addLogEntry(entry);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry("warn", message, context);
    this.addLogEntry(entry);
  }

  error(message: string, error?: Error | GameError, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry("error", message, context, error);
    this.addLogEntry(entry);
  }

  fatal(message: string, error?: Error | GameError, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry("fatal", message, context, error);
    this.addLogEntry(entry);
  }

  logError(message: string, context?: Record<string, unknown>, level: LogLevel = "error"): void {
    const entry = this.createLogEntry(level, message, context);
    this.addLogEntry(entry);
  }

  logGameError(error: GameError, context?: Record<string, unknown>): void {
    const level = error.recoverable ? "error" : "fatal";
    const message = `[${error.code}] ${error.message}`;
    const entry = this.createLogEntry(level, message, context, error);
    this.addLogEntry(entry);
  }

  /**
   * Utility methods
   */

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logBuffer.filter((entry) => entry.level === level);
    }
    return [...this.logBuffer];
  }

  getErrorLogs(): LogEntry[] {
    return this.logBuffer.filter((entry) => entry.level === "error" || entry.level === "fatal");
  }

  clearLogs(): void {
    this.logBuffer = [];
    if (this.config.enableLocalStorage) {
      localStorage.removeItem("tetris_error_logs");
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  getSessionInfo(): { sessionId: string; startTime: Date; logCount: number } {
    return {
      sessionId: this.sessionId,
      startTime: new Date(this.sessionStartTime),
      logCount: this.logBuffer.length,
    };
  }

  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger();

/**
 * Helper functions for common logging scenarios
 */

export function logGameStart(gameState?: Record<string, unknown>): void {
  errorLogger.info("Game started", { gameState });
}

export function logGameEnd(gameState?: Record<string, unknown>, reason?: string): void {
  errorLogger.info("Game ended", { gameState, reason });
}

export function logUserAction(action: string, context?: Record<string, unknown>): void {
  errorLogger.debug(`User action: ${action}`, context);
}

export function logPerformanceMetric(metric: string, value: number, unit?: string): void {
  errorLogger.debug(`Performance: ${metric}`, { value, unit });
}

export function logStateTransition(
  from: string,
  to: string,
  context?: Record<string, unknown>,
): void {
  errorLogger.debug(`State transition: ${from} -> ${to}`, context);
}

/**
 * Error reporting utilities
 */

export function reportError(error: Error | GameError, context?: Record<string, unknown>): void {
  if (isGameError(error)) {
    errorLogger.logGameError(error, context);
  } else {
    errorLogger.error(`Unexpected error: ${error.message}`, error, context);
  }
}

export function reportCriticalError(
  error: Error | GameError,
  context?: Record<string, unknown>,
): void {
  if (isGameError(error)) {
    errorLogger.logGameError(error, context);
  } else {
    errorLogger.fatal(`Critical error: ${error.message}`, error, context);
  }
}
