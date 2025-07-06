import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  calculateGhostPosition,
  createInitialGameState,
  hardDropTetromino,
  holdCurrentPieceLegacy,
  moveTetrominoByLegacy,
  rotateTetrominoCWLegacy,
} from "@/game/game";
import { createDebugBag } from "@/game/pieceBag";
import { createTetromino } from "@/game/tetrominos";
import type {
  AnimationController,
  GameAnimationState,
  GameState,
  LineClearAnimationData,
  TetrominoTypeName,
} from "@/types/game";
import { type DebugParams, parseDebugParams } from "@/utils/debugParams";
import { getDebugPreset } from "@/utils/debugPresets";

interface GameStore extends GameState {
  showResetConfirmation: boolean;
  debugMode: boolean;
  debugParams: DebugParams | null;

  // Animation state fields
  animationState: GameAnimationState;
  lineClearData: LineClearAnimationData | null;
  animationController: AnimationController | null;

  // Movement and game actions
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

  // Animation control actions
  startLineClearAnimation: (data: LineClearAnimationData) => void;
  completeLineClearAnimation: () => void;
  startLineFallAnimation: () => void;
  completeLineFallAnimation: () => void;
  resetToPlayingState: () => void; // Error recovery

  // Derived state selectors
  isGameLoopPaused: () => boolean;
  isAnimationActive: () => boolean;
}

// Create initial state with debug parameters if present
function createInitialStateWithDebug(): GameState & {
  debugMode: boolean;
  debugParams: DebugParams | null;
  animationState: GameAnimationState;
  lineClearData: LineClearAnimationData | null;
  animationController: AnimationController | null;
} {
  const debugParams = parseDebugParams();
  const initialState = createInitialGameState();

  const result = {
    ...initialState,
    debugMode: debugParams.enabled,
    debugParams: debugParams.enabled ? debugParams : null,
    animationState: "idle" as GameAnimationState,
    lineClearData: null,
    animationController: null,
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

const resetGameState = (state: GameStore) => {
  Object.assign(state, createInitialStateWithDebug());
  state.showResetConfirmation = false;
  state.animationState = "idle";
  state.lineClearData = null;
  state.animationController = null;
};

export const useGameStore = create<GameStore>()(
  devtools(
    immer((set, get) => ({
      ...INITIAL_STATE,
      showResetConfirmation: false,

      moveLeft: () => set((state) => moveTetrominoByLegacy(state, -1, 0)),
      moveRight: () => set((state) => moveTetrominoByLegacy(state, 1, 0)),
      moveDown: () => set((state) => moveTetrominoByLegacy(state, 0, 1)),
      rotate: () => set((state) => rotateTetrominoCWLegacy(state)),
      drop: () => set((state) => hardDropTetromino(state)),
      holdPiece: () => set((state) => holdCurrentPieceLegacy(state)),

      togglePause: () =>
        set((state) => {
          if (!state.isGameOver) {
            state.isPaused = !state.isPaused;
          }
        }),
      resetGame: () => set(resetGameState),
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
      confirmReset: () => set(resetGameState),
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

      // Animation control actions
      startLineClearAnimation: (data: LineClearAnimationData) =>
        set((state) => {
          state.animationState = "line-clearing";
          // Create a new object to work with immer's draft type
          state.lineClearData = {
            clearedLineIndices: [...data.clearedLineIndices],
            animationStartTime: data.animationStartTime,
            expectedDuration: data.expectedDuration,
            lineCount: data.lineCount,
          };
        }),

      completeLineClearAnimation: () =>
        set((state) => {
          state.animationState = "line-falling";
          state.lineClearData = null;
        }),

      startLineFallAnimation: () =>
        set((state) => {
          state.animationState = "line-falling";
        }),

      completeLineFallAnimation: () =>
        set((state) => {
          state.animationState = "idle";
        }),

      resetToPlayingState: () =>
        set((state) => {
          // Error recovery - reset to idle state
          state.animationState = "idle";
          state.lineClearData = null;
          state.animationController = null;
        }),

      // Derived state selectors
      isGameLoopPaused: () => {
        const state = get();
        return state.animationState !== "idle" || state.isPaused || state.isGameOver;
      },

      isAnimationActive: () => {
        const state = get();
        return state.animationState !== "idle";
      },
    })),
    { name: "game-store" },
  ),
);
