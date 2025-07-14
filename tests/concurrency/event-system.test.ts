import { beforeEach, describe, expect, it } from "bun:test";

/**
 * Mock Event Bus for Testing
 * In a real implementation, this would import from the actual event system
 */
interface GameEvent {
  type: string;
  payload: any;
  timestamp?: number;
}

type EventHandler = (event: GameEvent) => void;

class GameEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventQueue: GameEvent[] = [];
  private isProcessing = false;
  private maxRecursionDepth = 100;
  private currentRecursionDepth = 0;

  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  emit(event: GameEvent): void {
    event.timestamp = Date.now();

    // Add to queue to prevent immediate recursion
    this.eventQueue.push(event);

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private processQueue(): void {
    this.isProcessing = true;
    this.currentRecursionDepth = 0;

    while (this.eventQueue.length > 0 && this.currentRecursionDepth < this.maxRecursionDepth) {
      const event = this.eventQueue.shift()!;
      this.processEvent(event);
      this.currentRecursionDepth++;
    }

    this.isProcessing = false;
  }

  private processEvent(event: GameEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      // Create a copy to handle concurrent modifications
      const handlersCopy = new Set(handlers);

      for (const handler of handlersCopy) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      }
    }
  }

  clear(): void {
    this.handlers.clear();
    this.eventQueue.length = 0;
    this.isProcessing = false;
    this.currentRecursionDepth = 0;
  }

  getQueueSize(): number {
    return this.eventQueue.length;
  }

  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size || 0;
  }
}

/**
 * Mock State Manager for Concurrency Testing
 */
class ConcurrentStateManager {
  private state: any = {};
  private updateQueue: Array<() => void> = [];
  private isUpdating = false;
  private subscribers: Set<(state: any) => void> = new Set();

  getState(): any {
    return { ...this.state };
  }

  setState(updates: any): void {
    this.updateQueue.push(() => {
      this.state = { ...this.state, ...updates };
      this.notifySubscribers();
    });

    if (!this.isUpdating) {
      this.processUpdates();
    }
  }

  private processUpdates(): void {
    this.isUpdating = true;

    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift()!;
      update();
    }

    this.isUpdating = false;
  }

  subscribe(callback: (state: any) => void): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const currentState = this.getState();

    for (const subscriber of this.subscribers) {
      try {
        subscriber(currentState);
      } catch (error) {
        console.error("Error in state subscriber:", error);
      }
    }
  }

  clear(): void {
    this.state = {};
    this.updateQueue.length = 0;
    this.isUpdating = false;
    this.subscribers.clear();
  }
}

describe("Concurrency and Race Condition Tests", () => {
  let eventBus: GameEventBus;
  let stateManager: ConcurrentStateManager;

  beforeEach(() => {
    eventBus = new GameEventBus();
    stateManager = new ConcurrentStateManager();
  });

  describe("Event System Concurrency", () => {
    it("should handle rapid concurrent event emissions", async () => {
      const receivedEvents: GameEvent[] = [];
      const eventCount = 1000;
      const receivedCounters = new Map<string, number>();

      // Subscribe to events
      eventBus.subscribe("PIECE_PLACED", (event) => {
        receivedEvents.push(event);
        const id = event.payload.id;
        receivedCounters.set(id, (receivedCounters.get(id) || 0) + 1);
      });

      // Emit events rapidly from multiple "threads" (setTimeout simulates async)
      const promises = Array.from({ length: eventCount }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            eventBus.emit({
              type: "PIECE_PLACED",
              payload: {
                id: `piece-${i}`,
                piece: "T",
                position: { x: i % 10, y: i % 20 },
                rotation: i % 4,
              },
            });
            resolve();
          }, Math.random() * 10); // Random delay up to 10ms
        });
      });

      await Promise.all(promises);

      // Wait a bit for all events to be processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedEvents.length).toBe(eventCount);

      // Verify all events were received exactly once
      for (let i = 0; i < eventCount; i++) {
        const id = `piece-${i}`;
        expect(receivedCounters.get(id)).toBe(1);
      }

      // Verify all events have timestamps
      for (const event of receivedEvents) {
        expect(event.timestamp).toBeGreaterThan(0);
      }
    });

    it("should handle subscription/unsubscription during emission", async () => {
      let handlerCallCount = 0;
      const events: Array<{ handler: number; event: GameEvent }> = [];

      const handler1 = (event: GameEvent) => {
        handlerCallCount++;
        events.push({ handler: 1, event });
      };

      const handler2 = (event: GameEvent) => {
        handlerCallCount++;
        events.push({ handler: 2, event });
      };

      // Subscribe handlers
      const unsubscribe1 = eventBus.subscribe("LINE_CLEARED", handler1);
      const unsubscribe2 = eventBus.subscribe("LINE_CLEARED", handler2);

      // Emit events while modifying subscriptions
      const emitPromises = [];
      for (let i = 0; i < 100; i++) {
        emitPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              eventBus.emit({
                type: "LINE_CLEARED",
                payload: { lines: 1, positions: [i], score: 100 },
              });

              // Randomly unsubscribe/resubscribe during emission
              if (i === 25) unsubscribe1();
              if (i === 50) {
                eventBus.subscribe("LINE_CLEARED", handler1);
              }
              if (i === 75) unsubscribe2();

              resolve();
            }, i % 5); // Stagger emissions
          }),
        );
      }

      await Promise.all(emitPromises);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have received events without crashes
      expect(handlerCallCount).toBeGreaterThan(0);
      expect(events.length).toBeGreaterThan(0);

      // Events before unsubscription should have both handlers
      const earlyEvents = events.filter((e) => e.event.payload.positions[0] < 25);
      const handler1EarlyEvents = earlyEvents.filter((e) => e.handler === 1);
      const handler2EarlyEvents = earlyEvents.filter((e) => e.handler === 2);

      expect(handler1EarlyEvents.length).toBe(handler2EarlyEvents.length);
    });

    it("should prevent infinite recursion in event handlers", () => {
      let recursionCount = 0;
      const maxRecursions = 100;

      eventBus.subscribe("TEST_EVENT", () => {
        recursionCount++;

        if (recursionCount < maxRecursions) {
          // Handler emits the same event type
          eventBus.emit({
            type: "TEST_EVENT",
            payload: { count: recursionCount },
          });
        }
      });

      // This should not cause infinite recursion
      expect(() => {
        eventBus.emit({
          type: "TEST_EVENT",
          payload: { count: 0 },
        });
      }).not.toThrow();

      // Should have processed events in queue
      expect(recursionCount).toBe(maxRecursions);
    });

    it("should handle multiple event types concurrently", async () => {
      const eventTypes = ["MOVE_LEFT", "MOVE_RIGHT", "ROTATE", "DROP", "HOLD"];
      const receivedEvents = new Map<string, number>();

      // Subscribe to all event types
      eventTypes.forEach((type) => {
        eventBus.subscribe(type, (event) => {
          receivedEvents.set(type, (receivedEvents.get(type) || 0) + 1);
        });
      });

      // Emit multiple event types concurrently
      const promises = [];
      for (let i = 0; i < 500; i++) {
        const eventType = eventTypes[i % eventTypes.length];
        promises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              eventBus.emit({
                type: eventType,
                payload: { iteration: i },
              });
              resolve();
            }, Math.random() * 20);
          }),
        );
      }

      await Promise.all(promises);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Each event type should have received exactly 100 events
      eventTypes.forEach((type) => {
        expect(receivedEvents.get(type)).toBe(100);
      });
    });
  });

  describe("State Management Concurrency", () => {
    it("should handle concurrent state updates", async () => {
      const updateCount = 500;
      const finalValues = new Set<number>();

      // Set up subscriber to track final values
      stateManager.subscribe((state) => {
        if (state.counter !== undefined) {
          finalValues.add(state.counter);
        }
      });

      // Perform concurrent state updates
      const promises = Array.from({ length: updateCount }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            stateManager.setState({ counter: i });
            resolve();
          }, Math.random() * 10);
        });
      });

      await Promise.all(promises);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have received one of the valid final values
      const finalState = stateManager.getState();
      expect(finalState.counter).toBeGreaterThanOrEqual(0);
      expect(finalState.counter).toBeLessThan(updateCount);
    });

    it("should maintain state consistency during rapid updates", async () => {
      let updateCount = 0;
      const stateHistory: any[] = [];

      stateManager.subscribe((state) => {
        updateCount++;
        stateHistory.push({ ...state, updateId: updateCount });
      });

      // Perform rapid state updates with different properties
      const updates = [
        { score: 100 },
        { level: 1 },
        { lines: 5 },
        { score: 200, level: 2 },
        { lines: 10, gameOver: false },
      ];

      const promises = updates.map(
        (update, i) =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              stateManager.setState(update);
              resolve();
            }, i * 2);
          }),
      );

      await Promise.all(promises);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Final state should contain all updates
      const finalState = stateManager.getState();
      expect(finalState.score).toBe(200);
      expect(finalState.level).toBe(2);
      expect(finalState.lines).toBe(10);
      expect(finalState.gameOver).toBe(false);

      // All state updates should have been processed
      expect(updateCount).toBeGreaterThan(0);
    });

    it("should handle subscriber modifications during state updates", async () => {
      const subscribers: Array<(state: any) => void> = [];
      let totalNotifications = 0;

      // Create initial subscribers
      for (let i = 0; i < 5; i++) {
        const subscriber = (state: any) => {
          totalNotifications++;

          // Some subscribers modify the subscription list
          if (state.counter === 10 && i === 0) {
            // Add new subscriber
            const newSub = () => totalNotifications++;
            stateManager.subscribe(newSub);
          }

          if (state.counter === 20 && i === 1) {
            // Remove this subscriber
            unsubscribers[i]();
          }
        };

        subscribers.push(subscriber);
      }

      const unsubscribers = subscribers.map((sub) => stateManager.subscribe(sub));

      // Perform state updates
      for (let i = 0; i < 50; i++) {
        stateManager.setState({ counter: i });
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have processed updates without crashing
      expect(totalNotifications).toBeGreaterThan(0);
    });
  });

  describe("Cross-Component Race Conditions", () => {
    it("should handle concurrent game actions", async () => {
      const gameActions = [
        "MOVE_LEFT",
        "MOVE_RIGHT",
        "ROTATE_CW",
        "ROTATE_CCW",
        "SOFT_DROP",
        "HARD_DROP",
        "HOLD_PIECE",
      ];

      const actionResults: string[] = [];
      const gameState = {
        currentPiece: { x: 4, y: 0, type: "T", rotation: 0 },
        board: Array.from({ length: 20 }, () => Array(10).fill(0)),
        score: 0,
        isGameOver: false,
      };

      // Subscribe to game actions
      gameActions.forEach((action) => {
        eventBus.subscribe(action, (event) => {
          actionResults.push(action);

          // Simulate state update based on action
          stateManager.setState({
            lastAction: action,
            timestamp: event.timestamp,
          });
        });
      });

      // Emit concurrent game actions
      const promises = Array.from({ length: 200 }, (_, i) => {
        const action = gameActions[i % gameActions.length];

        return new Promise<void>((resolve) => {
          setTimeout(() => {
            eventBus.emit({
              type: action,
              payload: { gameState, actionId: i },
            });
            resolve();
          }, Math.random() * 30);
        });
      });

      await Promise.all(promises);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have processed all actions
      expect(actionResults.length).toBe(200);

      // Each action type should appear the expected number of times
      gameActions.forEach((action) => {
        const count = actionResults.filter((a) => a === action).length;
        expect(count).toBeGreaterThan(0);
      });

      // State should reflect some final action
      const finalState = stateManager.getState();
      expect(gameActions.includes(finalState.lastAction)).toBe(true);
    });

    it("should prevent race conditions in AI processing", async () => {
      const aiRequests: Array<{ id: string; processed: boolean }> = [];
      let processingCount = 0;
      let completedCount = 0;

      // Simulate AI request handler
      eventBus.subscribe("AI_PROCESS_REQUEST", async (event) => {
        const requestId = event.payload.requestId;
        processingCount++;

        // Simulate AI processing time
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));

        // Mark as completed
        completedCount++;
        const request = aiRequests.find((r) => r.id === requestId);
        if (request) {
          request.processed = true;
        }

        // Emit completion event
        eventBus.emit({
          type: "AI_PROCESS_COMPLETE",
          payload: { requestId, result: "best_move" },
        });
      });

      // Generate concurrent AI requests
      const promises = Array.from({ length: 50 }, (_, i) => {
        const requestId = `ai-request-${i}`;
        aiRequests.push({ id: requestId, processed: false });

        return new Promise<void>((resolve) => {
          setTimeout(() => {
            eventBus.emit({
              type: "AI_PROCESS_REQUEST",
              payload: { requestId, boardState: "mock_board" },
            });
            resolve();
          }, Math.random() * 50);
        });
      });

      await Promise.all(promises);

      // Wait for all AI processing to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // All requests should have been processed
      expect(completedCount).toBe(50);
      expect(aiRequests.every((req) => req.processed)).toBe(true);
    });
  });

  describe("Memory Management Under Concurrency", () => {
    it("should not leak event handlers during concurrent operations", async () => {
      const initialHandlerCount = eventBus.getHandlerCount("MEMORY_TEST");
      const unsubscribers: Array<() => void> = [];

      // Create and remove handlers concurrently
      const promises = Array.from({ length: 100 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const unsubscribe = eventBus.subscribe("MEMORY_TEST", () => {});
            unsubscribers.push(unsubscribe);

            // Remove half of the handlers
            if (i % 2 === 0 && i > 0) {
              const toRemove = unsubscribers.shift();
              if (toRemove) toRemove();
            }

            resolve();
          }, Math.random() * 10);
        });
      });

      await Promise.all(promises);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Clean up remaining handlers
      unsubscribers.forEach((unsub) => unsub());

      const finalHandlerCount = eventBus.getHandlerCount("MEMORY_TEST");
      expect(finalHandlerCount).toBe(initialHandlerCount);
    });

    it("should handle state subscriber cleanup properly", async () => {
      const subscribers: Array<() => void> = [];
      let notificationCount = 0;

      // Create multiple subscribers
      for (let i = 0; i < 20; i++) {
        const unsubscribe = stateManager.subscribe(() => {
          notificationCount++;
        });
        subscribers.push(unsubscribe);
      }

      // Update state to trigger notifications
      stateManager.setState({ test: "value" });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const initialNotifications = notificationCount;

      // Remove all subscribers
      subscribers.forEach((unsub) => unsub());

      // Update state again
      stateManager.setState({ test: "value2" });
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not have received additional notifications
      expect(notificationCount).toBe(initialNotifications);
    });
  });
});
