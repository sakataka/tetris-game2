import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useTouchGestures } from "./useTouchGestures";

// Mock game actions
const mockGameActions = {
  moveLeft: mock(),
  moveRight: mock(),
  moveDown: mock(),
  rotate: mock(),
  drop: mock(),
};

// Mock game state
let mockGameState = {
  ...mockGameActions,
  isPaused: false,
  isGameOver: false,
};

// Mock useGameStore
mock.module("../../store/gameStore", () => ({
  useGameStore: mock((selector) => {
    if (typeof selector === "function") {
      return selector(mockGameState);
    }
    return mockGameState;
  }),
}));

// Mock useGameActionHandler to execute actions directly
mock.module("../core/useGameActionHandler", () => ({
  useGameActionHandler: () =>
    mock((action, urgent = false) => {
      // Only execute action if game is not paused or over
      if (!mockGameState.isGameOver && !mockGameState.isPaused) {
        action();
      }
    }),
}));

// Mock only startTransition, let React hooks work normally
const mockStartTransition = mock((callback) => callback());
mock.module("react", () => ({
  ...require("react"),
  useTransition: () => [false, mockStartTransition],
}));

describe("useTouchGestures", () => {
  beforeEach(() => {
    // Reset game state
    mockGameState = {
      ...mockGameActions,
      isPaused: false,
      isGameOver: false,
    };

    // Reset mock store state before each test
    Object.values(mockGameActions).forEach((mockFn) => {
      mockFn.mockClear();
    });
    mockStartTransition.mockClear();
  });

  const createTouchEvent = (type: string, touches: Touch[]) => {
    return {
      type,
      touches: type === "touchstart" ? touches : [],
      changedTouches: type === "touchend" ? touches : [],
    } as React.TouchEvent;
  };

  const createTouch = (clientX: number, clientY: number): Touch => ({
    clientX,
    clientY,
    identifier: 0,
    pageX: clientX,
    pageY: clientY,
    screenX: clientX,
    screenY: clientY,
    target: null,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1.0,
  });

  it("returns touch event handlers", () => {
    const { result } = renderHook(() => useTouchGestures());

    expect(typeof result.current.handleTouchStart).toBe("function");
    expect(typeof result.current.handleTouchEnd).toBe("function");
  });

  it("handles horizontal swipe right to move right", () => {
    const { result } = renderHook(() => useTouchGestures());

    act(() => {
      // Touch start at position (100, 100)
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      // Touch end at position (150, 100) - swipe right
      const touchEnd = createTouchEvent("touchend", [createTouch(150, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockGameActions.moveRight).toHaveBeenCalledTimes(1);
  });

  it("handles horizontal swipe left to move left", () => {
    const { result } = renderHook(() => useTouchGestures());

    act(() => {
      // Touch start at position (100, 100)
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      // Touch end at position (50, 100) - swipe left
      const touchEnd = createTouchEvent("touchend", [createTouch(50, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockGameActions.moveLeft).toHaveBeenCalledTimes(1);
  });

  it("handles short vertical swipe down to soft drop", () => {
    const { result } = renderHook(() => useTouchGestures());

    act(() => {
      // Touch start at position (100, 100)
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      // Touch end at position (100, 140) - short swipe down
      const touchEnd = createTouchEvent("touchend", [createTouch(100, 140)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockGameActions.moveDown).toHaveBeenCalledTimes(1);
  });

  it("handles long vertical swipe down to hard drop", () => {
    const { result } = renderHook(() => useTouchGestures());

    act(() => {
      // Touch start at position (100, 100)
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      // Touch end at position (100, 180) - long swipe down (80px > 30*2)
      const touchEnd = createTouchEvent("touchend", [createTouch(100, 180)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockGameActions.drop).toHaveBeenCalledTimes(1);
  });

  it("handles tap to rotate", async () => {
    const { result } = renderHook(() => useTouchGestures());

    act(() => {
      // Touch start at position (100, 100)
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      // Touch end at same position within tap time
      const touchEnd = createTouchEvent("touchend", [createTouch(100, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    // Wait for single tap timeout to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350)); // Wait longer than doubleTapTime (300ms)
    });

    expect(mockGameActions.rotate).toHaveBeenCalledTimes(1);
  });

  it("handles double tap to hard drop", async () => {
    const { result } = renderHook(() => useTouchGestures());

    act(() => {
      // First tap
      const touchStart1 = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart1);
      const touchEnd1 = createTouchEvent("touchend", [createTouch(100, 100)]);
      result.current.handleTouchEnd(touchEnd1);
    });

    // Small delay to set up first tap
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    act(() => {
      // Second tap within double tap time
      const touchStart2 = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart2);
      const touchEnd2 = createTouchEvent("touchend", [createTouch(100, 100)]);
      result.current.handleTouchEnd(touchEnd2);
    });

    // Wait a bit longer for async handling
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Second tap should trigger drop immediately, no rotate calls
    expect(mockGameActions.rotate).toHaveBeenCalledTimes(0);
    expect(mockGameActions.drop).toHaveBeenCalledTimes(1);
  });

  it("handles two separated taps as individual rotations", async () => {
    const { result } = renderHook(() => useTouchGestures());

    act(() => {
      // First tap
      const touchStart1 = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart1);
      const touchEnd1 = createTouchEvent("touchend", [createTouch(100, 100)]);
      result.current.handleTouchEnd(touchEnd1);
    });

    // Wait for first tap to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    act(() => {
      // Second tap after timeout
      const touchStart2 = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart2);
      const touchEnd2 = createTouchEvent("touchend", [createTouch(100, 100)]);
      result.current.handleTouchEnd(touchEnd2);
    });

    // Wait for second tap to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    // Both taps should trigger rotate, no drop
    expect(mockGameActions.rotate).toHaveBeenCalledTimes(2);
    expect(mockGameActions.drop).toHaveBeenCalledTimes(0);
  });

  it("ignores gestures when game is paused", () => {
    mockGameState.isPaused = true;
    const { result } = renderHook(() => useTouchGestures());

    act(() => {
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);
      const touchEnd = createTouchEvent("touchend", [createTouch(150, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockGameActions.moveRight).not.toHaveBeenCalled();
  });

  it("ignores gestures when game is over", () => {
    mockGameState.isGameOver = true;
    const { result } = renderHook(() => useTouchGestures());

    act(() => {
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);
      const touchEnd = createTouchEvent("touchend", [createTouch(150, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockGameActions.moveRight).not.toHaveBeenCalled();
  });
});
