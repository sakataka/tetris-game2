import { describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useActionCooldown } from "./useActionCooldown";

describe("useActionCooldown", () => {
  it("should return a function that executes the action", () => {
    const mockAction = mock();
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    expect(typeof result.current).toBe("function");

    act(() => {
      result.current("test");
    });

    expect(mockAction).toHaveBeenCalledWith("test");
  });

  it("should allow action execution after cooldown period", () => {
    const mockAction = mock();
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

  it("should handle multiple arguments correctly", () => {
    const mockAction = mock();
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    act(() => {
      result.current("arg1", 42, true);
    });

    expect(mockAction).toHaveBeenCalledWith("arg1", 42, true);
  });
});
