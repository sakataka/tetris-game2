/**
 * Game Event Bus - Migrated to use TypedEventBus
 * Central event hub for the event-driven architecture
 * Provides type-safe event handling and subscription management
 */

import type { GameEventPayload, GameEventType } from "./event-map";

// Re-export for external use
export type { GameEventType } from "./event-map";

import { createTypedEventBus, type TypedGameEvents } from "./typed-event-bus";

export type EventHandler<T extends GameEventType> = (
  payload: GameEventPayload<T>,
) => void | Promise<void>;
export type UnsubscribeFn = () => void;

export interface GameEventBusConfig {
  maxListeners?: number;
  enableLogging?: boolean;
  asyncHandlers?: boolean;
}

/**
 * Legacy GameEventBus interface for backward compatibility
 */
export interface GameEventBus {
  subscribe<T extends GameEventType>(eventType: T, handler: EventHandler<T>): UnsubscribeFn;
  once<T extends GameEventType>(eventType: T, handler: EventHandler<T>): UnsubscribeFn;
  emit<T extends GameEventType>(eventType: T, payload: GameEventPayload<T>): Promise<void>;
  emitSync<T extends GameEventType>(eventType: T, payload: GameEventPayload<T>): void;
  getHistory(): Array<{ type: GameEventType; payload: unknown }>;
  clearHistory(): void;
  removeAllListeners(eventType?: GameEventType): void;
  getListenerCount(eventType: GameEventType): number;
  getActiveEventTypes(): string[];
  setLogging(enabled: boolean): void;
  destroy(): void;
  findLegacyEventType(typedEventType: keyof TypedGameEvents): GameEventType | null;
}

/**
 * Event mapping between legacy and new typed events
 */
const LEGACY_TO_TYPED_EVENT_MAP: Record<GameEventType, keyof TypedGameEvents | null> = {
  // Game Control Events
  GAME_STARTED: "game:started",
  GAME_PAUSED: "game:paused",
  GAME_RESET: "game:reset",
  GAME_OVER: "game:over",

  // Movement Events - map to piece events
  MOVE_LEFT: "piece:moved",
  MOVE_RIGHT: "piece:moved",
  SOFT_DROP: "piece:moved",
  HARD_DROP: "piece:moved",
  ROTATE_CLOCKWISE: "piece:rotated",
  ROTATE_COUNTER_CLOCKWISE: "piece:rotated",
  ROTATE_180: "piece:rotated",
  HOLD_PIECE: "piece:held",

  // Game State Events
  PIECE_PLACED: "piece:locked",
  LINE_CLEARED: "lines:cleared",
  LEVEL_UP: "level:up",

  // AI Events
  AI_DECISION: "ai:decision",
  AI_ENABLED: "ai:enabled",
  AI_ERROR: "ai:error",

  // Animation Events
  ANIMATION_START: "animation:started",
  ANIMATION_END: "animation:completed",
  TETRIS_FLASH: "animation:started",

  // Score Events
  SCORE_UPDATE: "score:updated",
  COMBO_UPDATE: "combo:updated",

  // Settings Events
  SETTINGS_CHANGED: "settings:changed",

  // Performance Events
  PERFORMANCE_SAMPLE: "performance:sample",
};

/**
 * Reverse mapping for finding legacy event types from typed events
 */
const TYPED_TO_LEGACY_EVENT_MAP: Record<keyof TypedGameEvents, GameEventType[]> = {};

// Build reverse mapping
for (const [legacyType, typedType] of Object.entries(LEGACY_TO_TYPED_EVENT_MAP)) {
  if (typedType) {
    if (!TYPED_TO_LEGACY_EVENT_MAP[typedType]) {
      TYPED_TO_LEGACY_EVENT_MAP[typedType] = [];
    }
    TYPED_TO_LEGACY_EVENT_MAP[typedType].push(legacyType as GameEventType);
  }
}

/**
 * Transform legacy payload to typed payload
 */
function transformLegacyPayload(legacyEventType: GameEventType, legacyPayload: unknown): unknown {
  const typedEventType = LEGACY_TO_TYPED_EVENT_MAP[legacyEventType];

  if (!typedEventType) {
    return legacyPayload;
  }

  // Transform specific payloads based on event type
  switch (legacyEventType) {
    case "GAME_STARTED":
      return { timestamp: Date.now() };

    case "GAME_PAUSED":
      return {
        isPaused: (legacyPayload as { isPaused?: boolean })?.isPaused ?? true,
        timestamp: Date.now(),
      };

    case "GAME_RESET":
      return { timestamp: Date.now() };

    case "GAME_OVER": {
      const gameOverPayload = legacyPayload as {
        finalScore?: number;
        level?: number;
        totalLines?: number;
      };
      return {
        finalScore: gameOverPayload?.finalScore ?? 0,
        totalLines: gameOverPayload?.totalLines ?? 0,
        level: gameOverPayload?.level ?? 1,
        timestamp: Date.now(),
      };
    }

    case "MOVE_LEFT":
    case "MOVE_RIGHT":
    case "SOFT_DROP":
      return {
        direction:
          legacyEventType === "MOVE_LEFT"
            ? "left"
            : legacyEventType === "MOVE_RIGHT"
              ? "right"
              : "down",
        position: { x: 0, y: 0 }, // Default position
        piece: null, // Will be filled by actual implementation
      };

    case "AI_ERROR": {
      const aiErrorPayload = legacyPayload as { error?: string };
      return {
        error: aiErrorPayload?.error ?? "Unknown AI error",
        code: "AI_ERROR",
        recoverable: true,
      };
    }

    default:
      return legacyPayload;
  }
}

/**
 * Game Event Bus implementation using TypedEventBus
 */
export function createGameEventBus(config: GameEventBusConfig = {}): GameEventBus {
  // Create the underlying typed event bus
  const typedEventBus = createTypedEventBus<TypedGameEvents>({
    maxListeners: config.maxListeners,
    enableLogging: config.enableLogging,
    asyncHandlers: config.asyncHandlers,
  });

  return {
    /**
     * Subscribe to an event type
     */
    subscribe<T extends GameEventType>(eventType: T, handler: EventHandler<T>): UnsubscribeFn {
      const typedEventType = LEGACY_TO_TYPED_EVENT_MAP[eventType];

      if (typedEventType) {
        return typedEventBus.on(typedEventType, (payload) => {
          handler(payload as GameEventPayload<T>);
        });
      }

      // Fallback for unmapped events - only warn in development
      if (process.env.NODE_ENV === "development") {
        console.warn(`[GameEventBus] Legacy event type ${eventType} not mapped to typed event`);
      }
      return () => {};
    },

    /**
     * Subscribe to an event type with a once-only handler
     */
    once<T extends GameEventType>(eventType: T, handler: EventHandler<T>): UnsubscribeFn {
      const typedEventType = LEGACY_TO_TYPED_EVENT_MAP[eventType];

      if (typedEventType) {
        return typedEventBus.once(typedEventType, (payload) => {
          handler(payload as GameEventPayload<T>);
        });
      }

      // Fallback for unmapped events - only warn in development
      if (process.env.NODE_ENV === "development") {
        console.warn(`[GameEventBus] Legacy event type ${eventType} not mapped to typed event`);
      }
      return () => {};
    },

    /**
     * Emit an event
     */
    async emit<T extends GameEventType>(eventType: T, payload: GameEventPayload<T>): Promise<void> {
      const typedEventType = LEGACY_TO_TYPED_EVENT_MAP[eventType];

      if (typedEventType) {
        const transformedPayload = transformLegacyPayload(eventType, payload);
        await typedEventBus.emit(
          typedEventType,
          transformedPayload as TypedGameEvents[keyof TypedGameEvents],
        );
      } else if (process.env.NODE_ENV === "development") {
        console.warn(`[GameEventBus] Legacy event type ${eventType} not mapped to typed event`);
      }
    },

    /**
     * Emit an event synchronously (fire and forget)
     */
    emitSync<T extends GameEventType>(eventType: T, payload: GameEventPayload<T>): void {
      this.emit(eventType, payload).catch((error) => {
        console.error(`Error in sync event emission for ${eventType}:`, error);
      });
    },

    /**
     * Get event history
     */
    getHistory(): Array<{ type: GameEventType; payload: unknown }> {
      const typedHistory = typedEventBus.getHistory();

      // Transform typed history back to legacy format
      return typedHistory.map((entry) => ({
        type: this.findLegacyEventType(entry.type) || "GAME_STARTED",
        payload: entry.payload,
      }));
    },

    /**
     * Clear event history
     */
    clearHistory(): void {
      typedEventBus.clearHistory();
    },

    /**
     * Remove all listeners for a specific event type
     */
    removeAllListeners(eventType?: GameEventType): void {
      if (eventType) {
        const typedEventType = LEGACY_TO_TYPED_EVENT_MAP[eventType];
        if (typedEventType) {
          typedEventBus.off(typedEventType);
        }
      } else {
        typedEventBus.destroy();
      }
    },

    /**
     * Get listener count for an event type
     */
    getListenerCount(eventType: GameEventType): number {
      const typedEventType = LEGACY_TO_TYPED_EVENT_MAP[eventType];
      return typedEventType ? typedEventBus.getListenerCount(typedEventType) : 0;
    },

    /**
     * Get all event types with listeners
     */
    getActiveEventTypes(): string[] {
      const activeTypedEvents = typedEventBus.getActiveEvents();

      // Map back to legacy event types
      return activeTypedEvents
        .map((typedEvent) => this.findLegacyEventType(typedEvent))
        .filter(Boolean) as string[];
    },

    /**
     * Enable or disable logging
     */
    setLogging(enabled: boolean): void {
      typedEventBus.setConfig({ enableLogging: enabled });
    },

    /**
     * Destroy the event bus
     */
    destroy(): void {
      typedEventBus.destroy();
    },

    /**
     * Helper method to find legacy event type from typed event type
     */
    findLegacyEventType(typedEventType: keyof TypedGameEvents): GameEventType | null {
      const legacyTypes = TYPED_TO_LEGACY_EVENT_MAP[typedEventType];
      return legacyTypes && legacyTypes.length > 0 ? legacyTypes[0] : null;
    },
  };
}

// Export singleton instance for convenience
export const gameEventBus = createGameEventBus({
  enableLogging: process.env.NODE_ENV === "development",
  asyncHandlers: true,
});

// Export the typed event bus for direct usage
export { typedGameEventBus } from "./typed-event-bus";
