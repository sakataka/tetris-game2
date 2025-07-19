/**
 * Tests for migrated GameEventBus implementation
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { GameEventType } from "./event-map";
import { createGameEventBus, gameEventBus } from "./game-event-bus";

describe("Migrated GameEventBus", () => {
  let eventBus: ReturnType<typeof createGameEventBus>;

  beforeEach(() => {
    eventBus = createGameEventBus({
      enableLogging: false,
      asyncHandlers: true,
    });
  });

  afterEach(() => {
    eventBus.destroy();
  });

  describe("Legacy Event Compatibility", () => {
    it("should handle GAME_STARTED events", async () => {
      const handler = mock();
      const unsubscribe = eventBus.subscribe("GAME_STARTED", handler);

      await eventBus.emit("GAME_STARTED", undefined);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ timestamp: expect.any(Number) });

      unsubscribe();
    });

    it("should handle GAME_PAUSED events", async () => {
      const handler = mock();
      eventBus.subscribe("GAME_PAUSED", handler);

      await eventBus.emit("GAME_PAUSED", { isPaused: true });

      expect(handler).toHaveBeenCalledWith({
        isPaused: true,
        timestamp: expect.any(Number),
      });
    });

    it("should handle GAME_OVER events", async () => {
      const handler = mock();
      eventBus.subscribe("GAME_OVER", handler);

      await eventBus.emit("GAME_OVER", { finalScore: 1000, level: 5 });

      expect(handler).toHaveBeenCalledWith({
        finalScore: 1000,
        totalLines: 0, // totalLines defaults to 0 if not provided
        level: 5,
        timestamp: expect.any(Number),
      });
    });

    it("should handle movement events", async () => {
      const handler = mock();
      eventBus.subscribe("MOVE_LEFT", handler);

      await eventBus.emit("MOVE_LEFT", undefined);

      expect(handler).toHaveBeenCalledWith({
        direction: "left",
        position: { x: 0, y: 0 },
        piece: null,
      });
    });

    it("should handle AI_ERROR events", async () => {
      const handler = mock();
      eventBus.subscribe("AI_ERROR", handler);

      await eventBus.emit("AI_ERROR", { error: "Test AI error" });

      expect(handler).toHaveBeenCalledWith({
        error: "Test AI error",
        code: "AI_ERROR",
        recoverable: true,
      });
    });
  });

  describe("Event History", () => {
    it("should track event history", async () => {
      await eventBus.emit("GAME_STARTED", undefined);
      await eventBus.emit("GAME_PAUSED", { isPaused: true });

      const history = eventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe("GAME_STARTED");
      expect(history[1].type).toBe("GAME_PAUSED");
    });

    it("should clear history", async () => {
      await eventBus.emit("GAME_STARTED", undefined);
      expect(eventBus.getHistory()).toHaveLength(1);

      eventBus.clearHistory();
      expect(eventBus.getHistory()).toHaveLength(0);
    });
  });

  describe("Listener Management", () => {
    it("should return correct listener count", () => {
      expect(eventBus.getListenerCount("GAME_STARTED")).toBe(0);

      const unsubscribe1 = eventBus.subscribe("GAME_STARTED", mock());
      const unsubscribe2 = eventBus.subscribe("GAME_STARTED", mock());

      expect(eventBus.getListenerCount("GAME_STARTED")).toBe(2);

      unsubscribe1();
      expect(eventBus.getListenerCount("GAME_STARTED")).toBe(1);

      unsubscribe2();
      expect(eventBus.getListenerCount("GAME_STARTED")).toBe(0);
    });

    it("should return active event types", () => {
      expect(eventBus.getActiveEventTypes()).toEqual([]);

      eventBus.subscribe("GAME_STARTED", mock());
      eventBus.subscribe("GAME_PAUSED", mock());

      const activeEvents = eventBus.getActiveEventTypes();
      expect(activeEvents).toContain("GAME_STARTED");
      expect(activeEvents).toContain("GAME_PAUSED");
    });

    it("should remove all listeners", async () => {
      const handler = mock();
      eventBus.subscribe("GAME_STARTED", handler);

      expect(eventBus.getListenerCount("GAME_STARTED")).toBe(1);

      eventBus.removeAllListeners("GAME_STARTED");
      expect(eventBus.getListenerCount("GAME_STARTED")).toBe(0);

      await eventBus.emit("GAME_STARTED", undefined);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Once Listeners", () => {
    it("should handle once listeners correctly", async () => {
      const handler = mock();
      eventBus.once("GAME_STARTED", handler);

      await eventBus.emit("GAME_STARTED", undefined);
      await eventBus.emit("GAME_STARTED", undefined);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Sync Emission", () => {
    it("should handle sync emission", () => {
      const handler = mock();
      eventBus.subscribe("GAME_STARTED", handler);

      eventBus.emitSync("GAME_STARTED", undefined);

      // Give a small delay for async processing
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(handler).toHaveBeenCalledTimes(1);
          resolve(undefined);
        }, 10);
      });
    });
  });

  describe("Configuration", () => {
    it("should handle logging configuration", () => {
      expect(() => eventBus.setLogging(true)).not.toThrow();
      expect(() => eventBus.setLogging(false)).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors in event handlers gracefully", async () => {
      const originalError = console.error;
      console.error = mock();

      const errorHandler = mock(() => {
        throw new Error("Handler error");
      });
      const normalHandler = mock();

      eventBus.subscribe("GAME_STARTED", errorHandler);
      eventBus.subscribe("GAME_STARTED", normalHandler);

      await eventBus.emit("GAME_STARTED", undefined);

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(normalHandler).toHaveBeenCalledTimes(1); // Should still be called
      expect(console.error).toHaveBeenCalled();

      console.error = originalError;
    });
  });

  describe("Unmapped Events", () => {
    it("should handle unmapped events gracefully", async () => {
      const originalWarn = console.warn;
      console.warn = mock();

      // Create a fake event type that doesn't exist in the mapping
      const fakeEventType = "FAKE_EVENT" as GameEventType;

      const handler = mock();
      const unsubscribe = eventBus.subscribe(fakeEventType, handler);

      await eventBus.emit(fakeEventType, undefined);

      expect(handler).not.toHaveBeenCalled();
      expect(unsubscribe).toBeInstanceOf(Function);

      console.warn = originalWarn;
    });
  });
});

describe("Singleton GameEventBus", () => {
  it("should export a singleton instance", () => {
    expect(gameEventBus).toBeDefined();
    expect(typeof gameEventBus.emit).toBe("function");
    expect(typeof gameEventBus.subscribe).toBe("function");
    expect(typeof gameEventBus.once).toBe("function");
  });

  it("should be the same instance across imports", () => {
    const { gameEventBus: importedBus } = require("./game-event-bus");
    expect(gameEventBus).toBe(importedBus);
  });
});
