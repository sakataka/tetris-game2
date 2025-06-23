import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { getGameSpeed } from "../game/game";
import { useGameStore } from "../store/gameStore";
import { useGameLoop } from "./useGameLoop";

// Type for the mocked game store subset used in these tests
type MockGameStoreSubset = {
  moveDown: () => void;
  isPaused: boolean;
  isGameOver: boolean;
  level: number;
  clearAnimationStates: () => void;
};

// Mock dependencies
mock.module("../game/game", () => ({
  getGameSpeed: mock(() => 1000),
}));

mock.module("../store/gameStore", () => ({
  useGameStore: mock(() => ({
    moveDown: mock(),
    isPaused: false,
    isGameOver: false,
    level: 1,
    clearAnimationStates: mock(),
  })),
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
    useGameStore.mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: 1,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    // Mock requestAnimationFrame
    global.requestAnimationFrame = mock((callback) => {
      const id = setTimeout(() => callback(Date.now()), 16);
      return id as unknown as number;
    });
    global.cancelAnimationFrame = mock((id) => clearTimeout(id));
  });

  test("should start game loop when not paused and not game over", () => {
    renderHook(() => useGameLoop());

    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  test("should not start game loop when paused", () => {
    useGameStore.mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: true,
      isGameOver: false,
      level: 1,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    renderHook(() => useGameLoop());

    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  test("should not start game loop when game is over", () => {
    useGameStore.mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: true,
      level: 1,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    renderHook(() => useGameLoop());

    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  test("should call moveDown with correct timing", async () => {
    const gameSpeed = 500;
    getGameSpeed.mockReturnValue(gameSpeed);

    renderHook(() => useGameLoop());

    // Fast-forward time to trigger game loop
    await Bun.sleep(gameSpeed + 100);

    expect(mockStartTransition).toHaveBeenCalled();
    expect(mockMoveDown).toHaveBeenCalled();
    expect(mockClearAnimationStates).toHaveBeenCalled();
  });

  test("should use game speed based on level", () => {
    const testLevel = 5;
    useGameStore.mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: testLevel,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

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
    useGameStore.mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: 2,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    rerender();

    expect(requestAnimationFrame.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  test("should call getGameSpeed with correct level", () => {
    const testLevel = 3;
    useGameStore.mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: testLevel,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    renderHook(() => useGameLoop());

    expect(getGameSpeed).toHaveBeenCalledWith(testLevel);
  });
});
