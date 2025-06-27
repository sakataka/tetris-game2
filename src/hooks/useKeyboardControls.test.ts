import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useGameStore } from "../store/gameStore";
import { useKeyboardControls } from "./useKeyboardControls";

// Local type definition for HotkeysEvent since it's not directly exported
type HotkeysEvent = {
  keys?: readonly string[];
  scopes?: string | readonly string[];
  description?: string;
  isSequence?: boolean;
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  mod?: boolean;
  useKey?: boolean;
};

// Type for the mocked game store subset used in these tests
type MockGameStoreSubset = {
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  togglePause: () => void;
  resetGame: () => void;
  isPaused: boolean;
  isGameOver: boolean;
};

// Mock dependencies
mock.module("../store/gameStore", () => ({
  useGameStore: mock((selector?: any) => {
    const mockStore = {
      moveLeft: mock(),
      moveRight: mock(),
      moveDown: mock(),
      rotate: mock(),
      drop: mock(),
      togglePause: mock(),
      resetGame: mock(),
      isPaused: false,
      isGameOver: false,
    };
    if (typeof selector === "function") {
      return selector(mockStore);
    }
    return mockStore;
  }),
}));

// Mock React hooks
const mockStartTransition = mock((callback) => callback());
mock.module("react", () => ({
  ...require("react"),
  useTransition: () => [false, mockStartTransition],
}));

describe("useKeyboardControls", () => {
  const mockGameActions = {
    moveLeft: mock(),
    moveRight: mock(),
    moveDown: mock(),
    rotate: mock(),
    drop: mock(),
    togglePause: mock(),
    resetGame: mock(),
    isPaused: false,
    isGameOver: false,
  };

  // Store hotkey handlers for testing - using proper react-hotkeys-hook signature
  const hotkeyHandlers: {
    [key: string]: (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => void;
  } = {};

  beforeEach(async () => {
    mock.restore();

    // Clear all mock call histories
    Object.values(mockGameActions).forEach((mockFn) => {
      if (typeof mockFn === "function" && "mockClear" in mockFn) {
        (mockFn as { mockClear: () => void }).mockClear();
      }
    });
    mockStartTransition.mockClear();

    // Reset game state to default
    mockGameActions.isPaused = false;
    mockGameActions.isGameOver = false;

    // Mock useGameStore
    useGameStore.mockReturnValue(mockGameActions);

    // Mock useHotkeys to capture handlers
    mock.module("react-hotkeys-hook", () => ({
      useHotkeys: mock((keys, handler) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach((key) => {
          hotkeyHandlers[key.toLowerCase()] = handler;
        });
        return { current: null };
      }),
    }));
  });

  test("should initialize keyboard controls", () => {
    renderHook(() => useKeyboardControls());

    // Should have handlers registered for all keys
    expect(Object.keys(hotkeyHandlers).length).toBeGreaterThan(0);
  });

  describe("movement controls", () => {
    beforeEach(() => {
      renderHook(() => useKeyboardControls());
    });

    test("should move left on ArrowLeft", () => {
      hotkeyHandlers.arrowleft({} as KeyboardEvent, {} as HotkeysEvent);

      expect(mockGameActions.moveLeft).toHaveBeenCalled();
    });

    test("should move right on ArrowRight", () => {
      hotkeyHandlers.arrowright({} as KeyboardEvent, {} as HotkeysEvent);

      expect(mockGameActions.moveRight).toHaveBeenCalled();
    });

    test("should move down on ArrowDown", () => {
      hotkeyHandlers.arrowdown({} as KeyboardEvent, {} as HotkeysEvent);

      expect(mockGameActions.moveDown).toHaveBeenCalled();
    });

    test("should not move when game is paused", () => {
      useGameStore.mockReturnValue({
        ...mockGameActions,
        isPaused: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.arrowleft({} as KeyboardEvent, {} as HotkeysEvent);
      expect(mockGameActions.moveLeft).not.toHaveBeenCalled();
    });

    test("should not move when game is over", () => {
      useGameStore.mockReturnValue({
        ...mockGameActions,
        isGameOver: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.arrowleft({} as KeyboardEvent, {} as HotkeysEvent);
      expect(mockGameActions.moveLeft).not.toHaveBeenCalled();
    });
  });

  describe("rotation and drop controls", () => {
    const mockEvent = { preventDefault: mock() } as unknown as KeyboardEvent;

    beforeEach(() => {
      renderHook(() => useKeyboardControls());
      mockEvent.preventDefault.mockClear();
    });

    test("should rotate on ArrowUp", () => {
      hotkeyHandlers.arrowup(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.rotate).toHaveBeenCalled();
    });

    test("should drop on Space", () => {
      hotkeyHandlers.space(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.drop).toHaveBeenCalled();
    });

    test("should not rotate when game is paused", () => {
      useGameStore.mockReturnValue({
        ...mockGameActions,
        isPaused: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.arrowup(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.rotate).not.toHaveBeenCalled();
    });
  });

  describe("pause control", () => {
    const mockEvent = { preventDefault: mock() } as unknown as KeyboardEvent;

    beforeEach(() => {
      spyOn(Date, "now").mockReturnValue(1000);
      renderHook(() => useKeyboardControls());
      mockEvent.preventDefault.mockClear();
    });

    test("should toggle pause on P key", () => {
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.togglePause).toHaveBeenCalled();
    });

    test("should toggle pause on lowercase p key", () => {
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);

      expect(mockGameActions.togglePause).toHaveBeenCalled();
    });

    test("should not pause when game is over", () => {
      useGameStore.mockReturnValue({
        ...mockGameActions,
        isGameOver: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.togglePause).not.toHaveBeenCalled();
    });

    test("should debounce pause toggle", () => {
      // First call
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.togglePause).toHaveBeenCalledTimes(1);

      // Second call within debounce period (200ms)
      Date.now.mockReturnValue(1100); // 100ms later
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.togglePause).toHaveBeenCalledTimes(1); // Still 1

      // Third call after debounce period
      Date.now.mockReturnValue(1300); // 300ms from start
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.togglePause).toHaveBeenCalledTimes(2); // Now 2
    });
  });

  describe("reset control", () => {
    const mockEvent = { preventDefault: mock() } as unknown as KeyboardEvent;

    beforeEach(() => {
      mockEvent.preventDefault.mockClear();
    });

    test("should reset game on Enter when game is over", () => {
      useGameStore.mockReturnValue({
        ...mockGameActions,
        isGameOver: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.enter(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockGameActions.resetGame).toHaveBeenCalled();
    });

    test("should not reset game on Enter when game is not over", () => {
      renderHook(() => useKeyboardControls());

      hotkeyHandlers.enter(mockEvent, {} as HotkeysEvent);

      expect(mockGameActions.resetGame).not.toHaveBeenCalled();
    });
  });

  test("should work with different game states", () => {
    // Test paused state
    useGameStore.mockReturnValue({
      ...mockGameActions,
      isPaused: true,
    } as MockGameStoreSubset);

    const { rerender } = renderHook(() => useKeyboardControls());

    hotkeyHandlers.p({ preventDefault: mock() } as unknown as KeyboardEvent, {} as HotkeysEvent);
    expect(mockGameActions.togglePause).toHaveBeenCalled();

    // Test game over state
    useGameStore.mockReturnValue({
      ...mockGameActions,
      isGameOver: true,
    } as MockGameStoreSubset);

    rerender();

    hotkeyHandlers.enter(
      { preventDefault: mock() } as unknown as KeyboardEvent,
      {} as HotkeysEvent,
    );
    expect(mockGameActions.resetGame).toHaveBeenCalled();
  });
});
