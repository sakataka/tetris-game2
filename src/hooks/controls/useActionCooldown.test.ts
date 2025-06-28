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

  it("should accept branded Milliseconds type", () => {
    const mockAction = () => {};
    const { result } = renderHook(() => useActionCooldown(mockAction, milliseconds(150)));

    expect(typeof result.current.execute).toBe("function");
  });
});
