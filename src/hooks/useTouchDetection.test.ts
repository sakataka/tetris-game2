import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { type SwipeGesture, type TapGesture, useTouchDetection } from "./useTouchDetection";

describe("useTouchDetection", () => {
  let mockOnSwipe: ReturnType<typeof mock>;
  let mockOnTap: ReturnType<typeof mock>;
  let mockOnDoubleTap: ReturnType<typeof mock>;

  beforeEach(() => {
    mockOnSwipe = mock();
    mockOnTap = mock();
    mockOnDoubleTap = mock();
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
    const { result } = renderHook(() => useTouchDetection());

    expect(typeof result.current.handleTouchStart).toBe("function");
    expect(typeof result.current.handleTouchEnd).toBe("function");
  });

  it("detects horizontal swipe right", () => {
    const { result } = renderHook(() =>
      useTouchDetection({
        onSwipe: mockOnSwipe,
      }),
    );

    act(() => {
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      const touchEnd = createTouchEvent("touchend", [createTouch(150, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockOnSwipe).toHaveBeenCalledTimes(1);
    const swipeGesture: SwipeGesture = mockOnSwipe.mock.calls[0][0];
    expect(swipeGesture.direction).toBe("right");
    expect(swipeGesture.distance).toBe(50);
    expect(swipeGesture.isLongSwipe).toBe(false);
  });

  it("detects horizontal swipe left", () => {
    const { result } = renderHook(() =>
      useTouchDetection({
        onSwipe: mockOnSwipe,
      }),
    );

    act(() => {
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      const touchEnd = createTouchEvent("touchend", [createTouch(50, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockOnSwipe).toHaveBeenCalledTimes(1);
    const swipeGesture: SwipeGesture = mockOnSwipe.mock.calls[0][0];
    expect(swipeGesture.direction).toBe("left");
    expect(swipeGesture.distance).toBe(50);
  });

  it("detects vertical swipe down with short distance", () => {
    const { result } = renderHook(() =>
      useTouchDetection({
        onSwipe: mockOnSwipe,
      }),
    );

    act(() => {
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      const touchEnd = createTouchEvent("touchend", [createTouch(100, 140)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockOnSwipe).toHaveBeenCalledTimes(1);
    const swipeGesture: SwipeGesture = mockOnSwipe.mock.calls[0][0];
    expect(swipeGesture.direction).toBe("down");
    expect(swipeGesture.distance).toBe(40);
    expect(swipeGesture.isLongSwipe).toBe(false);
  });

  it("detects vertical swipe down with long distance", () => {
    const { result } = renderHook(() =>
      useTouchDetection({
        onSwipe: mockOnSwipe,
      }),
    );

    act(() => {
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      // 80px > 30px * 2 = long swipe
      const touchEnd = createTouchEvent("touchend", [createTouch(100, 180)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockOnSwipe).toHaveBeenCalledTimes(1);
    const swipeGesture: SwipeGesture = mockOnSwipe.mock.calls[0][0];
    expect(swipeGesture.direction).toBe("down");
    expect(swipeGesture.distance).toBe(80);
    expect(swipeGesture.isLongSwipe).toBe(true);
  });

  it("detects single tap after timeout", async () => {
    const { result } = renderHook(() =>
      useTouchDetection({
        onTap: mockOnTap,
      }),
    );

    act(() => {
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      const touchEnd = createTouchEvent("touchend", [createTouch(100, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    // Wait for single tap timeout
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(mockOnTap).toHaveBeenCalledTimes(1);
    const tapGesture: TapGesture = mockOnTap.mock.calls[0][0];
    expect(tapGesture.x).toBe(100);
    expect(tapGesture.y).toBe(100);
  });

  it("detects double tap", async () => {
    const { result } = renderHook(() =>
      useTouchDetection({
        onTap: mockOnTap,
        onDoubleTap: mockOnDoubleTap,
      }),
    );

    act(() => {
      // First tap
      const touchStart1 = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart1);
      const touchEnd1 = createTouchEvent("touchend", [createTouch(100, 100)]);
      result.current.handleTouchEnd(touchEnd1);
    });

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

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockOnDoubleTap).toHaveBeenCalledTimes(1);
    expect(mockOnTap).toHaveBeenCalledTimes(0);
  });

  it("handles custom options", () => {
    const { result } = renderHook(() =>
      useTouchDetection({ onSwipe: mockOnSwipe }, { minSwipeDistance: 100, maxSwipeTime: 500 }),
    );

    act(() => {
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      // 50px distance - should not trigger with minSwipeDistance: 100
      const touchEnd = createTouchEvent("touchend", [createTouch(150, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockOnSwipe).not.toHaveBeenCalled();
  });

  it("ignores multi-touch gestures", () => {
    const { result } = renderHook(() =>
      useTouchDetection({
        onSwipe: mockOnSwipe,
      }),
    );

    act(() => {
      const multiTouch = createTouchEvent("touchstart", [
        createTouch(100, 100),
        createTouch(200, 100),
      ]);
      result.current.handleTouchStart(multiTouch);

      const touchEnd = createTouchEvent("touchend", [createTouch(150, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(mockOnSwipe).not.toHaveBeenCalled();
  });

  it("handles cleanup on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useTouchDetection({
        onTap: mockOnTap,
      }),
    );

    act(() => {
      const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
      result.current.handleTouchStart(touchStart);

      const touchEnd = createTouchEvent("touchend", [createTouch(100, 100)]);
      result.current.handleTouchEnd(touchEnd);
    });

    // Unmount before timeout completes
    unmount();

    // Wait longer than timeout
    setTimeout(() => {
      expect(mockOnTap).not.toHaveBeenCalled();
    }, 350);
  });
});
