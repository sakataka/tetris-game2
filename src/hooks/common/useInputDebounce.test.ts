import { beforeEach, describe, expect, test, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useInputDebounce } from "./useInputDebounce";

// Mock timers
let timeoutCallbacks: (() => void)[] = [];
let timeoutIds = 0;

const mockSetTimeout = mock((callback: () => void, _delay: number) => {
  const id = ++timeoutIds;
  timeoutCallbacks.push(callback);
  return id;
});

const mockClearTimeout = mock((_id: number) => {
  // Simple mock implementation
});

// Override global timers
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

describe("useInputDebounce", () => {
  beforeEach(() => {
    timeoutCallbacks = [];
    timeoutIds = 0;
    mockSetTimeout.mockClear();
    mockClearTimeout.mockClear();

    // Override setTimeout and clearTimeout
    global.setTimeout = mockSetTimeout as unknown as typeof setTimeout;
    global.clearTimeout = mockClearTimeout as unknown as typeof clearTimeout;
  });

  afterEach(() => {
    // Restore original timers
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  test("should return initial value immediately", () => {
    const { result } = renderHook(() => useInputDebounce("initial", 100));

    expect(result.current).toBe("initial");
  });

  test("should debounce value changes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useInputDebounce(value, delay), {
      initialProps: { value: "initial", delay: 100 },
    });

    expect(result.current).toBe("initial");

    // Change value
    rerender({ value: "changed", delay: 100 });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Execute timeout
    act(() => {
      timeoutCallbacks.forEach((callback) => callback());
    });

    expect(result.current).toBe("changed");
  });

  test("should handle leading edge execution", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useInputDebounce(value, delay, { leading: true }),
      { initialProps: { value: "initial", delay: 100 } },
    );

    expect(result.current).toBe("initial");

    // Change value
    rerender({ value: "changed", delay: 100 });

    // With leading edge, value should change immediately
    expect(result.current).toBe("changed");
  });

  test("should handle trailing edge disabled", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useInputDebounce(value, delay, { trailing: false }),
      { initialProps: { value: "initial", delay: 100 } },
    );

    expect(result.current).toBe("initial");

    // Change value
    rerender({ value: "changed", delay: 100 });

    // Execute timeout
    act(() => {
      timeoutCallbacks.forEach((callback) => callback());
    });

    // With trailing disabled, value should not change
    expect(result.current).toBe("initial");
  });

  test("should handle both leading and trailing disabled", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useInputDebounce(value, delay, { leading: false, trailing: false }),
      { initialProps: { value: "initial", delay: 100 } },
    );

    expect(result.current).toBe("initial");

    // Change value
    rerender({ value: "changed", delay: 100 });

    // Execute timeout
    act(() => {
      timeoutCallbacks.forEach((callback) => callback());
    });

    // With both disabled, value should not change
    expect(result.current).toBe("initial");
  });

  test("should work with different data types", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useInputDebounce(value, delay), {
      initialProps: { value: ["initial"], delay: 100 },
    });

    expect(result.current).toEqual(["initial"]);

    // Change value
    rerender({ value: ["changed"], delay: 100 });

    // Execute timeout
    act(() => {
      timeoutCallbacks.forEach((callback) => callback());
    });

    expect(result.current).toEqual(["changed"]);
  });

  test("should handle rapid value changes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useInputDebounce(value, delay), {
      initialProps: { value: "initial", delay: 100 },
    });

    expect(result.current).toBe("initial");

    // Rapid changes
    rerender({ value: "change1", delay: 100 });
    rerender({ value: "change2", delay: 100 });
    rerender({ value: "final", delay: 100 });

    // Only the final change should be applied
    act(() => {
      timeoutCallbacks.forEach((callback) => callback());
    });

    expect(result.current).toBe("final");
  });

  test("should clear timeout on unmount", () => {
    const { unmount } = renderHook(() => useInputDebounce("value", 100));

    unmount();

    expect(mockClearTimeout).toHaveBeenCalled();
  });
});
