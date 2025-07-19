/**
 * Tests for TypedEventBus implementation
 */

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { createTypedEventBus, EventValidators, type TypedGameEvents } from "./typed-event-bus";

describe("TypedEventBus", () => {
  let eventBus: ReturnType<typeof createTypedEventBus<TypedGameEvents>>;

  beforeEach(() => {
    eventBus = createTypedEventBus<TypedGameEvents>({
      enableLogging: false,
      enableValidation: true,
    });
  });

  afterEach(() => {
    eventBus.destroy();
  });

  describe("Basic Event Handling", () => {
    it("should emit and handle events correctly", async () => {
      const handler = mock();
      const unsubscribe = eventBus.on("game:started", handler);

      await eventBus.emit("game:started", { timestamp: Date.now() });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ timestamp: expect.any(Number) });

      unsubscribe();
    });

    it("should handle multiple listeners for the same event", async () => {
      const handler1 = mock();
      const handler2 = mock();

      eventBus.on("game:started", handler1);
      eventBus.on("game:started", handler2);

      await eventBus.emit("game:started", { timestamp: Date.now() });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should handle once listeners correctly", async () => {
      const handler = mock();
      eventBus.once("game:started", handler);

      await eventBus.emit("game:started", { timestamp: Date.now() });
      await eventBus.emit("game:started", { timestamp: Date.now() });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should unsubscribe listeners correctly", async () => {
      const handler = mock();
      const unsubscribe = eventBus.on("game:started", handler);

      await eventBus.emit("game:started", { timestamp: Date.now() });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      await eventBus.emit("game:started", { timestamp: Date.now() });
      expect(handler).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct payload types at compile time", async () => {
      // This test verifies TypeScript compilation - runtime behavior is tested elsewhere
      const handler = mock();
      eventBus.on("piece:moved", handler);

      await eventBus.emit("piece:moved", {
        direction: "left",
        position: { x: 5, y: 10 },
        piece: {
          type: "T",
          position: { x: 5, y: 10 },
          rotation: 0,
          shape: [
            [1, 1, 1],
            [0, 1, 0],
          ],
        },
      });

      expect(handler).toHaveBeenCalledWith({
        direction: "left",
        position: { x: 5, y: 10 },
        piece: expect.objectContaining({
          type: "T",
          position: { x: 5, y: 10 },
          rotation: 0,
        }),
      });
    });

    it("should validate event payloads when validation is enabled", async () => {
      const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});

      // This should trigger validation warning for invalid payload
      await eventBus.emit("game:over", {
        finalScore: "invalid" as unknown as number, // Invalid type for testing
        totalLines: 10,
        level: 1,
        timestamp: Date.now(),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid payload for event game:over"),
        expect.any(Object),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Event History", () => {
    it("should track event history", async () => {
      await eventBus.emit("game:started", { timestamp: Date.now() });
      await eventBus.emit("game:paused", { isPaused: true, timestamp: Date.now() });

      const history = eventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe("game:started");
      expect(history[1].type).toBe("game:paused");
    });

    it("should filter history by event type", async () => {
      await eventBus.emit("game:started", { timestamp: Date.now() });
      await eventBus.emit("game:paused", { isPaused: true, timestamp: Date.now() });
      await eventBus.emit("game:started", { timestamp: Date.now() });

      const gameStartedHistory = eventBus.getHistoryFor("game:started");
      expect(gameStartedHistory).toHaveLength(2);
      expect(gameStartedHistory.every((entry) => entry.type === "game:started")).toBe(true);
    });

    it("should clear history", async () => {
      await eventBus.emit("game:started", { timestamp: Date.now() });
      expect(eventBus.getHistory()).toHaveLength(1);

      eventBus.clearHistory();
      expect(eventBus.getHistory()).toHaveLength(0);
    });

    it("should maintain history size limit", async () => {
      const smallEventBus = createTypedEventBus<TypedGameEvents>({
        maxHistorySize: 2,
      });

      await smallEventBus.emit("game:started", { timestamp: Date.now() });
      await smallEventBus.emit("game:paused", { isPaused: true, timestamp: Date.now() });
      await smallEventBus.emit("game:resumed", { timestamp: Date.now() });

      const history = smallEventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe("game:paused"); // First event should be removed
      expect(history[1].type).toBe("game:resumed");

      smallEventBus.destroy();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors in event handlers gracefully", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const errorHandler = mock().mockImplementation(() => {
        throw new Error("Handler error");
      });
      const normalHandler = mock();

      eventBus.on("game:started", errorHandler);
      eventBus.on("game:started", normalHandler);

      await eventBus.emit("game:started", { timestamp: Date.now() });

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(normalHandler).toHaveBeenCalledTimes(1); // Should still be called
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error in event handler"),
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should emit error events for handler failures", async () => {
      const errorEventHandler = mock();
      eventBus.on("error:game", errorEventHandler);

      const faultyHandler = mock().mockImplementation(() => {
        throw new Error("Test error");
      });
      eventBus.on("game:started", faultyHandler);

      await eventBus.emit("game:started", { timestamp: Date.now() });

      expect(errorEventHandler).toHaveBeenCalledWith({
        error: "Test error",
        code: "EVENT_HANDLER_ERROR",
        context: { eventType: "game:started" },
        recoverable: true,
      });
    });
  });

  describe("Utility Methods", () => {
    it("should return correct listener count", () => {
      expect(eventBus.getListenerCount("game:started")).toBe(0);

      const unsubscribe1 = eventBus.on("game:started", mock());
      const unsubscribe2 = eventBus.on("game:started", mock());

      expect(eventBus.getListenerCount("game:started")).toBe(2);

      unsubscribe1();
      expect(eventBus.getListenerCount("game:started")).toBe(1);

      unsubscribe2();
      expect(eventBus.getListenerCount("game:started")).toBe(0);
    });

    it("should return active events", () => {
      expect(eventBus.getActiveEvents()).toEqual([]);

      eventBus.on("game:started", mock());
      eventBus.on("game:paused", mock());

      const activeEvents = eventBus.getActiveEvents();
      expect(activeEvents).toContain("game:started");
      expect(activeEvents).toContain("game:paused");
      expect(activeEvents).toHaveLength(2);
    });

    it("should check if event has listeners", () => {
      expect(eventBus.hasListeners("game:started")).toBe(false);

      const unsubscribe = eventBus.on("game:started", mock());
      expect(eventBus.hasListeners("game:started")).toBe(true);

      unsubscribe();
      expect(eventBus.hasListeners("game:started")).toBe(false);
    });
  });

  describe("Configuration", () => {
    it("should update configuration", () => {
      const initialConfig = eventBus.getConfig();
      expect(initialConfig.enableLogging).toBe(false);

      eventBus.setConfig({ enableLogging: true });
      const updatedConfig = eventBus.getConfig();
      expect(updatedConfig.enableLogging).toBe(true);
    });

    it("should respect maxListeners configuration", () => {
      const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});

      eventBus.setConfig({ maxListeners: 2 });

      eventBus.on("game:started", mock());
      eventBus.on("game:started", mock());
      eventBus.on("game:started", mock()); // Should trigger warning

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Maximum listeners (2) reached"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Event Validators", () => {
    it("should validate piece:moved events correctly", () => {
      const validPayload = {
        direction: "left" as const,
        position: { x: 5, y: 10 },
        piece: {
          type: "T" as const,
          position: { x: 5, y: 10 },
          rotation: 0 as const,
          shape: [
            [1, 1, 1],
            [0, 1, 0],
          ],
        },
      };

      expect(EventValidators["piece:moved"](validPayload)).toBe(true);
      expect(EventValidators["piece:moved"]({ direction: "invalid" })).toBe(false);
      expect(EventValidators["piece:moved"](null)).toBe(false);
    });

    it("should validate game:over events correctly", () => {
      const validPayload = {
        finalScore: 1000,
        totalLines: 10,
        level: 2,
        timestamp: Date.now(),
      };

      expect(EventValidators["game:over"](validPayload)).toBe(true);
      expect(EventValidators["game:over"]({ finalScore: "invalid" })).toBe(false);
      expect(EventValidators["game:over"]({})).toBe(false);
    });

    it("should validate lines:cleared events correctly", () => {
      const validPayload = {
        lines: [18, 19] as const,
        lineCount: 2 as const,
        clearType: "double" as const,
        isTSpin: false,
        board: [
          [0, 0, 0],
          [1, 1, 1],
        ],
      };

      expect(EventValidators["lines:cleared"](validPayload)).toBe(true);
      expect(EventValidators["lines:cleared"]({ lineCount: 5 })).toBe(false);
      expect(EventValidators["lines:cleared"]({ clearType: "invalid" })).toBe(false);
    });
  });
});
