import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { createGameEffectsManager, type GameEffectsManager } from "./gameEffects";

describe("GameEffectsManager", () => {
  let manager: GameEffectsManager;

  beforeEach(() => {
    manager = createGameEffectsManager();
  });

  it("should create with default config", () => {
    const config = manager.getConfig();
    expect(config.enableAnimations).toBe(true);
    expect(config.enableSound).toBe(false);
    expect(config.enableAnalytics).toBe(false);
    expect(config.enableHaptics).toBe(false);
  });

  it("should register and call event handlers", () => {
    const mockHandler = mock();

    manager.on("TEST_EVENT", mockHandler);
    manager.emit("TEST_EVENT", { data: "test" });

    expect(mockHandler).toHaveBeenCalledWith({
      type: "TEST_EVENT",
      payload: { data: "test" },
      timestamp: expect.any(Number),
    });
  });

  it("should support multiple handlers for same event", () => {
    const handler1 = mock();
    const handler2 = mock();

    manager.on("TEST_EVENT", handler1);
    manager.on("TEST_EVENT", handler2);
    manager.emit("TEST_EVENT");

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it("should remove event handlers", () => {
    const mockHandler = mock();

    manager.on("TEST_EVENT", mockHandler);
    manager.off("TEST_EVENT", mockHandler);
    manager.emit("TEST_EVENT");

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it("should update configuration", () => {
    manager.updateConfig({ enableSound: true });

    const config = manager.getConfig();
    expect(config.enableSound).toBe(true);
  });

  it("should handle errors in effect handlers gracefully", () => {
    const errorHandler = mock(() => {
      throw new Error("Test error");
    });
    const validHandler = mock();

    // Mock console.error to avoid noise in test output
    const consoleSpy = spyOn(console, "error").mockImplementation();

    manager.on("TEST_EVENT", errorHandler);
    manager.on("TEST_EVENT", validHandler);

    expect(() => {
      manager.emit("TEST_EVENT");
    }).not.toThrow();

    expect(errorHandler).toHaveBeenCalled();
    expect(validHandler).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should not trigger effects when disabled", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation();

    // Create manager with animations disabled
    const disabledManager = createGameEffectsManager({ enableAnimations: false });
    disabledManager.setupDefaultEffects();

    disabledManager.emit("LINE_CLEARED", { lines: 4, positions: [0, 1, 2, 3] });

    // Should not log animation effects
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("[Effects] Line clear animation"),
    );

    consoleSpy.mockRestore();
  });
});
