import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useRotationControl } from "./useRotationControl";

// Mock the dependencies
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

describe("useRotationControl", () => {
  beforeEach(() => {
    mockRotate.mockClear();
    mockExecuteAction.mockClear();
  });

  it("should execute rotation when called", () => {
    const { result } = renderHook(() => useRotationControl());

    act(() => {
      result.current.handleRotate();
    });

    expect(mockExecuteAction).toHaveBeenCalledWith(mockRotate);
    expect(mockExecuteAction).toHaveBeenCalledTimes(1);
  });

  it("should prevent double rotation within cooldown period", () => {
    const { result } = renderHook(() => useRotationControl());

    // First rotation
    act(() => {
      result.current.handleRotate();
    });

    expect(mockExecuteAction).toHaveBeenCalledTimes(1);

    // Second rotation within cooldown period (should be ignored)
    act(() => {
      result.current.handleRotate();
    });

    expect(mockExecuteAction).toHaveBeenCalledTimes(1); // Still only called once
  });

  it("should ignore rapid sequential calls", () => {
    const { result } = renderHook(() => useRotationControl());

    // Simulate rapid button presses
    act(() => {
      result.current.handleRotate();
      result.current.handleRotate();
      result.current.handleRotate();
      result.current.handleRotate();
    });

    // Only the first call should execute
    expect(mockExecuteAction).toHaveBeenCalledTimes(1);
  });
});
