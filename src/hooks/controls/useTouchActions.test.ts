import { beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useTouchActions } from "./useTouchActions";
import type { SwipeGesture, TapGesture } from "./useTouchDetection";

// Mock game actions
const mockGameActions = {
  moveLeft: mock(),
  moveRight: mock(),
  moveDown: mock(),
  rotate: mock(),
  drop: mock(),
};

// Mock game state
let mockGameState = {
  ...mockGameActions,
  isPaused: false,
  isGameOver: false,
};

// Mock useGameStore
mock.module("../../store/gameStore", () => ({
  useGameStore: mock((selector) => {
    if (typeof selector === "function") {
      return selector(mockGameState);
    }
    return mockGameState;
  }),
}));

// Mock useGameActionHandler to execute actions directly
mock.module("../core/useGameActionHandler", () => ({
  useGameActionHandler: () =>
    mock((action, _urgent = false) => {
      // Only execute action if game is not paused or over
      if (!mockGameState.isGameOver && !mockGameState.isPaused) {
        action();
      }
    }),
}));

// Mock only startTransition, let React hooks work normally
const mockStartTransition = mock((callback) => callback());
mock.module("react", () => ({
  ...require("react"),
  useTransition: () => [false, mockStartTransition],
}));

describe("useTouchActions", () => {
  beforeEach(() => {
    // Reset game state
    mockGameState = {
      ...mockGameActions,
      isPaused: false,
      isGameOver: false,
    };

    // Reset mock store state before each test
    Object.values(mockGameActions).forEach((mockFn) => {
      mockFn.mockClear();
    });
    mockStartTransition.mockClear();
  });

  it("returns action handlers", () => {
    const { result } = renderHook(() => useTouchActions());

    expect(typeof result.current.handleSwipe).toBe("function");
    expect(typeof result.current.handleTap).toBe("function");
    expect(typeof result.current.handleDoubleTap).toBe("function");
  });

  describe("handleSwipe", () => {
    it("handles left swipe to move left", () => {
      const { result } = renderHook(() => useTouchActions());

      const swipeGesture: SwipeGesture = {
        direction: "left",
        distance: 50,
        deltaTime: 200,
        isLongSwipe: false,
      };

      result.current.handleSwipe(swipeGesture);

      expect(mockGameActions.moveLeft).toHaveBeenCalledTimes(1);
    });

    it("handles right swipe to move right", () => {
      const { result } = renderHook(() => useTouchActions());

      const swipeGesture: SwipeGesture = {
        direction: "right",
        distance: 50,
        deltaTime: 200,
        isLongSwipe: false,
      };

      result.current.handleSwipe(swipeGesture);

      expect(mockGameActions.moveRight).toHaveBeenCalledTimes(1);
    });

    it("handles short down swipe to soft drop", () => {
      const { result } = renderHook(() => useTouchActions());

      const swipeGesture: SwipeGesture = {
        direction: "down",
        distance: 40,
        deltaTime: 200,
        isLongSwipe: false,
      };

      result.current.handleSwipe(swipeGesture);

      expect(mockGameActions.moveDown).toHaveBeenCalledTimes(1);
    });

    it("handles long down swipe to hard drop", () => {
      const { result } = renderHook(() => useTouchActions());

      const swipeGesture: SwipeGesture = {
        direction: "down",
        distance: 80,
        deltaTime: 200,
        isLongSwipe: true,
      };

      result.current.handleSwipe(swipeGesture);

      expect(mockGameActions.drop).toHaveBeenCalledTimes(1);
    });

    it("ignores up swipe", () => {
      const { result } = renderHook(() => useTouchActions());

      const swipeGesture: SwipeGesture = {
        direction: "up",
        distance: 50,
        deltaTime: 200,
        isLongSwipe: false,
      };

      result.current.handleSwipe(swipeGesture);

      // No actions should be called
      Object.values(mockGameActions).forEach((mockFn) => {
        expect(mockFn).not.toHaveBeenCalled();
      });
    });
  });

  describe("handleTap", () => {
    it("handles tap to rotate", () => {
      const { result } = renderHook(() => useTouchActions());

      const tapGesture: TapGesture = {
        x: 100,
        y: 100,
        deltaTime: 150,
      };

      result.current.handleTap(tapGesture);

      expect(mockGameActions.rotate).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleDoubleTap", () => {
    it("handles double tap to hard drop", () => {
      const { result } = renderHook(() => useTouchActions());

      const doubleTapGesture: TapGesture = {
        x: 100,
        y: 100,
        deltaTime: 150,
      };

      result.current.handleDoubleTap(doubleTapGesture);

      expect(mockGameActions.drop).toHaveBeenCalledTimes(1);
    });
  });

  describe("game state handling", () => {
    it("respects paused state", () => {
      mockGameState.isPaused = true;
      const { result } = renderHook(() => useTouchActions());

      const swipeGesture: SwipeGesture = {
        direction: "right",
        distance: 50,
        deltaTime: 200,
        isLongSwipe: false,
      };

      result.current.handleSwipe(swipeGesture);

      expect(mockGameActions.moveRight).not.toHaveBeenCalled();
    });

    it("respects game over state", () => {
      mockGameState.isGameOver = true;
      const { result } = renderHook(() => useTouchActions());

      const tapGesture: TapGesture = {
        x: 100,
        y: 100,
        deltaTime: 150,
      };

      result.current.handleTap(tapGesture);

      expect(mockGameActions.rotate).not.toHaveBeenCalled();
    });
  });
});
