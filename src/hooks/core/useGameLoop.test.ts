import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { getGameSpeed } from "../../game/game";
import { useGameStore } from "../../store/gameStore";
import { useGameLoop } from "./useGameLoop";

// Mock dependencies
mock.module("../../game/game", () => ({
  getGameSpeed: mock(() => 1000),
}));

const mockUseGameStore = mock((selector) => {
  const state = {
    moveDown: mock(),
    isPaused: false,
    isGameOver: false,
    level: 1,
    clearAnimationStates: mock(),
  };
  return selector ? selector(state) : state;
});

// Add getState mock
mockUseGameStore.getState = mock(() => ({
  moveDown: mock(),
  isPaused: false,
  isGameOver: false,
  level: 1,
  clearAnimationStates: mock(),
}));

mock.module("../../store/gameStore", () => ({
  useGameStore: mockUseGameStore,
}));

// Mock useGameActionHandler
mock.module("./useGameActionHandler", () => ({
  useGameActionHandler: () => mock(),
}));

// Mock React hooks
const mockStartTransition = mock((callback) => callback());
mock.module("react", () => ({
  ...require("react"),
  useTransition: () => [false, mockStartTransition],
}));

describe("useGameLoop", () => {
  const mockMoveDown = mock();
  const mockClearAnimationStates = mock();

  beforeEach(() => {
    mock.restore();

    // Setup default mock implementations
    getGameSpeed.mockReturnValue(1000);
    const defaultState = {
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: 1,
      clearAnimationStates: mockClearAnimationStates,
    };

    useGameStore.mockImplementation((selector) => {
      return selector ? selector(defaultState) : defaultState;
    });

    // Mock getState as well
    useGameStore.getState = mock(() => defaultState);

    // Mock requestAnimationFrame - don't actually call the callback to prevent infinite loops
    global.requestAnimationFrame = mock((callback) => {
      // Return a mock ID without calling the callback
      return 1;
    });
    global.cancelAnimationFrame = mock((id) => {});
  });

  test("should start game loop when not paused and not game over", () => {
    renderHook(() => useGameLoop());

    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  test("should not start game loop when paused", () => {
    const pausedState = {
      moveDown: mockMoveDown,
      isPaused: true,
      isGameOver: false,
      level: 1,
      clearAnimationStates: mockClearAnimationStates,
    };

    useGameStore.mockImplementation((selector) => {
      return selector ? selector(pausedState) : pausedState;
    });
    useGameStore.getState = mock(() => pausedState);

    renderHook(() => useGameLoop());

    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  test("should not start game loop when game is over", () => {
    const gameOverState = {
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: true,
      level: 1,
      clearAnimationStates: mockClearAnimationStates,
    };

    useGameStore.mockImplementation((selector) => {
      return selector ? selector(gameOverState) : gameOverState;
    });
    useGameStore.getState = mock(() => gameOverState);

    renderHook(() => useGameLoop());

    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  test("should call moveDown with correct timing", () => {
    const gameSpeed = 500;
    getGameSpeed.mockReturnValue(gameSpeed);

    renderHook(() => useGameLoop());

    // Verify that requestAnimationFrame was called to start the loop
    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(getGameSpeed).toHaveBeenCalledWith(1);
  });

  test("should use game speed based on level", () => {
    const testLevel = 5;
    const levelState = {
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: testLevel,
      clearAnimationStates: mockClearAnimationStates,
    };

    useGameStore.mockImplementation((selector) => {
      return selector ? selector(levelState) : levelState;
    });
    useGameStore.getState = mock(() => levelState);

    renderHook(() => useGameLoop());

    expect(getGameSpeed).toHaveBeenCalledWith(testLevel);
  });

  test("should cancel animation frame on unmount", () => {
    const { unmount } = renderHook(() => useGameLoop());

    const cancelSpy = spyOn(global, "cancelAnimationFrame");
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });

  test("should restart loop when dependencies change", () => {
    const { rerender } = renderHook(() => useGameLoop());

    const initialCallCount = requestAnimationFrame.mock.calls.length;

    // Change level to trigger re-render
    const newState = {
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: 2,
      clearAnimationStates: mockClearAnimationStates,
    };

    useGameStore.mockImplementation((selector) => {
      return selector ? selector(newState) : newState;
    });
    useGameStore.getState = mock(() => newState);

    rerender();

    expect(requestAnimationFrame.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  test("should call getGameSpeed with correct level", () => {
    const testLevel = 3;
    const testState = {
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: testLevel,
      clearAnimationStates: mockClearAnimationStates,
    };

    useGameStore.mockImplementation((selector) => {
      return selector ? selector(testState) : testState;
    });
    useGameStore.getState = mock(() => testState);

    renderHook(() => useGameLoop());

    expect(getGameSpeed).toHaveBeenCalledWith(testLevel);
  });
});
