import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  calculateGhostPosition,
  createInitialGameState,
  hardDropTetromino,
  holdCurrentPiece,
  moveTetrominoBy,
  rotateTetrominoCW,
} from "@/game/game";
import { createDebugBag } from "@/game/pieceBag";
import { createTetromino } from "@/game/tetrominos";
import type { GameState, TetrominoTypeName } from "@/types/game";
import { type DebugParams, parseDebugParams } from "@/utils/debugParams";
import { getDebugPreset } from "@/utils/debugPresets";

interface GameStore extends GameState {
  showResetConfirmation: boolean;
  debugMode: boolean;
  debugParams: DebugParams | null;
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  holdPiece: () => void;
  togglePause: () => void;
  resetGame: () => void;
  showResetDialog: () => void;
  hideResetDialog: () => void;
  confirmReset: () => void;
  clearAnimationData: () => void;
  applyDebugPreset: (presetName: string) => void;
  setDebugQueue: (pieces: TetrominoTypeName[]) => void;
}

// Create initial state with debug parameters if present
function createInitialStateWithDebug(): GameState & {
  debugMode: boolean;
  debugParams: DebugParams | null;
} {
  const debugParams = parseDebugParams();
  const initialState = createInitialGameState();

  const result = {
    ...initialState,
    debugMode: debugParams.enabled,
    debugParams: debugParams.enabled ? debugParams : null,
  };

  if (debugParams.enabled) {
    // Apply preset if specified
    if (debugParams.preset) {
      const preset = getDebugPreset(debugParams.preset);
      if (preset) {
        result.board = preset.board;

        if (preset.score !== undefined) result.score = preset.score;
        if (preset.level !== undefined) result.level = preset.level;
        if (preset.lines !== undefined) result.lines = preset.lines;

        // Set up piece queue if specified in preset
        if (preset.nextPieces && preset.nextPieces.length > 0) {
          createDebugBag(preset.nextPieces); // Initialize debug bag
          result.currentPiece = createTetromino(preset.nextPieces[0]);
          result.nextPiece = preset.nextPieces[1] || "T";
          result.pieceBag = preset.nextPieces.slice(2);
        }
      }
    }

    // Override with URL parameters if specified
    if (debugParams.score !== undefined) result.score = debugParams.score;
    if (debugParams.level !== undefined) result.level = debugParams.level;
    if (debugParams.lines !== undefined) result.lines = debugParams.lines;

    // Set up custom piece queue from URL
    if (debugParams.queue && debugParams.queue.length > 0) {
      createDebugBag(debugParams.queue); // Initialize debug bag
      result.currentPiece = createTetromino(debugParams.queue[0]);
      result.nextPiece = debugParams.queue[1] || "T";
      result.pieceBag = debugParams.queue.slice(2);
    }

    // Recalculate ghost position after debug setup
    result.ghostPosition = calculateGhostPosition(result);
  }

  return result;
}

const INITIAL_STATE = createInitialStateWithDebug();

export const useGameStore = create<GameStore>()(
  devtools(
    immer((set) => ({
      ...INITIAL_STATE,
      showResetConfirmation: false,

      moveLeft: () => set((state) => moveTetrominoBy(state, -1, 0)),
      moveRight: () => set((state) => moveTetrominoBy(state, 1, 0)),
      moveDown: () => set((state) => moveTetrominoBy(state, 0, 1)),
      rotate: () => set((state) => rotateTetrominoCW(state)),
      drop: () => set((state) => hardDropTetromino(state)),
      holdPiece: () => set((state) => holdCurrentPiece(state)),

      togglePause: () =>
        set((state) => {
          if (!state.isGameOver) {
            state.isPaused = !state.isPaused;
          }
        }),
      resetGame: () =>
        set((state) => {
          const newState = createInitialStateWithDebug();
          Object.assign(state, newState);
          state.showResetConfirmation = false;
        }),
      showResetDialog: () =>
        set((state) => {
          // Only show reset dialog during active gameplay
          if (!state.isGameOver && !state.isPaused) {
            state.showResetConfirmation = true;
          }
        }),
      hideResetDialog: () =>
        set((state) => {
          state.showResetConfirmation = false;
        }),
      confirmReset: () =>
        set((state) => {
          const newState = createInitialStateWithDebug();
          Object.assign(state, newState);
          state.showResetConfirmation = false;
        }),
      clearAnimationData: () =>
        set((state) => {
          // Prevent unnecessary updates if animation states are already empty
          if (
            state.placedPositions.length > 0 ||
            state.clearingLines.length > 0 ||
            state.boardBeforeClear !== null
          ) {
            state.placedPositions = [];
            state.clearingLines = [];
            state.boardBeforeClear = null;
          }
        }),

      applyDebugPreset: (presetName: string) =>
        set((state) => {
          const preset = getDebugPreset(presetName);
          if (!preset || !state.debugMode) return;

          state.board = preset.board;

          if (preset.score !== undefined) state.score = preset.score;
          if (preset.level !== undefined) state.level = preset.level;
          if (preset.lines !== undefined) state.lines = preset.lines;

          if (preset.nextPieces && preset.nextPieces.length > 0) {
            createDebugBag(preset.nextPieces); // Initialize debug bag
            state.currentPiece = createTetromino(preset.nextPieces[0]);
            state.nextPiece = preset.nextPieces[1] || "T";
            state.pieceBag = preset.nextPieces.slice(2);
          }

          // Recalculate ghost position
          state.ghostPosition = calculateGhostPosition(state);
        }),

      setDebugQueue: (pieces: TetrominoTypeName[]) =>
        set((state) => {
          if (!state.debugMode || pieces.length === 0) return;

          createDebugBag(pieces); // Initialize debug bag
          state.currentPiece = createTetromino(pieces[0]);
          state.nextPiece = pieces[1] || "T";
          state.pieceBag = pieces.slice(2);

          // Recalculate ghost position
          state.ghostPosition = calculateGhostPosition(state);
        }),
    })),
    { name: "game-store" },
  ),
);
