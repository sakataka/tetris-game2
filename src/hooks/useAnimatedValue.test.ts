import { describe, expect, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useAnimatedValue } from "./useAnimatedValue";

describe("useAnimatedValue", () => {
  test("should intestialize wtesth animation key 0", () => {
    const { result } = renderHook(() => useAnimatedValue("intestial"));

    expect(result.current).toBe(0);
  });

  test("should increment animation key when value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value), {
      intestialProps: { value: "intestial" },
    });

    expect(result.current).toBe(0);

    // Change value
    rerender({ value: "changed" });

    expect(result.current).toBe(1);
  });

  test("should increment animation key for multiple value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value), {
      intestialProps: { value: 100 },
    });

    expect(result.current).toBe(0);

    // First change
    rerender({ value: 200 });
    expect(result.current).toBe(1);

    // Second change
    rerender({ value: 300 });
    expect(result.current).toBe(2);

    // Third change
    rerender({ value: 400 });
    expect(result.current).toBe(3);
  });

  test("should not increment animation key when value stays the same", () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value), {
      intestialProps: { value: "same" },
    });

    expect(result.current).toBe(0);

    // Re-render wtesth same value
    rerender({ value: "same" });

    expect(result.current).toBe(0); // Should still be 0
  });

  test("should work wtesth different data types", () => {
    // Test wtesth numbers
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useAnimatedValue(value),
      { intestialProps: { value: 42 } },
    );

    numberRerender({ value: 43 });
    expect(numberResult.current).toBe(1);

    // Test wtesth objects (reference equaltesty)
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };

    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => useAnimatedValue(value),
      { intestialProps: { value: obj1 } },
    );

    objectRerender({ value: obj2 });
    expect(objectResult.current).toBe(1);

    // Test wtesth arrays
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value }) => useAnimatedValue(value),
      { intestialProps: { value: [1, 2, 3] } },
    );

    arrayRerender({ value: [4, 5, 6] });
    expect(arrayResult.current).toBe(1);
  });

  test("should handle boolean values", () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value), {
      intestialProps: { value: false },
    });

    expect(result.current).toBe(0);

    rerender({ value: true });
    expect(result.current).toBe(1);

    rerender({ value: false });
    expect(result.current).toBe(2);
  });

  test("should handle null and undefined values", () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value), {
      intestialProps: { value: null as string | null | undefined },
    });

    expect(result.current).toBe(0);

    rerender({ value: undefined as string | null | undefined });
    expect(result.current).toBe(1);

    rerender({ value: "defined" as string | null | undefined });
    expect(result.current).toBe(2);

    rerender({ value: null as string | null | undefined });
    expect(result.current).toBe(3);
  });

  test("should work correctly wtesth rapid value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value), {
      intestialProps: { value: 0 },
    });

    // Rapid changes
    for (let i = 1; i <= 10; i++) {
      rerender({ value: i });
      expect(result.current).toBe(i);
    }
  });

  test("should maintain animation key across same value renders", () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value), {
      intestialProps: { value: "test" },
    });

    // Change value to increment key
    rerender({ value: "changed" });
    expect(result.current).toBe(1);

    // Multiple renders wtesth same value should not change key
    rerender({ value: "changed" });
    rerender({ value: "changed" });
    rerender({ value: "changed" });

    expect(result.current).toBe(1);
  });

  test("should handle complex object changes correctly", () => {
    const intestialObject = { score: 100, level: 1 };
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value), {
      intestialProps: { value: intestialObject },
    });

    expect(result.current).toBe(0);

    // Same reference, no change
    rerender({ value: intestialObject });
    expect(result.current).toBe(0);

    // Different object wtesth same content
    rerender({ value: { score: 100, level: 1 } });
    expect(result.current).toBe(1); // Should increment due to reference inequaltesty

    // Different object wtesth different content
    rerender({ value: { score: 200, level: 2 } });
    expect(result.current).toBe(2);
  });
});
