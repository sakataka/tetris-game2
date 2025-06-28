import { beforeEach, describe, expect, test, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardInput } from "./useKeyboardInput";

// Mock KeyboardEvent for test environment
global.KeyboardEvent = class KeyboardEvent extends Event {
  code: string;
  key: string;

  constructor(type: string, options: { code?: string; key?: string } = {}) {
    super(type);
    this.code = options.code || "";
    this.key = options.key || "";
  }
} as typeof KeyboardEvent;

describe("useKeyboardInput", () => {
  beforeEach(() => {
    // Clear any existing event listeners
    document.body.innerHTML = "";
  });

  test("should initialize with empty state", () => {
    const { result } = renderHook(() => useKeyboardInput());

    expect(result.current.pressedKeys).toEqual([]);
    expect(result.current.keyEvents).toEqual([]);
    expect(result.current.isKeyPressed("ArrowLeft")).toBe(false);
  });

  test("should track pressed keys", () => {
    const { result } = renderHook(() => useKeyboardInput());

    act(() => {
      const keyEvent = new KeyboardEvent("keydown", { code: "ArrowLeft" });
      window.dispatchEvent(keyEvent);
    });

    expect(result.current.pressedKeys).toContain("ArrowLeft");
    expect(result.current.isKeyPressed("ArrowLeft")).toBe(true);
  });

  test("should remove keys on keyup", () => {
    const { result } = renderHook(() => useKeyboardInput());

    act(() => {
      const keydownEvent = new KeyboardEvent("keydown", { code: "ArrowLeft" });
      window.dispatchEvent(keydownEvent);
    });

    expect(result.current.pressedKeys).toContain("ArrowLeft");

    act(() => {
      const keyupEvent = new KeyboardEvent("keyup", { code: "ArrowLeft" });
      window.dispatchEvent(keyupEvent);
    });

    expect(result.current.pressedKeys).not.toContain("ArrowLeft");
    expect(result.current.isKeyPressed("ArrowLeft")).toBe(false);
  });

  test("should track multiple pressed keys", () => {
    const { result } = renderHook(() => useKeyboardInput());

    act(() => {
      const leftEvent = new KeyboardEvent("keydown", { code: "ArrowLeft" });
      const rightEvent = new KeyboardEvent("keydown", { code: "ArrowRight" });
      window.dispatchEvent(leftEvent);
      window.dispatchEvent(rightEvent);
    });

    expect(result.current.pressedKeys).toContain("ArrowLeft");
    expect(result.current.pressedKeys).toContain("ArrowRight");
    expect(result.current.isKeyPressed("ArrowLeft")).toBe(true);
    expect(result.current.isKeyPressed("ArrowRight")).toBe(true);
  });

  test("should record key events", () => {
    const { result } = renderHook(() => useKeyboardInput());

    act(() => {
      const keyEvent = new KeyboardEvent("keydown", { code: "ArrowLeft" });
      window.dispatchEvent(keyEvent);
    });

    expect(result.current.keyEvents).toHaveLength(1);
    expect(result.current.keyEvents[0].code).toBe("ArrowLeft");
  });

  test("should limit key events to last 10", () => {
    const { result } = renderHook(() => useKeyboardInput());

    act(() => {
      // Dispatch 12 key events
      for (let i = 0; i < 12; i++) {
        const keyEvent = new KeyboardEvent("keydown", { code: `Key${i}` });
        window.dispatchEvent(keyEvent);
      }
    });

    expect(result.current.keyEvents).toHaveLength(10);
    expect(result.current.keyEvents[0].code).toBe("Key2"); // First two events should be dropped
    expect(result.current.keyEvents[9].code).toBe("Key11");
  });

  test("should clear key events", () => {
    const { result } = renderHook(() => useKeyboardInput());

    act(() => {
      const keyEvent = new KeyboardEvent("keydown", { code: "ArrowLeft" });
      window.dispatchEvent(keyEvent);
    });

    expect(result.current.keyEvents).toHaveLength(1);

    act(() => {
      result.current.clearKeyEvents();
    });

    expect(result.current.keyEvents).toHaveLength(0);
  });

  test("should clean up event listeners on unmount", () => {
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;

    const addEventListenerSpy = mock();
    const removeEventListenerSpy = mock();

    window.addEventListener = addEventListenerSpy;
    window.removeEventListener = removeEventListenerSpy;

    const { unmount } = renderHook(() => useKeyboardInput());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function));

    // Restore original functions
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });
});
