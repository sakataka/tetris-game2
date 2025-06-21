import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
vi.mock("../store/gameStore");
vi.mock("react-hotkeys-hook");

// Mock React hooks
const mockStartTransition = vi.fn((callback) => callback());
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useTransition: () => [false, mockStartTransition],
  };
});

describe("useKeyboardControls", () => {
  const mockGameActions = {
    moveLeft: vi.fn(),
    moveRight: vi.fn(),
    moveDown: vi.fn(),
    rotate: vi.fn(),
    drop: vi.fn(),
    togglePause: vi.fn(),
    resetGame: vi.fn(),
    isPaused: false,
    isGameOver: false,
  };

  // Store hotkey handlers for testing - using proper react-hotkeys-hook signature
  const hotkeyHandlers: {
    [key: string]: (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => void;
  } = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Mock useGameStore
    vi.mocked(useGameStore).mockReturnValue(mockGameActions);

    // Mock useHotkeys to capture handlers
    const { useHotkeys } = await import("react-hotkeys-hook");
    vi.mocked(useHotkeys).mockImplementation((keys, handler) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach((key) => {
        hotkeyHandlers[key.toLowerCase()] = handler;
      });
      return { current: null };
    });
  });

  it("should initialize keyboard controls", () => {
    renderHook(() => useKeyboardControls());

    // Should have handlers registered for all keys
    expect(Object.keys(hotkeyHandlers).length).toBeGreaterThan(0);
  });

  describe("movement controls", () => {
    beforeEach(() => {
      renderHook(() => useKeyboardControls());
    });

    it("should move left on ArrowLeft", () => {
      hotkeyHandlers.arrowleft({} as KeyboardEvent, {} as HotkeysEvent);

      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockGameActions.moveLeft).toHaveBeenCalled();
    });

    it("should move right on ArrowRight", () => {
      hotkeyHandlers.arrowright({} as KeyboardEvent, {} as HotkeysEvent);

      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockGameActions.moveRight).toHaveBeenCalled();
    });

    it("should move down on ArrowDown", () => {
      hotkeyHandlers.arrowdown({} as KeyboardEvent, {} as HotkeysEvent);

      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockGameActions.moveDown).toHaveBeenCalled();
    });

    it("should not move when game is paused", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameActions,
        isPaused: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.arrowleft({} as KeyboardEvent, {} as HotkeysEvent);
      expect(mockGameActions.moveLeft).not.toHaveBeenCalled();
    });

    it("should not move when game is over", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameActions,
        isGameOver: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.arrowleft({} as KeyboardEvent, {} as HotkeysEvent);
      expect(mockGameActions.moveLeft).not.toHaveBeenCalled();
    });
  });

  describe("rotation and drop controls", () => {
    const mockEvent = { preventDefault: vi.fn() } as unknown as KeyboardEvent;

    beforeEach(() => {
      renderHook(() => useKeyboardControls());
      vi.mocked(mockEvent.preventDefault).mockClear();
    });

    it("should rotate on ArrowUp", () => {
      hotkeyHandlers.arrowup(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockGameActions.rotate).toHaveBeenCalled();
    });

    it("should drop on Space", () => {
      hotkeyHandlers.space(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.drop).toHaveBeenCalled();
      // Drop should not use transition (urgent action)
      expect(mockStartTransition).not.toHaveBeenCalled();
    });

    it("should not rotate when game is paused", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameActions,
        isPaused: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.arrowup(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.rotate).not.toHaveBeenCalled();
    });
  });

  describe("pause control", () => {
    const mockEvent = { preventDefault: vi.fn() } as unknown as KeyboardEvent;

    beforeEach(() => {
      vi.spyOn(Date, "now").mockReturnValue(1000);
      renderHook(() => useKeyboardControls());
      vi.mocked(mockEvent.preventDefault).mockClear();
    });

    it("should toggle pause on P key", () => {
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGameActions.togglePause).toHaveBeenCalled();
    });

    it("should toggle pause on lowercase p key", () => {
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);

      expect(mockGameActions.togglePause).toHaveBeenCalled();
    });

    it("should not pause when game is over", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameActions,
        isGameOver: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.togglePause).not.toHaveBeenCalled();
    });

    it("should debounce pause toggle", () => {
      // First call
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.togglePause).toHaveBeenCalledTimes(1);

      // Second call within debounce period (200ms)
      vi.mocked(Date.now).mockReturnValue(1100); // 100ms later
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.togglePause).toHaveBeenCalledTimes(1); // Still 1

      // Third call after debounce period
      vi.mocked(Date.now).mockReturnValue(1300); // 300ms from start
      hotkeyHandlers.p(mockEvent, {} as HotkeysEvent);
      expect(mockGameActions.togglePause).toHaveBeenCalledTimes(2); // Now 2
    });
  });

  describe("reset control", () => {
    const mockEvent = { preventDefault: vi.fn() } as unknown as KeyboardEvent;

    beforeEach(() => {
      vi.mocked(mockEvent.preventDefault).mockClear();
    });

    it("should reset game on Enter when game is over", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameActions,
        isGameOver: true,
      } as MockGameStoreSubset);

      renderHook(() => useKeyboardControls());

      hotkeyHandlers.enter(mockEvent, {} as HotkeysEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockGameActions.resetGame).toHaveBeenCalled();
    });

    it("should not reset game on Enter when game is not over", () => {
      renderHook(() => useKeyboardControls());

      hotkeyHandlers.enter(mockEvent, {} as HotkeysEvent);

      expect(mockGameActions.resetGame).not.toHaveBeenCalled();
    });
  });

  it("should work with different game states", () => {
    // Test paused state
    vi.mocked(useGameStore).mockReturnValue({
      ...mockGameActions,
      isPaused: true,
    } as MockGameStoreSubset);

    const { rerender } = renderHook(() => useKeyboardControls());

    hotkeyHandlers.p({ preventDefault: vi.fn() } as unknown as KeyboardEvent, {} as HotkeysEvent);
    expect(mockGameActions.togglePause).toHaveBeenCalled();

    // Test game over state
    vi.mocked(useGameStore).mockReturnValue({
      ...mockGameActions,
      isGameOver: true,
    } as MockGameStoreSubset);

    rerender();

    hotkeyHandlers.enter(
      { preventDefault: vi.fn() } as unknown as KeyboardEvent,
      {} as HotkeysEvent,
    );
    expect(mockGameActions.resetGame).toHaveBeenCalled();
  });
});
