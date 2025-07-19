/**
 * Type-Safe Event Bus Implementation
 * Provides compile-time type safety for event handling with payload validation
 */

import type { GameBoard, Position, Tetromino, TetrominoTypeName } from "@/types/game";

// Core event system types
export type UnsubscribeFn = () => void;
export type EventHandler<TPayload> = (payload: TPayload) => void | Promise<void>;

/**
 * Comprehensive game event definitions with strict typing
 */
export interface TypedGameEvents {
  // Piece Movement Events
  "piece:moved": {
    direction: "left" | "right" | "down";
    position: Position;
    piece: Tetromino;
  };
  "piece:rotated": {
    direction: "clockwise" | "counterclockwise" | "180";
    newRotation: 0 | 1 | 2 | 3;
    position: Position;
    piece: Tetromino;
  };
  "piece:locked": {
    position: Position;
    linesCleared: number;
    piece: Tetromino;
    board: GameBoard;
  };
  "piece:held": {
    heldPiece: TetrominoTypeName | null;
    newCurrentPiece: TetrominoTypeName;
    canHold: boolean;
  };
  "piece:spawned": {
    piece: Tetromino;
    nextPiece: TetrominoTypeName;
  };

  // Game State Events
  "game:started": { timestamp: number };
  "game:paused": { isPaused: boolean; timestamp: number };
  "game:resumed": { timestamp: number };
  "game:over": {
    finalScore: number;
    totalLines: number;
    level: number;
    timestamp: number;
  };
  "game:reset": { timestamp: number };

  // Level and Scoring Events
  "level:up": {
    newLevel: number;
    previousLevel: number;
    linesRequired: number;
  };
  "score:updated": {
    newScore: number;
    previousScore: number;
    delta: number;
    reason: "line-clear" | "soft-drop" | "hard-drop" | "tspin" | "combo";
  };
  "lines:cleared": {
    lines: readonly number[];
    lineCount: 1 | 2 | 3 | 4;
    clearType: "single" | "double" | "triple" | "tetris";
    isTSpin: boolean;
    board: GameBoard;
  };
  "combo:updated": {
    count: number;
    isActive: boolean;
    multiplier: number;
  };

  // AI Events
  "ai:decision": {
    decision: { x: number; y: number; rotation: number } | null;
    thinkingTime: number;
    confidence: number;
  };
  "ai:enabled": { enabled: boolean };
  "ai:error": {
    error: string;
    code: string;
    recoverable: boolean;
  };

  // Animation Events
  "animation:started": {
    type: "line-clear" | "piece-lock" | "level-up" | "tetris-flash";
    duration: number;
    data?: unknown;
  };
  "animation:completed": {
    type: "line-clear" | "piece-lock" | "level-up" | "tetris-flash";
  };

  // Performance Events
  "performance:sample": {
    frameTime: number;
    fps: number;
    memoryUsage?: number;
    timestamp: number;
  };
  "performance:warning": {
    type: "low-fps" | "high-memory" | "long-frame";
    value: number;
    threshold: number;
  };

  // Settings Events
  "settings:changed": {
    key: string;
    value: unknown;
    previousValue: unknown;
  };

  // Error Events
  "error:game": {
    error: string;
    code: string;
    context: Record<string, unknown>;
    recoverable: boolean;
  };
  "error:validation": {
    field: string;
    value: unknown;
    expectedType: string;
  };

  // Allow additional string keys for extensibility
  [key: string]: unknown;
}

/**
 * Event payload validation functions
 */
export const EventValidators = {
  "piece:moved": (payload: unknown): payload is TypedGameEvents["piece:moved"] => {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "direction" in payload &&
      "position" in payload &&
      "piece" in payload &&
      ["left", "right", "down"].includes((payload as { direction: string }).direction)
    );
  },

  "piece:rotated": (payload: unknown): payload is TypedGameEvents["piece:rotated"] => {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "direction" in payload &&
      "newRotation" in payload &&
      "position" in payload &&
      "piece" in payload &&
      ["clockwise", "counterclockwise", "180"].includes(
        (payload as { direction: string }).direction,
      ) &&
      [0, 1, 2, 3].includes((payload as { newRotation: number }).newRotation)
    );
  },

  "game:over": (payload: unknown): payload is TypedGameEvents["game:over"] => {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "finalScore" in payload &&
      "totalLines" in payload &&
      "level" in payload &&
      "timestamp" in payload &&
      typeof (
        payload as {
          finalScore?: unknown;
          totalLines?: unknown;
          level?: unknown;
          timestamp?: unknown;
        }
      ).finalScore === "number" &&
      typeof (
        payload as {
          finalScore?: unknown;
          totalLines?: unknown;
          level?: unknown;
          timestamp?: unknown;
        }
      ).totalLines === "number" &&
      typeof (
        payload as {
          finalScore?: unknown;
          totalLines?: unknown;
          level?: unknown;
          timestamp?: unknown;
        }
      ).level === "number" &&
      typeof (
        payload as {
          finalScore?: unknown;
          totalLines?: unknown;
          level?: unknown;
          timestamp?: unknown;
        }
      ).timestamp === "number"
    );
  },

  "lines:cleared": (payload: unknown): payload is TypedGameEvents["lines:cleared"] => {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "lines" in payload &&
      "lineCount" in payload &&
      "clearType" in payload &&
      "isTSpin" in payload &&
      "board" in payload &&
      Array.isArray((payload as { lines?: unknown }).lines) &&
      [1, 2, 3, 4].includes((payload as { lineCount: number }).lineCount) &&
      ["single", "double", "triple", "tetris"].includes(
        (payload as { clearType: string }).clearType,
      )
    );
  },

  "ai:error": (payload: unknown): payload is TypedGameEvents["ai:error"] => {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      "code" in payload &&
      "recoverable" in payload &&
      typeof (payload as { error?: unknown; code?: unknown; recoverable?: unknown }).error ===
        "string" &&
      typeof (payload as { error?: unknown; code?: unknown; recoverable?: unknown }).code ===
        "string" &&
      typeof (payload as { error?: unknown; code?: unknown; recoverable?: unknown }).recoverable ===
        "boolean"
    );
  },
} as const;

/**
 * Configuration for the typed event bus
 */
export interface TypedEventBusConfig {
  maxListeners?: number;
  enableLogging?: boolean;
  enableValidation?: boolean;
  maxHistorySize?: number;
  asyncHandlers?: boolean;
}

/**
 * Event history entry
 */
export interface EventHistoryEntry<
  TEvents extends Record<string, unknown>,
  K extends keyof TEvents = keyof TEvents,
> {
  type: K;
  payload: TEvents[K];
  timestamp: number;
  id: string;
}

/**
 * Type-safe event bus interface
 */
export interface TypedEventBus<TEvents extends Record<string, unknown> = TypedGameEvents> {
  // Core event methods
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): Promise<void>;
  emitSync<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
  on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): UnsubscribeFn;
  once<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): UnsubscribeFn;
  off<K extends keyof TEvents>(event: K, handler?: EventHandler<TEvents[K]>): void;

  // Utility methods
  getListenerCount<K extends keyof TEvents>(event: K): number;
  getActiveEvents(): (keyof TEvents)[];
  hasListeners<K extends keyof TEvents>(event: K): boolean;

  // History and debugging
  getHistory(): EventHistoryEntry<TEvents>[];
  getHistoryFor<K extends keyof TEvents>(event: K): EventHistoryEntry<TEvents, K>[];
  clearHistory(): void;

  // Configuration
  setConfig(config: Partial<TypedEventBusConfig>): void;
  getConfig(): TypedEventBusConfig;

  // Lifecycle
  destroy(): void;
}

/**
 * Create a type-safe event bus implementation
 */
export function createTypedEventBus<TEvents extends Record<string, unknown> = TypedGameEvents>(
  config: TypedEventBusConfig = {},
): TypedEventBus<TEvents> {
  // Configuration with defaults
  const currentConfig: Required<TypedEventBusConfig> = {
    maxListeners: config.maxListeners ?? 100,
    enableLogging: config.enableLogging ?? false,
    enableValidation: config.enableValidation ?? true,
    maxHistorySize: config.maxHistorySize ?? 1000,
    asyncHandlers: config.asyncHandlers ?? true,
  };

  // Internal state
  const listeners = new Map<keyof TEvents, Set<EventHandler<TEvents[keyof TEvents]>>>();
  const eventHistory: EventHistoryEntry<TEvents>[] = [];
  let eventIdCounter = 0;

  /**
   * Generate unique event ID
   */
  const generateEventId = (): string => {
    return `event_${Date.now()}_${++eventIdCounter}`;
  };

  /**
   * Add event to history
   */
  const addToHistory = <K extends keyof TEvents>(type: K, payload: TEvents[K]): void => {
    const entry: EventHistoryEntry<TEvents, K> = {
      type,
      payload,
      timestamp: Date.now(),
      id: generateEventId(),
    };

    eventHistory.push(entry as EventHistoryEntry<TEvents>);

    // Maintain history size limit
    if (eventHistory.length > currentConfig.maxHistorySize) {
      eventHistory.shift();
    }
  };

  /**
   * Validate event payload if validation is enabled
   */
  const validatePayload = <K extends keyof TEvents>(event: K, payload: TEvents[K]): boolean => {
    if (!currentConfig.enableValidation) {
      return true;
    }

    // Check if we have a validator for this event
    const validator = EventValidators[event as keyof typeof EventValidators];
    if (validator) {
      return validator(payload);
    }

    // Basic validation - ensure payload is not null/undefined for events that expect data
    return payload !== null && payload !== undefined;
  };

  /**
   * Execute event handler with error handling
   */
  const executeHandler = async <K extends keyof TEvents>(
    handler: EventHandler<TEvents[K]>,
    payload: TEvents[K],
    eventType: K,
  ): Promise<void> => {
    try {
      await handler(payload);
    } catch (error) {
      console.error(`Error in event handler for ${String(eventType)}:`, error);

      // Emit error event if it's not already an error event
      if (!String(eventType).startsWith("error:")) {
        emitSync(
          "error:game" as K,
          {
            error: error instanceof Error ? error.message : "Unknown error in event handler",
            code: "EVENT_HANDLER_ERROR",
            context: { eventType: String(eventType) },
            recoverable: true,
          } as TEvents[K],
        );
      }
    }
  };

  /**
   * Emit event synchronously (fire and forget)
   */
  const emitSync = <K extends keyof TEvents>(event: K, payload: TEvents[K]): void => {
    emit(event, payload).catch((error) => {
      console.error(`Error in async event emission for ${String(event)}:`, error);
    });
  };

  /**
   * Emit event asynchronously
   */
  const emit = async <K extends keyof TEvents>(event: K, payload: TEvents[K]): Promise<void> => {
    // Validate payload
    if (!validatePayload(event, payload)) {
      console.warn(`Invalid payload for event ${String(event)}:`, payload);
      return;
    }

    // Add to history
    addToHistory(event, payload);

    // Log if enabled
    if (currentConfig.enableLogging) {
      console.log(`[TypedEventBus] Emitting ${String(event)}`, payload);
    }

    // Get handlers
    const handlers = listeners.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Execute handlers
    if (currentConfig.asyncHandlers) {
      // Parallel execution
      const promises = Array.from(handlers).map((handler) =>
        executeHandler(handler, payload, event),
      );
      await Promise.all(promises);
    } else {
      // Sequential execution
      for (const handler of handlers) {
        await executeHandler(handler, payload, event);
      }
    }
  };

  return {
    emit,
    emitSync,

    on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): UnsubscribeFn {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }

      const handlers = listeners.get(event);
      if (!handlers) {
        throw new Error(`Handlers not found for event: ${String(event)}`);
      }

      // Check listener limit
      if (handlers.size >= currentConfig.maxListeners) {
        console.warn(
          `Maximum listeners (${currentConfig.maxListeners}) reached for event: ${String(event)}`,
        );
      }

      handlers.add(handler as EventHandler<TEvents[keyof TEvents]>);

      if (currentConfig.enableLogging) {
        console.log(`[TypedEventBus] Subscribed to ${String(event)}`);
      }

      // Return unsubscribe function
      return () => {
        handlers.delete(handler as EventHandler<TEvents[keyof TEvents]>);
        if (currentConfig.enableLogging) {
          console.log(`[TypedEventBus] Unsubscribed from ${String(event)}`);
        }
      };
    },

    once<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): UnsubscribeFn {
      const unsubscribe = this.on(event, (payload) => {
        handler(payload);
        unsubscribe();
      });
      return unsubscribe;
    },

    off<K extends keyof TEvents>(event: K, handler?: EventHandler<TEvents[K]>): void {
      const handlers = listeners.get(event);
      if (!handlers) return;

      if (handler) {
        handlers.delete(handler as EventHandler<TEvents[keyof TEvents]>);
      } else {
        handlers.clear();
      }
    },

    getListenerCount<K extends keyof TEvents>(event: K): number {
      const handlers = listeners.get(event);
      return handlers ? handlers.size : 0;
    },

    getActiveEvents(): (keyof TEvents)[] {
      return Array.from(listeners.keys()).filter((event) => {
        const handlers = listeners.get(event);
        return handlers && handlers.size > 0;
      });
    },

    hasListeners<K extends keyof TEvents>(event: K): boolean {
      const handlers = listeners.get(event);
      return handlers ? handlers.size > 0 : false;
    },

    getHistory(): EventHistoryEntry<TEvents>[] {
      return [...eventHistory];
    },

    getHistoryFor<K extends keyof TEvents>(event: K): EventHistoryEntry<TEvents, K>[] {
      return eventHistory.filter((entry) => entry.type === event) as EventHistoryEntry<
        TEvents,
        K
      >[];
    },

    clearHistory(): void {
      eventHistory.length = 0;
    },

    setConfig(newConfig: Partial<TypedEventBusConfig>): void {
      Object.assign(currentConfig, newConfig);
    },

    getConfig(): TypedEventBusConfig {
      return { ...currentConfig };
    },

    destroy(): void {
      listeners.clear();
      eventHistory.length = 0;
    },
  };
}

// Export singleton instance for convenience
export const typedGameEventBus = createTypedEventBus<TypedGameEvents>({
  enableLogging: process.env.NODE_ENV === "development",
  enableValidation: true,
  asyncHandlers: true,
});
