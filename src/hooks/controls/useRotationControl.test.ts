import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useRotationControl } from "./useRotationControl";

// Mock the dependencies
const mockRotate = mock();
const mockExecuteAction = mock();
const mockActionCooldown = mock();

mock.module("../../store/gameStore", () => ({
  useGameStore: mock((selector) => {
    if (typeof selector === "function") {
      const selectorStr = selector.toString();
      if (selectorStr.includes("rotate")) {
        return mockRotate;
      }
    }
    return mock();
  }),
}));

mock.module("../core/useGameActionHandler", () => ({
  useGameActionHandler: mock(() => mockExecuteAction),
}));

mock.module("./useActionCooldown", () => ({
  useActionCooldown: mock((action, cooldownMs) => {
    // Store the action for later verification
    mockActionCooldown.action = action;
    mockActionCooldown.cooldownMs = cooldownMs;

    // Return a mock function that tracks calls
    return mockActionCooldown;
  }),
}));

describe("useRotationControl", () => {
  beforeEach(() => {
    mockRotate.mockClear();
    mockExecuteAction.mockClear();
    mockActionCooldown.mockClear();
  });

  it("should return handleRotate function", () => {
    const { result } = renderHook(() => useRotationControl());

    expect(typeof result.current.handleRotate).toBe("function");
  });

  it("should call useActionCooldown with correct parameters", () => {
    renderHook(() => useRotationControl());

    // Verify useActionCooldown was called with correct cooldown time
    expect(mockActionCooldown.cooldownMs).toBe(200);

    // Verify the action function exists
    expect(typeof mockActionCooldown.action).toBe("function");
  });

  it("should execute the action when handleRotate is called", () => {
    const { result } = renderHook(() => useRotationControl());

    act(() => {
      result.current.handleRotate();
    });

    expect(mockActionCooldown).toHaveBeenCalledTimes(1);
  });
});
