import { describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useActionCooldown } from "./useActionCooldown";

describe("useActionCooldown", () => {
  it("should return a function that executes the action", () => {
    let callCount = 0;
    let lastCallArgs: unknown[] = [];
    const mockAction = (...args: unknown[]) => {
      callCount++;
      lastCallArgs = args;
    };

    const { result } = renderHook(() => useActionCooldown(mockAction, 0));

    expect(typeof result.current).toBe("function");

    act(() => {
      result.current("test");
    });

    expect(callCount).toBe(1);
    expect(lastCallArgs).toEqual(["test"]);
  });

  it("should allow action execution after cooldown period", () => {
    let callCount = 0;
    const mockAction = () => {
      callCount++;
    };

    // Use 0ms cooldown to ensure immediate execution
    const { result } = renderHook(() => useActionCooldown(mockAction, 0));

    act(() => {
      result.current();
    });

    expect(callCount).toBe(1);

    // Even with 0ms cooldown, the execution should work
    act(() => {
      result.current();
    });

    expect(callCount).toBe(2);
  });

  it("should handle multiple arguments correctly", () => {
    let callCount = 0;
    let lastCallArgs: unknown[] = [];
    const mockAction = (...args: unknown[]) => {
      callCount++;
      lastCallArgs = args;
    };

    const { result } = renderHook(() => useActionCooldown(mockAction, 0));

    act(() => {
      result.current("arg1", 42, true);
    });

    expect(callCount).toBe(1);
    expect(lastCallArgs).toEqual(["arg1", 42, true]);
  });
});
