/**
 * Game Event Bus
 * Central event hub for the event-driven architecture
 * Provides type-safe event handling and subscription management
 */

import type { GameEventPayload, GameEventType } from "./event-map";

export type EventHandler<T extends GameEventType> = (
  payload: GameEventPayload<T>,
) => void | Promise<void>;
export type UnsubscribeFn = () => void;

export interface GameEventBusConfig {
  maxListeners?: number;
  enableLogging?: boolean;
  asyncHandlers?: boolean;
}

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
}

/**
 * Game Event Bus implementation
 */
export function createGameEventBus(config: GameEventBusConfig = {}): GameEventBus {
  const listeners = new Map<string, Set<EventHandler<GameEventType>>>();
  const eventHistory: Array<{ type: GameEventType; payload: unknown }> = [];
  const maxHistorySize = 100;

  const currentConfig: Required<GameEventBusConfig> = {
    maxListeners: config.maxListeners ?? 100,
    enableLogging: config.enableLogging ?? false,
    asyncHandlers: config.asyncHandlers ?? true,
  };

  /**
   * Execute a handler with error handling
   */
  const executeHandler = async (
    handler: EventHandler<GameEventType>,
    payload: unknown,
  ): Promise<void> => {
    try {
      await handler(payload as GameEventPayload<GameEventType>);
    } catch (error) {
      console.error("Error in event handler:", error);

      // Emit error event if it's not already an error event
      emitSync("AI_ERROR", {
        error: error instanceof Error ? error.message : "Unknown error in event handler",
      });
    }
  };

  /**
   * Add event to history
   */
  const addToHistory = (event: { type: GameEventType; payload: unknown }): void => {
    eventHistory.push(event);
    if (eventHistory.length > maxHistorySize) {
      eventHistory.shift();
    }
  };

  const emitSync = <T extends GameEventType>(eventType: T, payload: GameEventPayload<T>): void => {
    emit(eventType, payload).catch((error) => {
      console.error(`Error in event handler for ${eventType}:`, error);
    });
  };

  const emit = async <T extends GameEventType>(
    eventType: T,
    payload: GameEventPayload<T>,
  ): Promise<void> => {
    const event = { type: eventType, payload };

    // Store in history
    addToHistory(event);

    if (currentConfig.enableLogging) {
      console.log(`[EventBus] Emitting ${eventType}`, payload);
    }

    const handlers = listeners.get(eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Execute handlers
    if (currentConfig.asyncHandlers) {
      // Async execution - handlers run in parallel
      const promises = Array.from(handlers).map((handler) => executeHandler(handler, payload));
      await Promise.all(promises);
    } else {
      // Sync execution - handlers run sequentially
      for (const handler of handlers) {
        await executeHandler(handler, payload);
      }
    }
  };

  return {
    /**
     * Subscribe to an event type
     */
    subscribe<T extends GameEventType>(eventType: T, handler: EventHandler<T>): UnsubscribeFn {
      if (!listeners.has(eventType)) {
        listeners.set(eventType, new Set());
      }

      const handlers = listeners.get(eventType);
      if (!handlers) {
        listeners.set(eventType, new Set());
        return this.subscribe(eventType, handler);
      }

      if (handlers.size >= currentConfig.maxListeners) {
        console.warn(
          `Maximum listeners (${currentConfig.maxListeners}) reached for event type: ${eventType}`,
        );
      }

      handlers.add(handler as EventHandler<GameEventType>);

      if (currentConfig.enableLogging) {
        console.log(`[EventBus] Subscribed to ${eventType}`);
      }

      // Return unsubscribe function
      return () => {
        handlers.delete(handler as EventHandler<GameEventType>);
        if (currentConfig.enableLogging) {
          console.log(`[EventBus] Unsubscribed from ${eventType}`);
        }
      };
    },

    /**
     * Subscribe to an event type with a once-only handler
     */
    once<T extends GameEventType>(eventType: T, handler: EventHandler<T>): UnsubscribeFn {
      const unsubscribe = this.subscribe(eventType, (payload) => {
        handler(payload);
        unsubscribe();
      });
      return unsubscribe;
    },

    /**
     * Emit an event
     */
    emit,

    /**
     * Emit an event synchronously (fire and forget)
     */
    emitSync,

    /**
     * Get event history
     */
    getHistory(): Array<{ type: GameEventType; payload: unknown }> {
      return [...eventHistory];
    },

    /**
     * Clear event history
     */
    clearHistory(): void {
      eventHistory.length = 0;
    },

    /**
     * Remove all listeners for a specific event type
     */
    removeAllListeners(eventType?: GameEventType): void {
      if (eventType) {
        listeners.delete(eventType);
      } else {
        listeners.clear();
      }
    },

    /**
     * Get listener count for an event type
     */
    getListenerCount(eventType: GameEventType): number {
      const handlers = listeners.get(eventType);
      return handlers ? handlers.size : 0;
    },

    /**
     * Get all event types with listeners
     */
    getActiveEventTypes(): string[] {
      return Array.from(listeners.keys());
    },

    /**
     * Enable or disable logging
     */
    setLogging(enabled: boolean): void {
      currentConfig.enableLogging = enabled;
    },

    /**
     * Destroy the event bus
     */
    destroy(): void {
      this.removeAllListeners();
      this.clearHistory();
    },
  };
}

// Export singleton instance for convenience
export const gameEventBus = createGameEventBus({
  enableLogging: process.env.NODE_ENV === "development",
  asyncHandlers: true,
});
