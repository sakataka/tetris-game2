import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderHook } from "@testing-library/react";
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

// Mock game actions
const mockGameActions = {
  moveLeft: mock(),
  moveRight: mock(),
  moveDown: mock(),
  rotate: mock(),
  drop: mock(),
  holdPiece: mock(),
  togglePause: mock(),
  resetGame: mock(),
};

// Mock game state
let mockGameState = {
  ...mockGameActions,
  isGameOver: false,
  isPaused: false,
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

// Mock only startTransition, let React hooks work normally
const mockStartTransition = mock((callback) => callback());
mock.module("react", () => ({
  ...require("react"),
  useTransition: () => [false, mockStartTransition],
}));

// Store hotkey handlers for testing
const hotkeyHandlers: {
  [key: string]: (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => void;
} = {};

// Mock useHotkeys
mock.module("react-hotkeys-hook", () => ({
  useHotkeys: mock((keys, handler) => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach((key) => {
      hotkeyHandlers[key.toLowerCase()] = handler;
    });
    return { current: null };
  }),
}));

describe("useKeyboardControls", () => {
  beforeEach(() => {
    // Reset game state
    mockGameState = {
      ...mockGameActions,
      isGameOver: false,
      isPaused: false,
    };

    // Clear all mock call histories
    Object.values(mockGameActions).forEach((mockFn) => {
      mockFn.mockClear();
    });
    mockStartTransition.mockClear();

    // Clear hotkey handlers
    Object.keys(hotkeyHandlers).forEach((key) => delete hotkeyHandlers[key]);
  });

  test("should initialize keyboard controls", () => {
    renderHook(() => useKeyboardControls());
    expect(Object.keys(hotkeyHandlers).length).toBeGreaterThan(0);
  });

  describe("movement controls", () => {
    beforeEach(() => {
      renderHook(() => useKeyboardControls());
    });

    test("should move left on ArrowLeft", () => {
      hotkeyHandlers.arrowleft({} as KeyboardEvent, {} as HotkeysEvent);
      expect(mockGameActions.moveLeft).toHaveBeenCalledTimes(1);
    });

    test("should move right on ArrowRight", () => {
      hotkeyHandlers.arrowright({} as KeyboardEvent, {} as HotkeysEvent);
      expect(mockGameActions.moveRight).toHaveBeenCalledTimes(1);
    });

    test("should move down on ArrowDown", () => {
      hotkeyHandlers.arrowdown({} as KeyboardEvent, {} as HotkeysEvent);
      expect(mockGameActions.moveDown).toHaveBeenCalledTimes(1);
    });

    test("should not move when game is paused", () => {
      mockGameState.isPaused = true;

      // Re-render hook with new state
      renderHook(() => useKeyboardControls());

      hotkeyHandlers.arrowleft({} as KeyboardEvent, {} as HotkeysEvent);
      hotkeyHandlers.arrowright({} as KeyboardEvent, {} as HotkeysEvent);
      hotkeyHandlers.arrowdown({} as KeyboardEvent, {} as HotkeysEvent);

      expect(mockGameActions.moveLeft).not.toHaveBeenCalled();
      expect(mockGameActions.moveRight).not.toHaveBeenCalled();
      expect(mockGameActions.moveDown).not.toHaveBeenCalled();
    });

    test("should not move when game is over", () => {
      mockGameState.isGameOver = true;

      // Re-render hook with new state
      renderHook(() => useKeyboardControls());

      hotkeyHandlers.arrowleft({} as KeyboardEvent, {} as HotkeysEvent);
      hotkeyHandlers.arrowright({} as KeyboardEvent, {} as HotkeysEvent);
      hotkeyHandlers.arrowdown({} as KeyboardEvent, {} as HotkeysEvent);

      expect(mockGameActions.moveLeft).not.toHaveBeenCalled();
      expect(mockGameActions.moveRight).not.toHaveBeenCalled();
      expect(mockGameActions.moveDown).not.toHaveBeenCalled();
    });
  });

  describe("rotation and drop controls", () => {
    const mockEvent = {
      preventDefault: mock(),
    } as unknown as KeyboardEvent;

    beforeEach(() => {
      renderHook(() => useKeyboardControls());
      mockEvent.preventDefault.mockClear();
    });

    test("should rotate on ArrowUp", () => {
      hotkeyHandlers.arrowup(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.rotate).toHaveBeenCalledTimes(1);
    });

    test("should drop on Space", () => {
      hotkeyHandlers.space(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.drop).toHaveBeenCalledTimes(1);
    });

    test("should hold piece on Shift", () => {
      hotkeyHandlers.shift(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.holdPiece).toHaveBeenCalledTimes(1);
    });

    test("should not rotate when game is paused", () => {
      mockGameState.isPaused = true;

      // Re-render hook with new state
      renderHook(() => useKeyboardControls());

      hotkeyHandlers.arrowup(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.rotate).not.toHaveBeenCalled();
    });
  });

  describe("pause control", () => {
    const mockEvent = {
      preventDefault: mock(),
    } as unknown as KeyboardEvent;

    beforeEach(() => {
      renderHook(() => useKeyboardControls());
      mockEvent.preventDefault.mockClear();
    });

    test("should toggle pause on P key", () => {
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.togglePause).toHaveBeenCalledTimes(1);
    });

    test("should not pause when game is over", () => {
      mockGameState.isGameOver = true;

      // Re-render hook with new state
      renderHook(() => useKeyboardControls());

      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);

      expect(mockGameActions.togglePause).not.toHaveBeenCalled();
    });
  });

  describe("reset control", () => {
    const mockEvent = {
      preventDefault: mock(),
    } as unknown as KeyboardEvent;

    beforeEach(() => {
      renderHook(() => useKeyboardControls());
      mockEvent.preventDefault.mockClear();
    });

    test("should reset game on Enter when game is over", () => {
      mockGameState.isGameOver = true;

      // Re-render hook with new state
      renderHook(() => useKeyboardControls());

      hotkeyHandlers.enter(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.resetGame).toHaveBeenCalledTimes(1);
    });

    test("should not reset game on Enter when game is not over", () => {
      mockGameState.isGameOver = false;

      hotkeyHandlers.enter(mockEvent, {} as HotkeysEvent);

      expect(mockGameActions.resetGame).not.toHaveBeenCalled();
    });
  });
});
