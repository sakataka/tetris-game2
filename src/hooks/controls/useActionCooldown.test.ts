import { describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useActionCooldown } from "./useActionCooldown";

describe("useActionCooldown", () => {
  it("should return a function that executes the action", async () => {
    const results: unknown[][] = [];
    const mockAction = (...args: unknown[]) => {
      results.push(args);
    };

    const { result } = renderHook(() => useActionCooldown(mockAction, 0));

    expect(typeof result.current).toBe("function");

    await act(async () => {
      result.current("test");
      // Give some time for the action to execute
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(["test"]);
  });

  it("should allow action execution after cooldown period", async () => {
    const results: unknown[][] = [];
    const mockAction = (...args: unknown[]) => {
      results.push(args);
    };

    const { result } = renderHook(() => useActionCooldown(mockAction, 0));

    await act(async () => {
      result.current();
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(results).toHaveLength(1);

    await act(async () => {
      result.current();
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(results).toHaveLength(2);
  });

  it("should handle multiple arguments correctly", async () => {
    const results: unknown[][] = [];
    const mockAction = (...args: unknown[]) => {
      results.push(args);
    };

    const { result } = renderHook(() => useActionCooldown(mockAction, 0));

    await act(async () => {
      result.current("arg1", 42, true);
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(["arg1", 42, true]);
  });
});
