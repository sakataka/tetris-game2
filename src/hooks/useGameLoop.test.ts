import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
vi.mock("../game/game");
vi.mock("../store/gameStore");

// Mock React hooks
const mockStartTransition = vi.fn((callback) => callback());
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useTransition: () => [false, mockStartTransition],
  };
});

describe("useGameLoop", () => {
  const mockMoveDown = vi.fn();
  const mockClearAnimationStates = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Setup default mock implementations
    vi.mocked(getGameSpeed).mockReturnValue(1000);
    vi.mocked(useGameStore).mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: 1,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((callback) => {
      const id = setTimeout(() => callback(Date.now()), 16);
      return id as unknown as number;
    });
    global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));
  });

  it("should start game loop when not paused and not game over", () => {
    renderHook(() => useGameLoop());

    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it("should not start game loop when paused", () => {
    vi.mocked(useGameStore).mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: true,
      isGameOver: false,
      level: 1,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    renderHook(() => useGameLoop());

    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("should not start game loop when game is over", () => {
    vi.mocked(useGameStore).mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: true,
      level: 1,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    renderHook(() => useGameLoop());

    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("should call moveDown with correct timing", async () => {
    const gameSpeed = 500;
    vi.mocked(getGameSpeed).mockReturnValue(gameSpeed);

    renderHook(() => useGameLoop());

    // Fast-forward time to trigger game loop
    vi.advanceTimersByTime(gameSpeed + 100);

    expect(mockStartTransition).toHaveBeenCalled();
    expect(mockMoveDown).toHaveBeenCalled();
    expect(mockClearAnimationStates).toHaveBeenCalled();
  });

  it("should use game speed based on level", () => {
    const testLevel = 5;
    vi.mocked(useGameStore).mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: testLevel,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    renderHook(() => useGameLoop());

    expect(getGameSpeed).toHaveBeenCalledWith(testLevel);
  });

  it("should cancel animation frame on unmount", () => {
    const { unmount } = renderHook(() => useGameLoop());

    const cancelSpy = vi.spyOn(global, "cancelAnimationFrame");
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it("should restart loop when dependencies change", () => {
    const { rerender } = renderHook(() => useGameLoop());

    const initialCallCount = vi.mocked(requestAnimationFrame).mock.calls.length;

    // Change level to trigger re-render
    vi.mocked(useGameStore).mockReturnValue({
      moveDown: mockMoveDown,
      isPaused: false,
      isGameOver: false,
      level: 2,
      clearAnimationStates: mockClearAnimationStates,
    } as MockGameStoreSubset);

    rerender();

    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it("should call getGameSpeed with correct level", () => {
    const testLevel = 3;
    vi.mocked(useGameStore).mockReturnValue({
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
