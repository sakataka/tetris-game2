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

/**
 * Game Event Bus implementation
 */
export class GameEventBus {
  private listeners = new Map<string, Set<EventHandler<any>>>();
  private config: Required<GameEventBusConfig>;
  private eventHistory: Array<{ type: GameEventType; payload: any }> = [];
  private maxHistorySize = 100;

  constructor(config: GameEventBusConfig = {}) {
    this.config = {
      maxListeners: config.maxListeners ?? 100,
      enableLogging: config.enableLogging ?? false,
      asyncHandlers: config.asyncHandlers ?? true,
    };
  }

  /**
   * Subscribe to an event type
   */
  public subscribe<T extends GameEventType>(eventType: T, handler: EventHandler<T>): UnsubscribeFn {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const handlers = this.listeners.get(eventType);
    if (!handlers) {
      this.listeners.set(eventType, new Set());
      return this.subscribe(eventType, handler);
    }

    if (handlers.size >= this.config.maxListeners) {
      console.warn(
        `Maximum listeners (${this.config.maxListeners}) reached for event type: ${eventType}`,
      );
    }

    handlers.add(handler as EventHandler<any>);

    if (this.config.enableLogging) {
      console.log(`[EventBus] Subscribed to ${eventType}`);
    }

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler<any>);
      if (this.config.enableLogging) {
        console.log(`[EventBus] Unsubscribed from ${eventType}`);
      }
    };
  }

  /**
   * Subscribe to an event type with a once-only handler
   */
  public once<T extends GameEventType>(eventType: T, handler: EventHandler<T>): UnsubscribeFn {
    const unsubscribe = this.subscribe(eventType, (payload) => {
      handler(payload);
      unsubscribe();
    });
    return unsubscribe;
  }

  /**
   * Emit an event
   */
  public async emit<T extends GameEventType>(
    eventType: T,
    payload: GameEventPayload<T>,
  ): Promise<void> {
    const event = { type: eventType, payload };

    // Store in history
    this.addToHistory(event);

    if (this.config.enableLogging) {
      console.log(`[EventBus] Emitting ${eventType}`, payload);
    }

    const handlers = this.listeners.get(eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Execute handlers
    if (this.config.asyncHandlers) {
      // Async execution - handlers run in parallel
      const promises = Array.from(handlers).map((handler) => this.executeHandler(handler, payload));
      await Promise.all(promises);
    } else {
      // Sync execution - handlers run sequentially
      for (const handler of handlers) {
        await this.executeHandler(handler, payload);
      }
    }
  }

  /**
   * Emit an event synchronously (fire and forget)
   */
  public emitSync<T extends GameEventType>(eventType: T, payload: GameEventPayload<T>): void {
    this.emit(eventType, payload).catch((error) => {
      console.error(`Error in event handler for ${eventType}:`, error);
    });
  }

  /**
   * Execute a handler with error handling
   */
  private async executeHandler(handler: EventHandler<any>, payload: any): Promise<void> {
    try {
      await handler(payload);
    } catch (error) {
      console.error("Error in event handler:", error);

      // Emit error event if it's not already an error event
      this.emitSync("AI_ERROR", {
        error: error instanceof Error ? error.message : "Unknown error in event handler",
        requestId: undefined,
      });
    }
  }

  /**
   * Add event to history
   */
  private addToHistory(event: { type: GameEventType; payload: any }): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   */
  public getHistory(): Array<{ type: GameEventType; payload: any }> {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Remove all listeners for a specific event type
   */
  public removeAllListeners(eventType?: GameEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for an event type
   */
  public getListenerCount(eventType: GameEventType): number {
    const handlers = this.listeners.get(eventType);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get all event types with listeners
   */
  public getActiveEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Enable or disable logging
   */
  public setLogging(enabled: boolean): void {
    this.config.enableLogging = enabled;
  }

  /**
   * Destroy the event bus
   */
  public destroy(): void {
    this.removeAllListeners();
    this.clearHistory();
  }
}

// Export singleton instance for convenience
export const gameEventBus = new GameEventBus({
  enableLogging: process.env.NODE_ENV === "development",
  asyncHandlers: true,
});
