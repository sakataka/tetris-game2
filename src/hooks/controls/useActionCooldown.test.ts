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

  it("should allow action execution after cooldown period", async () => {
    const mockAction = mock();
    const { result } = renderHook(() => useActionCooldown(mockAction, 30)); // Short cooldown for test

    act(() => {
      result.current();
    });

    expect(mockAction).toHaveBeenCalledTimes(1);

    // Wait for cooldown period to pass
    await new Promise((resolve) => setTimeout(resolve, 40));

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
