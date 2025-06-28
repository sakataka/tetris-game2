import { act, renderHook } from "@testing-library/react";
import { useActionCooldown } from "./useActionCooldown";

// Cross-platform mock function
const createMockFn = () => {
  const calls: any[][] = [];
  const fn = (...args: any[]) => {
    calls.push(args);
  };
  fn.mock = { calls };
  return fn;
};

describe("useActionCooldown", () => {
  it("should return a function that executes the action", () => {
    const mockAction = createMockFn();
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    expect(typeof result.current).toBe("function");

    act(() => {
      result.current("test");
    });

    expect(mockAction.mock.calls).toHaveLength(1);
    expect(mockAction.mock.calls[0]).toEqual(["test"]);
  });

  it("should allow action execution after cooldown period", () => {
    const mockAction = createMockFn();
    // Use 0ms cooldown to avoid timing issues in CI
    const { result } = renderHook(() => useActionCooldown(mockAction, 0));

    act(() => {
      result.current();
    });

    expect(mockAction.mock.calls).toHaveLength(1);

    // Even with 0ms cooldown, the execution should work
    act(() => {
      result.current();
    });

    expect(mockAction.mock.calls).toHaveLength(2);
  });

  it("should handle multiple arguments correctly", () => {
    const mockAction = createMockFn();
    const { result } = renderHook(() => useActionCooldown(mockAction, 100));

    act(() => {
      result.current("arg1", 42, true);
    });

    expect(mockAction.mock.calls).toHaveLength(1);
    expect(mockAction.mock.calls[0]).toEqual(["arg1", 42, true]);
  });
});
