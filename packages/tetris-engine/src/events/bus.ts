/**
 * Type-safe Game Event System
 * Provides O(1) subscription lookup and strong typing for event payloads
 */

import type { EventHandler, GameEvent, UnsubscribeFunction } from "../types.js";

/**
 * Game Event Bus implementation
 * Provides type-safe, high-performance event subscription and emission
 */
export class GameEventBus {
  private subscribers = new Map<string, Set<EventHandler<GameEvent>>>();
  private isEmitting = false;
  private queuedEvents: GameEvent[] = [];

  /**
   * Subscribe to a specific event type with type safety
   * @param eventType Event type to subscribe to
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  subscribe<T extends GameEvent["type"]>(
    eventType: T,
    handler: EventHandler<Extract<GameEvent, { type: T }>>,
  ): UnsubscribeFunction {
    // Get or create subscriber set for this event type
    let handlers = this.subscribers.get(eventType);
    if (!handlers) {
      handlers = new Set();
      this.subscribers.set(eventType, handlers);
    }

    // Add handler with type assertion (safe due to Extract type)
    handlers.add(handler as EventHandler<GameEvent>);

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.subscribers.get(eventType);
      if (currentHandlers) {
        currentHandlers.delete(handler as EventHandler<GameEvent>);
        // Clean up empty sets to prevent memory leaks
        if (currentHandlers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers
   * @param event Event to emit
   */
  emit(event: GameEvent): void {
    // Add timestamp if not present
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp ?? performance.now(),
    };

    // Prevent recursive emission by queueing events during emission
    if (this.isEmitting) {
      this.queuedEvents.push(eventWithTimestamp);
      return;
    }

    this.isEmitting = true;

    try {
      this.emitEvent(eventWithTimestamp);

      // Process any queued events
      while (this.queuedEvents.length > 0) {
        const queuedEvent = this.queuedEvents.shift();
        if (queuedEvent) {
          this.emitEvent(queuedEvent);
        }
      }
    } finally {
      this.isEmitting = false;
    }
  }

  /**
   * Emit an event synchronously without timestamp
   * @param event Event to emit
   */
  emitSync(event: GameEvent): void {
    this.emitEvent(event);
  }

  /**
   * Get all subscribers for a specific event type
   * @param eventType Event type
   * @returns Array of handlers
   */
  getSubscribers<T extends GameEvent["type"]>(
    eventType: T,
  ): EventHandler<Extract<GameEvent, { type: T }>>[] {
    const handlers = this.subscribers.get(eventType);
    return handlers
      ? (Array.from(handlers) as EventHandler<Extract<GameEvent, { type: T }>>[])
      : [];
  }

  /**
   * Check if there are any subscribers for a specific event type
   * @param eventType Event type
   * @returns true if there are subscribers
   */
  hasSubscribers(eventType: GameEvent["type"]): boolean {
    const handlers = this.subscribers.get(eventType);
    return handlers !== undefined && handlers.size > 0;
  }

  /**
   * Remove all subscribers for a specific event type
   * @param eventType Event type to clear
   */
  clearSubscribers(eventType: GameEvent["type"]): void {
    this.subscribers.delete(eventType);
  }

  /**
   * Remove all subscribers for all event types
   */
  clearAllSubscribers(): void {
    this.subscribers.clear();
  }

  /**
   * Get the number of subscribers for a specific event type
   * @param eventType Event type
   * @returns Number of subscribers
   */
  getSubscriberCount(eventType: GameEvent["type"]): number {
    const handlers = this.subscribers.get(eventType);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get all event types that have subscribers
   * @returns Array of event types
   */
  getEventTypes(): GameEvent["type"][] {
    return Array.from(this.subscribers.keys()) as GameEvent["type"][];
  }

  /**
   * Get total number of subscribers across all event types
   * @returns Total subscriber count
   */
  getTotalSubscriberCount(): number {
    let total = 0;
    for (const handlers of this.subscribers.values()) {
      total += handlers.size;
    }
    return total;
  }

  /**
   * Subscribe to multiple event types with the same handler
   * @param eventTypes Array of event types
   * @param handler Event handler function
   * @returns Unsubscribe function that removes all subscriptions
   */
  subscribeToMultiple<T extends GameEvent["type"]>(
    eventTypes: T[],
    handler: EventHandler<Extract<GameEvent, { type: T }>>,
  ): UnsubscribeFunction {
    const unsubscribeFunctions = eventTypes.map((eventType) => this.subscribe(eventType, handler));

    return () => {
      for (const unsubscribe of unsubscribeFunctions) {
        unsubscribe();
      }
    };
  }

  /**
   * Subscribe to an event type only once (auto-unsubscribe after first emission)
   * @param eventType Event type to subscribe to
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  subscribeOnce<T extends GameEvent["type"]>(
    eventType: T,
    handler: EventHandler<Extract<GameEvent, { type: T }>>,
  ): UnsubscribeFunction {
    const unsubscribe = this.subscribe(eventType, (event) => {
      handler(event);
      unsubscribe();
    });

    return unsubscribe;
  }

  private emitEvent(event: GameEvent): void {
    const handlers = this.subscribers.get(event.type);
    if (!handlers) return;

    // Create a copy of handlers to avoid issues if handlers are modified during emission
    const handlersArray = Array.from(handlers);

    for (const handler of handlersArray) {
      try {
        handler(event);
      } catch (error) {
        // Log error but don't stop other handlers
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }
}

/**
 * Creates a new GameEventBus instance
 * @returns New GameEventBus instance
 */
export const createEventBus = (): GameEventBus => {
  return new GameEventBus();
};

/**
 * Global event bus instance for convenience
 * Note: Use with caution in multi-instance scenarios
 */
export const globalEventBus = new GameEventBus();
