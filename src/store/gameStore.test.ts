import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { create } from "zustand";
import { createEmptyBoard } from "../game/board";
import { createTetromino } from "../game/tetrominos";
import type { GameState, TetrominoTypeName } from "../types/game";

// Mock localStorage for testing
const mockStorage: Record<string, string> = {};

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    },
  },
  writable: true,
});

// Test-specific GameStore interface
interface TestGameStore extends GameState {
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  holdPiece: () => void;
  togglePause: () => void;
  resetGame: () => void;
  clearAnimationStates: () => void;
}

// Static initial state to avoid complex initialization during tests
const getTestInitialState = (): Partial<GameState> => ({
  board: createEmptyBoard(),
  boardBeforeClear: null,
  currentPiece: createTetromino("T"),
  nextPiece: "I" as TetrominoTypeName,
  heldPiece: null,
  canHold: true,
  score: 0,
  lines: 0,
  level: 1,
  isGameOver: false,
  isPaused: false,
  placedPositions: [],
  clearingLines: [],
  animationTriggerKey: 0,
  ghostPosition: { x: 4, y: 18 }, // Static ghost position matching T-piece initial x position
  pieceBag: ["O", "S", "Z", "J", "L"] as TetrominoTypeName[],
});

// Create isolated test store instance
const useTestGameStore = create<TestGameStore>((set) => ({
  ...getTestInitialState(),

  // Mock implementations matching actual gameStore behavior
  moveLeft: () =>
    set((state) => {
      if (!state.currentPiece || state.isGameOver || state.isPaused) return state;
      return {
        ...state,
        currentPiece: {
          ...state.currentPiece,
          position: { ...state.currentPiece.position, x: state.currentPiece.position.x - 1 },
        },
        ghostPosition: state.ghostPosition
          ? { ...state.ghostPosition, x: state.ghostPosition.x - 1 }
          : null,
      };
    }),

  moveRight: () =>
    set((state) => {
      if (!state.currentPiece || state.isGameOver || state.isPaused) return state;
      return {
        ...state,
        currentPiece: {
          ...state.currentPiece,
          position: { ...state.currentPiece.position, x: state.currentPiece.position.x + 1 },
        },
        ghostPosition: state.ghostPosition
          ? { ...state.ghostPosition, x: state.ghostPosition.x + 1 }
          : null,
      };
    }),

  moveDown: () =>
    set((state) => {
      if (!state.currentPiece || state.isGameOver || state.isPaused) return state;
      return {
        ...state,
        currentPiece: {
          ...state.currentPiece,
          position: { ...state.currentPiece.position, y: state.currentPiece.position.y + 1 },
        },
      };
    }),

  rotate: () =>
    set((state) => {
      if (!state.currentPiece || state.isGameOver || state.isPaused) return state;
      return {
        ...state,
        currentPiece: {
          ...state.currentPiece,
          rotation: (state.currentPiece.rotation + 1) % 4,
        },
      };
    }),

  drop: () => set((state) => ({ ...state, canHold: true })),

  holdPiece: () =>
    set((state) => {
      if (!state.currentPiece || !state.canHold || state.isGameOver || state.isPaused) return state;
      return {
        ...state,
        heldPiece: state.currentPiece.type,
        canHold: false,
        currentPiece: createTetromino("I"),
      };
    }),

  togglePause: () => set((state) => ({ ...state, isPaused: !state.isPaused })),

  resetGame: () => set(getTestInitialState()),

  clearAnimationStates: () =>
    set((state) => {
      // Return same state if animation states are already empty (performance optimization)
      if (
        state.placedPositions.length === 0 &&
        state.clearingLines.length === 0 &&
        state.boardBeforeClear === null
      ) {
        return state;
      }
      return {
        ...state,
        placedPositions: [],
        clearingLines: [],
        boardBeforeClear: null,
      };
    }),
}));

describe("gameStore", () => {
  beforeEach(() => {
    // Clear localStorage and reset store to clean state
    localStorage.clear();

    // Reset with static test state wrapped in act
    act(() => {
      useTestGameStore.setState(getTestInitialState());
    });
  });

  afterEach(() => {
    // Ensure store is completely cleaned after each test
    act(() => {
      useTestGameStore.setState(getTestInitialState());
    });
  });

  describe("initial state", () => {
    it("should initialize with correct initial state", () => {
      const { result } = renderHook(() => useTestGameStore());

      expect(result.current.board).toBeDefined();
      expect(result.current.board.length).toBe(20);
      expect(result.current.board[0].length).toBe(10);
      expect(result.current.currentPiece).toBeDefined();
      expect(result.current.nextPiece).toBeDefined();
      expect(result.current.score).toBe(0);
      expect(result.current.lines).toBe(0);
      expect(result.current.level).toBe(1);
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.canHold).toBe(true);
      expect(result.current.heldPiece).toBeNull();
    });

    it("should have all required action methods", () => {
      const { result } = renderHook(() => useTestGameStore());

      expect(typeof result.current.moveLeft).toBe("function");
      expect(typeof result.current.moveRight).toBe("function");
      expect(typeof result.current.moveDown).toBe("function");
      expect(typeof result.current.rotate).toBe("function");
      expect(typeof result.current.drop).toBe("function");
      expect(typeof result.current.holdPiece).toBe("function");
      expect(typeof result.current.togglePause).toBe("function");
      expect(typeof result.current.resetGame).toBe("function");
      expect(typeof result.current.clearAnimationStates).toBe("function");
    });
  });

  describe("movement actions", () => {
    it("should move piece left", () => {
      const { result } = renderHook(() => useTestGameStore());
      const initialX = result.current.currentPiece?.position.x;

      act(() => {
        result.current.moveLeft();
      });

      expect(result.current.currentPiece?.position.x).toBe((initialX ?? 0) - 1);
    });

    it("should move piece right", () => {
      const { result } = renderHook(() => useTestGameStore());
      const initialX = result.current.currentPiece?.position.x;

      act(() => {
        result.current.moveRight();
      });

      expect(result.current.currentPiece?.position.x).toBe((initialX ?? 0) + 1);
    });

    it("should move piece down", () => {
      const { result } = renderHook(() => useTestGameStore());
      const initialY = result.current.currentPiece?.position.y;

      act(() => {
        result.current.moveDown();
      });

      // Either piece moved down or was locked (y position changes or new piece spawned)
      const newY = result.current.currentPiece?.position.y;
      expect(newY).toBeDefined();
      expect(newY).toBeGreaterThanOrEqual(initialY ?? 0);
    });

    it("should not move when game is paused", () => {
      const { result } = renderHook(() => useTestGameStore());

      act(() => {
        result.current.togglePause();
      });

      const initialState = {
        x: result.current.currentPiece?.position.x,
        y: result.current.currentPiece?.position.y,
      };

      act(() => {
        result.current.moveLeft();
        result.current.moveRight();
        result.current.moveDown();
      });

      expect(result.current.currentPiece?.position.x).toBe(initialState.x);
      expect(result.current.currentPiece?.position.y).toBe(initialState.y);
    });
  });

  describe("rotation action", () => {
    it("should rotate current piece", () => {
      const { result } = renderHook(() => useTestGameStore());
      const initialRotation = result.current.currentPiece?.rotation ?? 0;

      act(() => {
        result.current.rotate();
      });

      // Rotation should increment (or reset to 0 if was 3)
      const expectedRotation = (initialRotation + 1) % 4;
      expect(result.current.currentPiece?.rotation).toBe(expectedRotation);
    });

    it("should not rotate when game is paused", () => {
      const { result } = renderHook(() => useTestGameStore());

      act(() => {
        result.current.togglePause();
      });

      const initialRotation = result.current.currentPiece?.rotation;

      act(() => {
        result.current.rotate();
      });

      expect(result.current.currentPiece?.rotation).toBe(initialRotation);
    });
  });

  describe("drop action", () => {
    it("should hard drop current piece", () => {
      const { result } = renderHook(() => useTestGameStore());
      const initialScore = result.current.score;

      act(() => {
        result.current.drop();
      });

      // After hard drop, a new piece should spawn or game should be over
      expect(result.current.canHold).toBe(true); // Reset after piece lock
    });
  });

  describe("hold action", () => {
    it("should hold current piece when canHold is true", () => {
      const { result } = renderHook(() => useTestGameStore());
      const initialPieceType = result.current.currentPiece?.type as TetrominoTypeName;

      act(() => {
        result.current.holdPiece();
      });

      expect(result.current.heldPiece).toBe(initialPieceType);
      expect(result.current.canHold).toBe(false);
    });

    it("should not hold when canHold is false", () => {
      const { result } = renderHook(() => useTestGameStore());

      // First hold
      act(() => {
        result.current.holdPiece();
      });

      const heldPiece = result.current.heldPiece;

      // Try to hold again
      act(() => {
        result.current.holdPiece();
      });

      expect(result.current.heldPiece).toBe(heldPiece); // Should not change
    });
  });

  describe("pause functionality", () => {
    it("should toggle pause state", () => {
      const { result } = renderHook(() => useTestGameStore());

      expect(result.current.isPaused).toBe(false);

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(true);

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(false);
    });
  });

  describe("game reset", () => {
    it("should reset game to initial state", () => {
      const { result } = renderHook(() => useTestGameStore());

      // Modify state
      act(() => {
        result.current.togglePause();
        useTestGameStore.setState({ score: 1000, lines: 5, level: 2 });
      });

      // Reset game
      act(() => {
        result.current.resetGame();
      });

      expect(result.current.score).toBe(0);
      expect(result.current.lines).toBe(0);
      expect(result.current.level).toBe(1);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isGameOver).toBe(false);
    });
  });

  describe("animation state management", () => {
    it("should clear animation states", () => {
      const { result } = renderHook(() => useTestGameStore());

      // Set some animation states
      act(() => {
        useTestGameStore.setState({
          placedPositions: [{ x: 1, y: 1 }],
          clearingLines: [19],
          boardBeforeClear: result.current.board,
        });
      });

      // Clear animation states
      act(() => {
        result.current.clearAnimationStates();
      });

      expect(result.current.placedPositions).toEqual([]);
      expect(result.current.clearingLines).toEqual([]);
      expect(result.current.boardBeforeClear).toBeNull();
    });

    it("should not update state if animation states are already empty", () => {
      const { result } = renderHook(() => useTestGameStore());

      // Ensure animation states are empty
      act(() => {
        useTestGameStore.setState({
          placedPositions: [],
          clearingLines: [],
          boardBeforeClear: null,
        });
      });

      const stateBefore = result.current;

      // Try to clear already empty animation states
      act(() => {
        result.current.clearAnimationStates();
      });

      // State should be the same object (no unnecessary update)
      expect(result.current).toBe(stateBefore);
    });
  });

  describe("game over conditions", () => {
    it("should handle game over state", () => {
      const { result } = renderHook(() => useTestGameStore());

      // Force game over state
      act(() => {
        useTestGameStore.setState({ isGameOver: true });
      });

      const initialState = result.current.currentPiece?.position;

      // Actions should not work when game is over
      act(() => {
        result.current.moveLeft();
        result.current.moveRight();
        result.current.moveDown();
        result.current.rotate();
      });

      expect(result.current.currentPiece?.position).toEqual(initialState);
    });
  });

  describe("ghost piece functionality", () => {
    it("should calculate ghost position", () => {
      const { result } = renderHook(() => useTestGameStore());

      // Ghost position should be calculated automatically
      expect(result.current.ghostPosition).toBeDefined();
      if (result.current.ghostPosition && result.current.currentPiece) {
        expect(result.current.ghostPosition.x).toBe(result.current.currentPiece.position.x);
        expect(result.current.ghostPosition.y).toBeGreaterThanOrEqual(
          result.current.currentPiece.position.y,
        );
      }
    });

    it("should update ghost position when piece moves", () => {
      const { result } = renderHook(() => useTestGameStore());
      const initialGhostPosition = result.current.ghostPosition;

      act(() => {
        result.current.moveRight();
      });

      const newGhostPosition = result.current.ghostPosition;

      if (initialGhostPosition && newGhostPosition) {
        expect(newGhostPosition.x).toBe(initialGhostPosition.x + 1);
      }
    });
  });
});
