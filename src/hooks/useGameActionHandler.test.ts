import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useGameActionHandler } from "./useGameActionHandler";

// Mock game state
let mockGameState = {
  isGameOver: false,
  isPaused: false,
};

// Mock useGameStore
mock.module("../store/gameStore", () => ({
  useGameStore: mock((selector) => {
    if (typeof selector === "function") {
      return selector(mockGameState);
    }
    return mockGameState;
  }),
}));

// Mock only startTransition, let React hooks work normally
const mockStartTransition = mock((callback) => callback());
mock.module("react", () => ({
  ...require("react"),
  useTransition: () => [false, mockStartTransition],
}));

describe("useGameActionHandler", () => {
  beforeEach(() => {
    // Reset game state
    mockGameState = {
      isGameOver: false,
      isPaused: false,
    };

    // Clear mocks
    mockStartTransition.mockClear();
  });

  test("should create handler function", () => {
    const { result } = renderHook(() => useGameActionHandler());
    expect(typeof result.current).toBe("function");
  });

  test("should execute action when game is active", () => {
    const mockAction = mock();
    const { result } = renderHook(() => useGameActionHandler());

    act(() => {
      result.current(mockAction);
    });

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockStartTransition).toHaveBeenCalledTimes(1);
  });

  test("should execute urgent action immediately", () => {
    const mockAction = mock();
    const { result } = renderHook(() => useGameActionHandler());

    act(() => {
      result.current(mockAction, true); // urgent = true
    });

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockStartTransition).toHaveBeenCalledTimes(0); // should not use transition
  });

  test("should not execute action when game is over", () => {
    mockGameState.isGameOver = true;

    const mockAction = mock();
    const { result } = renderHook(() => useGameActionHandler());

    act(() => {
      result.current(mockAction);
    });

    expect(mockAction).toHaveBeenCalledTimes(0);
    expect(mockStartTransition).toHaveBeenCalledTimes(0);
  });

  test("should not execute action when game is paused", () => {
    mockGameState.isPaused = true;

    const mockAction = mock();
    const { result } = renderHook(() => useGameActionHandler());

    act(() => {
      result.current(mockAction);
    });

    expect(mockAction).toHaveBeenCalledTimes(0);
    expect(mockStartTransition).toHaveBeenCalledTimes(0);
  });

  test("should not execute action when both game over and paused", () => {
    mockGameState.isGameOver = true;
    mockGameState.isPaused = true;

    const mockAction = mock();
    const { result } = renderHook(() => useGameActionHandler());

    act(() => {
      result.current(mockAction);
    });

    expect(mockAction).toHaveBeenCalledTimes(0);
    expect(mockStartTransition).toHaveBeenCalledTimes(0);
  });
});
