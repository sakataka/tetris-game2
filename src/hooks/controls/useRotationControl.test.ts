import { describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useRotationControl } from "./useRotationControl";

// Mock the dependencies with simpler approach
const mockRotate = mock();
const mockExecuteAction = mock();

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

// Return a mock object with the new API structure for useActionCooldown
mock.module("./useActionCooldown", () => ({
  useActionCooldown: mock(() => ({
    execute: mock(),
    isOnCooldown: false,
    remainingCooldown: 0,
    reset: mock(),
  })),
}));

describe("useRotationControl", () => {
  it("should return handleRotate function", () => {
    const { result } = renderHook(() => useRotationControl());

    expect(typeof result.current.handleRotate).toBe("function");
  });

  it("should provide rotation control interface", () => {
    const { result } = renderHook(() => useRotationControl());

    // Verify the hook returns the expected interface
    expect(result.current).toHaveProperty("handleRotate");
    expect(typeof result.current.handleRotate).toBe("function");
  });
});
