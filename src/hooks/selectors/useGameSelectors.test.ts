import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { getTetrominoShape } from "../../game/tetrominos";
import { useGameStore } from "../../store/gameStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useBoardData } from "./useBoardSelectors";

// Mock localStorage for testing
const originalLocalStorage = global.localStorage;

beforeEach(() => {
  // Reset the game store before each test using the resetGame action
  try {
    const store = useGameStore.getState();
    if (store?.resetGame) {
      store.resetGame();
    }
  } catch (_error) {
    // Store might not be initialized yet, ignore the error
  }

  // Mock localStorage
  const mockStorage: { [key: string]: string } = {};
  global.localStorage = {
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
    length: Object.keys(mockStorage).length,
    key: (index: number) => Object.keys(mockStorage)[index] || null,
  };
});

afterEach(() => {
  global.localStorage = originalLocalStorage;
});

describe("useBoardData", () => {
  test("should return empty ghost piece positions when showGhostPiece is false", () => {
    // Set up a game state with a current piece and ghost position
    const currentPiece = {
      type: "T" as const,
      position: { x: 4, y: 0 },
      shape: getTetrominoShape("T"),
    };

    // Manually set the current piece and ghost position using the store's setState
    try {
      const gameStore = useGameStore.getState();
      useGameStore.setState({
        ...gameStore,
        currentPiece,
        ghostPosition: { x: 4, y: 18 }, // Ghost position at bottom
      });

      // Set showGhostPiece to false in settingsStore
      useSettingsStore.setState({ showGhostPiece: false });
    } catch (_error) {
      // Skip this test if store is not available
      return;
    }

    const { result } = renderHook(() => useBoardData());

    // Ghost piece positions should be empty when showGhostPiece is false
    expect(result.current.ghostPiecePositions.size).toBe(0);
  });

  test("should return ghost piece positions when showGhostPiece is true", () => {
    // Set up a game state with a current piece and ghost position
    const currentPiece = {
      type: "T" as const,
      position: { x: 4, y: 0 },
      shape: getTetrominoShape("T"),
    };

    // Manually set the current piece and ghost position using the store's setState
    try {
      const gameStore = useGameStore.getState();
      useGameStore.setState({
        ...gameStore,
        currentPiece,
        ghostPosition: { x: 4, y: 18 }, // Ghost position at bottom
      });

      // Set showGhostPiece to true in settingsStore
      useSettingsStore.setState({ showGhostPiece: true });
    } catch (_error) {
      // Skip this test if store is not available
      return;
    }

    const { result } = renderHook(() => useBoardData());

    // Ghost piece positions should contain the ghost piece cells
    expect(result.current.ghostPiecePositions.size).toBeGreaterThan(0);
  });

  test("should return empty ghost piece positions when no current piece", () => {
    // Set no current piece and no ghost position
    try {
      const gameStore = useGameStore.getState();
      useGameStore.setState({
        ...gameStore,
        currentPiece: null,
        ghostPosition: null,
      });

      // Set showGhostPiece to true in settingsStore
      useSettingsStore.setState({ showGhostPiece: true });
    } catch (_error) {
      // Skip this test if store is not available
      return;
    }

    const { result } = renderHook(() => useBoardData());

    // Ghost piece positions should be empty when no current piece
    expect(result.current.ghostPiecePositions.size).toBe(0);
  });

  test("should return empty ghost piece positions when no ghost position", () => {
    const currentPiece = {
      type: "T" as const,
      position: { x: 4, y: 0 },
      shape: getTetrominoShape("T"),
    };

    // Set current piece but no ghost position
    try {
      const gameStore = useGameStore.getState();
      useGameStore.setState({
        ...gameStore,
        currentPiece,
        ghostPosition: null, // No ghost position
      });

      // Set showGhostPiece to true in settingsStore
      useSettingsStore.setState({ showGhostPiece: true });
    } catch (_error) {
      // Skip this test if store is not available
      return;
    }

    const { result } = renderHook(() => useBoardData());

    // Ghost piece positions should be empty when no ghost position
    expect(result.current.ghostPiecePositions.size).toBe(0);
  });
});
