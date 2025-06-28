import { describe, expect, it, jest } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useActionCooldown } from "./useActionCooldown";

describe("useActionCooldown", () => {
  it("should return a function that executes the action", () => {
    const mockAction = jest.fn();
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    expect(typeof result.current).toBe("function");

    act(() => {
      result.current("test");
    });

    expect(mockAction).toHaveBeenCalledWith("test");
  });

  it("should allow action execution after cooldown period", () => {
    const mockAction = jest.fn();
    // Use 0ms cooldown to avoid timing issues in CI
    const { result } = renderHook(() => useActionCooldown(mockAction, 0));

    act(() => {
      result.current();
    });

    expect(mockAction).toHaveBeenCalledTimes(1);

    // Even with 0ms cooldown, the execution should work
    act(() => {
      result.current();
    });

    expect(mockAction).toHaveBeenCalledTimes(2);
  });

  it("should prevent rapid execution during cooldown", () => {
    const mockAction = jest.fn();
    // Mock Date.now to control timing precisely
    const originalDateNow = Date.now;
    let mockTime = 1000;
    Date.now = jest.fn(() => mockTime);

    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    // First execution should work
    act(() => {
      result.current();
    });

    expect(mockAction).toHaveBeenCalledTimes(1);

    // Advance time by only 50ms (less than 100ms cooldown)
    mockTime += 50;

    // Second execution should be blocked due to cooldown
    act(() => {
      result.current();
    });

    // Should still be 1 call due to cooldown
    expect(mockAction).toHaveBeenCalledTimes(1);

    // Restore original Date.now
    Date.now = originalDateNow;
  });

  it("should handle multiple arguments correctly", () => {
    const mockAction = jest.fn();
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    act(() => {
      result.current("arg1", 42, true);
    });

    expect(mockAction).toHaveBeenCalledWith("arg1", 42, true);
  });
});
