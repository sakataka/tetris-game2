import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useGameControls } from "./useGameControls";

// Mock implementations
const mockMoveLeft = mock();
const mockMoveRight = mock();
const mockSoftDrop = mock();
const mockRotateClockwise = mock();
const mockRotateCounterClockwise = mock();
const mockHardDrop = mock();
const mockHold = mock();
const mockPause = mock();
const mockReset = mock();

const mockGameInputActions = {
  moveLeft: mockMoveLeft,
  moveRight: mockMoveRight,
  softDrop: mockSoftDrop,
  rotateClockwise: mockRotateClockwise,
  rotateCounterClockwise: mockRotateCounterClockwise,
  hardDrop: mockHardDrop,
  hold: mockHold,
  pause: mockPause,
  reset: mockReset,
};

const mockExecuteAction = mock((action) => action());

// Mock stores and hooks
mock.module("@/store/gameStore", () => ({
  useGameStore: mock((selector) => {
    const defaultState = {
      currentPiece: { type: "T", position: { x: 5, y: 0 }, rotation: 0 },
      board: Array(20).fill(Array(10).fill(0)),
      gameState: "playing",
      isGameOver: false,
      isPaused: false,
    };
    return typeof selector === "function" ? selector(defaultState) : defaultState;
  }),
}));

mock.module("@/store/settingsStore", () => ({
  useSettingsStore: mock((selector) => {
    const defaultState = {
      enableAIFeatures: false,
    };
    return typeof selector === "function" ? selector(defaultState) : defaultState;
  }),
}));

mock.module("@/hooks/controls/useGameInputActions", () => ({
  useGameInputActions: () => mockGameInputActions,
}));

mock.module("@/hooks/core/useGameActionHandler", () => ({
  useGameActionHandler: () => mockExecuteAction,
}));

describe("useGameControls", () => {
  beforeEach(() => {
    // Clear all mock call histories
    Object.values(mockGameInputActions).forEach((mockFn) => {
      if (mockFn.mockClear) {
        mockFn.mockClear();
      }
    });
    if (mockExecuteAction.mockClear) {
      mockExecuteAction.mockClear();
    }
  });

  test("should provide game control interface", () => {
    const { result } = renderHook(() => useGameControls());

    expect(result.current).toHaveProperty("handleMove");
    expect(result.current).toHaveProperty("handleRotate");
    expect(result.current).toHaveProperty("handleDrop");
    expect(result.current).toHaveProperty("handleHold");
    expect(result.current).toHaveProperty("canMove");
    expect(result.current).toHaveProperty("isGameActive");
    expect(result.current).toHaveProperty("isPaused");

    expect(typeof result.current.handleMove).toBe("function");
    expect(typeof result.current.handleRotate).toBe("function");
    expect(typeof result.current.handleDrop).toBe("function");
    expect(typeof result.current.handleHold).toBe("function");
    expect(typeof result.current.canMove).toBe("function");
    expect(typeof result.current.isGameActive).toBe("boolean");
    expect(typeof result.current.isPaused).toBe("boolean");
  });

  test("should report correct game state", () => {
    const { result } = renderHook(() => useGameControls());

    expect(result.current.isGameActive).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  test("should validate movement correctly", () => {
    const { result } = renderHook(() => useGameControls());

    const canMoveLeft = result.current.canMove("left");
    expect(typeof canMoveLeft).toBe("boolean");
  });
});
