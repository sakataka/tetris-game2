import { describe, expect, it } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useActionCooldown, milliseconds } from "./useActionCooldown";

describe("useActionCooldown", () => {
  it("should return an object with execute function and cooldown state", () => {
    const mockAction = () => {};
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    expect(typeof result.current).toBe("object");
    expect(typeof result.current.execute).toBe("function");
    expect(typeof result.current.isOnCooldown).toBe("boolean");
    expect(typeof result.current.remainingCooldown).toBe("number");
    expect(typeof result.current.reset).toBe("function");
  });

  it("should execute action when not on cooldown", async () => {
    let actionCalled = false;
    const mockAction = () => {
      actionCalled = true;
    };
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    await act(async () => {
      await result.current.execute();
    });

    expect(actionCalled).toBe(true);
  });

  it("should prevent execution during cooldown", async () => {
    let actionCallCount = 0;
    const mockAction = () => {
      actionCallCount++;
    };
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    // Execute first action
    await act(async () => {
      await result.current.execute();
    });

    expect(actionCallCount).toBe(1);
    expect(result.current.isOnCooldown).toBe(true);

    // Try to execute again immediately (should be blocked)
    await act(async () => {
      await result.current.execute();
    });

    expect(actionCallCount).toBe(1); // Should still be 1
  });

  it("should accept branded Milliseconds type", () => {
    const mockAction = () => {};
    const { result } = renderHook(() => useActionCooldown(mockAction, milliseconds(150)));

    expect(typeof result.current.execute).toBe("function");
  });

  it("should reset cooldown state", async () => {
    const mockAction = () => {};
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    // Execute action to trigger cooldown
    await act(async () => {
      await result.current.execute();
    });

    // Wait a brief moment for state to update
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.isOnCooldown).toBe(true);

    // Reset cooldown
    act(() => {
      result.current.reset();
    });

    expect(result.current.isOnCooldown).toBe(false);
    expect(result.current.remainingCooldown).toBe(0);
  });
});
