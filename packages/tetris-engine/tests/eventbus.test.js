import { describe, expect, it, vi } from "vitest";
import { GameEventBus } from "../src/events/bus.js";

describe("GameEventBus", () => {
  describe("subscribe and emit", () => {
    it("should subscribe to events and receive them", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      bus.subscribe("LINE_CLEARED", handler);
      const event = {
        type: "LINE_CLEARED",
        payload: { lines: 1, positions: [0], score: 100 },
      };
      bus.emit(event);
      expect(handler).toHaveBeenCalledWith({
        ...event,
        timestamp: expect.any(Number),
      });
    });
    it("should handle multiple subscribers to same event", () => {
      const bus = new GameEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.subscribe("PIECE_PLACED", handler1);
      bus.subscribe("PIECE_PLACED", handler2);
      const event = {
        type: "PIECE_PLACED",
        payload: { piece: "T", position: { x: 5, y: 10 }, rotation: 0 },
      };
      bus.emit(event);
      expect(handler1).toHaveBeenCalledWith({
        ...event,
        timestamp: expect.any(Number),
      });
      expect(handler2).toHaveBeenCalledWith({
        ...event,
        timestamp: expect.any(Number),
      });
    });
    it("should not call handlers for different event types", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      bus.subscribe("LINE_CLEARED", handler);
      const event = {
        type: "PIECE_PLACED",
        payload: { piece: "T", position: { x: 5, y: 10 }, rotation: 0 },
      };
      bus.emit(event);
      expect(handler).not.toHaveBeenCalled();
    });
  });
  describe("unsubscribe", () => {
    it("should unsubscribe handler", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      const unsubscribe = bus.subscribe("LINE_CLEARED", handler);
      unsubscribe();
      const event = {
        type: "LINE_CLEARED",
        payload: { lines: 1, positions: [0], score: 100 },
      };
      bus.emit(event);
      expect(handler).not.toHaveBeenCalled();
    });
    it("should clean up empty event type sets", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      const unsubscribe = bus.subscribe("LINE_CLEARED", handler);
      expect(bus.hasSubscribers("LINE_CLEARED")).toBe(true);
      unsubscribe();
      expect(bus.hasSubscribers("LINE_CLEARED")).toBe(false);
    });
  });
  describe("emitSync", () => {
    it("should emit event synchronously without timestamp", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      bus.subscribe("HARD_DROP", handler);
      const event = {
        type: "HARD_DROP",
        payload: { distance: 5, score: 10 },
      };
      bus.emitSync(event);
      expect(handler).toHaveBeenCalledWith(event);
    });
  });
  describe("event queuing", () => {
    it("should queue events emitted during emission", () => {
      const bus = new GameEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.subscribe("PIECE_PLACED", handler1);
      bus.subscribe("LINE_CLEARED", handler2);
      // Handler1 emits another event during emission
      handler1.mockImplementation(() => {
        bus.emit({
          type: "LINE_CLEARED",
          payload: { lines: 1, positions: [0], score: 100 },
        });
      });
      bus.emit({
        type: "PIECE_PLACED",
        payload: { piece: "T", position: { x: 5, y: 10 }, rotation: 0 },
      });
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });
  describe("error handling", () => {
    it("should handle errors in handlers without stopping others", () => {
      const bus = new GameEventBus();
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error("Handler error");
      });
      const normalHandler = vi.fn();
      // Mock console.error to avoid test output
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      bus.subscribe("T_SPIN", errorHandler);
      bus.subscribe("T_SPIN", normalHandler);
      const event = {
        type: "T_SPIN",
        payload: { type: "single", corners: 3 },
      };
      bus.emit(event);
      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in event handler for T_SPIN:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
  describe("utility methods", () => {
    it("should get subscribers for event type", () => {
      const bus = new GameEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.subscribe("GAME_OVER", handler1);
      bus.subscribe("GAME_OVER", handler2);
      const subscribers = bus.getSubscribers("GAME_OVER");
      expect(subscribers).toHaveLength(2);
    });
    it("should check if event type has subscribers", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      expect(bus.hasSubscribers("LEVEL_UP")).toBe(false);
      bus.subscribe("LEVEL_UP", handler);
      expect(bus.hasSubscribers("LEVEL_UP")).toBe(true);
    });
    it("should get subscriber count", () => {
      const bus = new GameEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      expect(bus.getSubscriberCount("PIECE_HELD")).toBe(0);
      bus.subscribe("PIECE_HELD", handler1);
      expect(bus.getSubscriberCount("PIECE_HELD")).toBe(1);
      bus.subscribe("PIECE_HELD", handler2);
      expect(bus.getSubscriberCount("PIECE_HELD")).toBe(2);
    });
    it("should get all event types", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      bus.subscribe("LINE_CLEARED", handler);
      bus.subscribe("PIECE_PLACED", handler);
      const eventTypes = bus.getEventTypes();
      expect(eventTypes).toContain("LINE_CLEARED");
      expect(eventTypes).toContain("PIECE_PLACED");
    });
    it("should get total subscriber count", () => {
      const bus = new GameEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      expect(bus.getTotalSubscriberCount()).toBe(0);
      bus.subscribe("LINE_CLEARED", handler1);
      bus.subscribe("PIECE_PLACED", handler1);
      bus.subscribe("LINE_CLEARED", handler2);
      expect(bus.getTotalSubscriberCount()).toBe(3);
    });
  });
  describe("advanced subscription methods", () => {
    it("should subscribe to multiple event types", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      const unsubscribe = bus.subscribeToMultiple(["LINE_CLEARED", "PIECE_PLACED"], handler);
      bus.emit({
        type: "LINE_CLEARED",
        payload: { lines: 1, positions: [0], score: 100 },
      });
      bus.emit({
        type: "PIECE_PLACED",
        payload: { piece: "T", position: { x: 5, y: 10 }, rotation: 0 },
      });
      expect(handler).toHaveBeenCalledTimes(2);
      unsubscribe();
      bus.emit({
        type: "LINE_CLEARED",
        payload: { lines: 1, positions: [0], score: 100 },
      });
      expect(handler).toHaveBeenCalledTimes(2);
    });
    it("should subscribe once and auto-unsubscribe", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      bus.subscribeOnce("GAME_OVER", handler);
      const event = {
        type: "GAME_OVER",
        payload: { finalScore: 1000, totalLines: 50 },
      };
      bus.emit(event);
      bus.emit(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
  describe("cleanup methods", () => {
    it("should clear subscribers for specific event type", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      bus.subscribe("LINE_CLEARED", handler);
      bus.subscribe("PIECE_PLACED", handler);
      bus.clearSubscribers("LINE_CLEARED");
      expect(bus.hasSubscribers("LINE_CLEARED")).toBe(false);
      expect(bus.hasSubscribers("PIECE_PLACED")).toBe(true);
    });
    it("should clear all subscribers", () => {
      const bus = new GameEventBus();
      const handler = vi.fn();
      bus.subscribe("LINE_CLEARED", handler);
      bus.subscribe("PIECE_PLACED", handler);
      bus.clearAllSubscribers();
      expect(bus.hasSubscribers("LINE_CLEARED")).toBe(false);
      expect(bus.hasSubscribers("PIECE_PLACED")).toBe(false);
      expect(bus.getTotalSubscriberCount()).toBe(0);
    });
  });
});
//# sourceMappingURL=eventbus.test.js.map
