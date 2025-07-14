/**
 * Game Event Bus
 * Central event hub for the event-driven architecture
 * Provides type-safe event handling and subscription management
 */

import type { AdvancedAIDecision } from "@/game/ai/core/advanced-ai-engine";
import type { AIDecision } from "@/game/ai/core/ai-engine";
// Import actual types from our codebase
import type { GameState } from "@/types/game";

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;
export type UnsubscribeFn = () => void;

export interface GameEventBase {
  type: string;
  timestamp?: number;
  source?: string;
}

export interface GameEventBusConfig {
  maxListeners?: number;
  enableLogging?: boolean;
  asyncHandlers?: boolean;
}

/**
 * Event types for the game
 */
export interface GameEvents {
  // AI Events
  AI_MOVE_REQUESTED: {
    type: "AI_MOVE_REQUESTED";
    payload: {
      gameState: GameState;
    };
  };
  AI_MOVE_CALCULATED: {
    type: "AI_MOVE_CALCULATED";
    payload: {
      result: AIDecision | AdvancedAIDecision;
      responseTime: number;
      source: "worker" | "main-thread";
    };
  };
  AI_ERROR: {
    type: "AI_ERROR";
    payload: {
      message: string;
      code: string;
      source: "worker" | "main-thread";
    };
  };
  AI_DIFFICULTY_CHANGED: {
    type: "AI_DIFFICULTY_CHANGED";
    payload: {
      difficulty: "easy" | "medium" | "hard" | "expert";
    };
  };

  // Worker Events
  WORKER_INITIALIZED: {
    type: "WORKER_INITIALIZED";
    payload: {
      version: string;
      capabilities: string[];
    };
  };
  WORKER_ERROR: {
    type: "WORKER_ERROR";
    payload: {
      message: string;
      code: string;
    };
  };
  WORKER_TERMINATED: {
    type: "WORKER_TERMINATED";
    payload: {
      reason: string;
    };
  };

  // Game Events
  POSITION_NEEDS_EVALUATION: {
    type: "POSITION_NEEDS_EVALUATION";
    payload: {
      gameState: GameState;
    };
  };
}

export type GameEventType = keyof GameEvents;
export type GameEvent = GameEvents[GameEventType];

/**
 * Game Event Bus implementation
 */
export class GameEventBus {
  private listeners = new Map<string, Set<EventHandler>>();
  private config: Required<GameEventBusConfig>;
  private eventHistory: GameEvent[] = [];
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
  public subscribe<T extends GameEventType>(
    eventType: T,
    handler: EventHandler<GameEvents[T]>,
  ): UnsubscribeFn {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const handlers = this.listeners.get(eventType)!;

    if (handlers.size >= this.config.maxListeners) {
      console.warn(
        `Maximum listeners (${this.config.maxListeners}) reached for event type: ${eventType}`,
      );
    }

    handlers.add(handler as EventHandler);

    if (this.config.enableLogging) {
      console.log(`[EventBus] Subscribed to ${eventType}`);
    }

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler);
      if (this.config.enableLogging) {
        console.log(`[EventBus] Unsubscribed from ${eventType}`);
      }
    };
  }

  /**
   * Subscribe to an event type with a once-only handler
   */
  public once<T extends GameEventType>(
    eventType: T,
    handler: EventHandler<GameEvents[T]>,
  ): UnsubscribeFn {
    const unsubscribe = this.subscribe(eventType, (event) => {
      handler(event);
      unsubscribe();
    });
    return unsubscribe;
  }

  /**
   * Emit an event
   */
  public async emit<T extends GameEventType>(event: GameEvents[T]): Promise<void> {
    // Add timestamp if not present
    if (!("timestamp" in event)) {
      (event as any).timestamp = Date.now();
    }

    // Store in history
    this.addToHistory(event);

    if (this.config.enableLogging) {
      console.log(`[EventBus] Emitting ${event.type}`, event);
    }

    const handlers = this.listeners.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Execute handlers
    if (this.config.asyncHandlers) {
      // Async execution - handlers run in parallel
      const promises = Array.from(handlers).map((handler) => this.executeHandler(handler, event));
      await Promise.all(promises);
    } else {
      // Sync execution - handlers run sequentially
      for (const handler of handlers) {
        await this.executeHandler(handler, event);
      }
    }
  }

  /**
   * Emit an event synchronously (fire and forget)
   */
  public emitSync<T extends GameEventType>(event: GameEvents[T]): void {
    this.emit(event).catch((error) => {
      console.error(`Error in event handler for ${event.type}:`, error);
    });
  }

  /**
   * Execute a handler with error handling
   */
  private async executeHandler(handler: EventHandler, event: GameEvent): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      console.error(`Error in event handler for ${event.type}:`, error);

      // Emit error event if it's not already an error event
      if (event.type !== "AI_ERROR" && event.type !== "WORKER_ERROR") {
        this.emitSync({
          type: "AI_ERROR",
          payload: {
            message: error instanceof Error ? error.message : "Unknown error in event handler",
            code: "EVENT_HANDLER_ERROR",
            source: "main-thread",
          },
        });
      }
    }
  }

  /**
   * Add event to history
   */
  private addToHistory(event: GameEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   */
  public getHistory(): readonly GameEvent[] {
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
