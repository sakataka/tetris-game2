import { beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useTouchGestures } from "./useTouchGestures";

// Mock the game store
const mockGameStore = {
  moveLeft: mock(() => {}),
  moveRight: mock(() => {}),
  moveDown: mock(() => {}),
  rotate: mock(() => {}),
  drop: mock(() => {}),
  isPaused: false,
  isGameOver: false,
};

mock.module("../store/gameStore", () => ({
  useGameStore: () => mockGameStore,
}));

describe("useTouchGestures", () => {
  beforeEach(() => {
    // Reset mock store state before each test
    mockGameStore.isPaused = false;
    mockGameStore.isGameOver = false;
    mockGameStore.moveLeft.mockClear();
    mockGameStore.moveRight.mockClear();
    mockGameStore.moveDown.mockClear();
    mockGameStore.rotate.mockClear();
    mockGameStore.drop.mockClear();

    // Note: Bun test doesn't have timer control like Jest
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
    force: 1,
  });

  it("returns touch event handlers", () => {
    const { result } = renderHook(() => useTouchGestures());

    expect(typeof result.current.handleTouchStart).toBe("function");
    expect(typeof result.current.handleTouchEnd).toBe("function");
  });

  it("handles horizontal swipe right to move right", () => {
    const { result } = renderHook(() => useTouchGestures());

    // Touch start at position (100, 100)
    const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart);

    // Touch end at position (150, 100) - swipe right
    const touchEnd = createTouchEvent("touchend", [createTouch(150, 100)]);
    result.current.handleTouchEnd(touchEnd);

    expect(mockGameStore.moveRight).toHaveBeenCalled();
  });

  it("handles horizontal swipe left to move left", () => {
    const { result } = renderHook(() => useTouchGestures());

    // Touch start at position (100, 100)
    const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart);

    // Touch end at position (50, 100) - swipe left
    const touchEnd = createTouchEvent("touchend", [createTouch(50, 100)]);
    result.current.handleTouchEnd(touchEnd);

    expect(mockGameStore.moveLeft).toHaveBeenCalled();
  });

  it("handles short vertical swipe down to soft drop", () => {
    const { result } = renderHook(() => useTouchGestures({ minSwipeDistance: 30 }));

    // Touch start at position (100, 100)
    const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart);

    // Touch end at position (100, 140) - short swipe down
    const touchEnd = createTouchEvent("touchend", [createTouch(100, 140)]);
    result.current.handleTouchEnd(touchEnd);

    expect(mockGameStore.moveDown).toHaveBeenCalled();
  });

  it("handles long vertical swipe down to hard drop", () => {
    const { result } = renderHook(() => useTouchGestures({ minSwipeDistance: 30 }));

    // Touch start at position (100, 100)
    const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart);

    // Touch end at position (100, 180) - long swipe down (80px > 30*2)
    const touchEnd = createTouchEvent("touchend", [createTouch(100, 180)]);
    result.current.handleTouchEnd(touchEnd);

    expect(mockGameStore.drop).toHaveBeenCalled();
  });

  it("handles tap to rotate", async () => {
    const { result } = renderHook(() =>
      useTouchGestures({ tapTime: 200, minSwipeDistance: 30, doubleTapTime: 50 }),
    );

    // Touch start at position (100, 100)
    const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart);

    // Touch end at same position immediately - tap
    const touchEnd = createTouchEvent("touchend", [createTouch(105, 105)]);
    result.current.handleTouchEnd(touchEnd);

    // Wait for single tap timeout to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockGameStore.rotate).toHaveBeenCalled();
  });

  it("handles double tap to hard drop", async () => {
    const { result } = renderHook(() =>
      useTouchGestures({ tapTime: 200, minSwipeDistance: 30, doubleTapTime: 100 }),
    );

    // Ensure clean mock state
    mockGameStore.isPaused = false;
    mockGameStore.isGameOver = false;
    mockGameStore.drop.mockClear();
    mockGameStore.rotate.mockClear();

    // First tap
    const touchStart1 = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart1);
    const touchEnd1 = createTouchEvent("touchend", [createTouch(105, 105)]);
    result.current.handleTouchEnd(touchEnd1);

    // Wait a bit but within double tap window
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Second tap
    const touchStart2 = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart2);
    const touchEnd2 = createTouchEvent("touchend", [createTouch(105, 105)]);
    result.current.handleTouchEnd(touchEnd2);

    // Wait for any delayed actions to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Second tap should trigger drop immediately, no rotate calls
    expect(mockGameStore.rotate).toHaveBeenCalledTimes(0);
    expect(mockGameStore.drop).toHaveBeenCalledTimes(1);
  });

  it("handles two separated taps as individual rotations", async () => {
    const { result } = renderHook(() =>
      useTouchGestures({ tapTime: 200, minSwipeDistance: 30, doubleTapTime: 50 }),
    );

    // First tap
    const touchStart1 = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart1);
    const touchEnd1 = createTouchEvent("touchend", [createTouch(105, 105)]);
    result.current.handleTouchEnd(touchEnd1);

    // Wait longer than double tap time
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second tap after double tap time has passed
    const touchStart2 = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart2);
    const touchEnd2 = createTouchEvent("touchend", [createTouch(105, 105)]);
    result.current.handleTouchEnd(touchEnd2);

    // Wait for second tap timeout to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Both taps should trigger rotate, no drop
    expect(mockGameStore.rotate).toHaveBeenCalledTimes(2);
    expect(mockGameStore.drop).not.toHaveBeenCalled();
  });

  it("ignores gestures when game is paused", () => {
    mockGameStore.isPaused = true;
    const { result } = renderHook(() => useTouchGestures());

    // Touch start and end
    const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart);

    const touchEnd = createTouchEvent("touchend", [createTouch(150, 100)]);
    result.current.handleTouchEnd(touchEnd);

    // No action should be called when paused
    expect(mockGameStore.moveRight).not.toHaveBeenCalled();
  });

  it("ignores gestures when game is over", () => {
    mockGameStore.isPaused = false;
    mockGameStore.isGameOver = true;
    const { result } = renderHook(() => useTouchGestures());

    // Touch start and end
    const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
    result.current.handleTouchStart(touchStart);

    const touchEnd = createTouchEvent("touchend", [createTouch(150, 100)]);
    result.current.handleTouchEnd(touchEnd);

    // No action should be called when game is over
    expect(mockGameStore.moveRight).not.toHaveBeenCalled();
  });
});
