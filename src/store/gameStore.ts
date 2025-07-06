import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  calculateGhostPosition,
  createInitialGameState,
  hardDropTetromino,
  holdCurrentPieceLegacy,
  moveTetrominoByLegacy,
  rotateTetromino180Legacy,
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
  rotate180: () => void;
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
  hideTSpinIndicator: () => void;

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

  // Base state with animation properties
  const baseStateWithAnimation = {
    ...initialState,
    debugMode: debugParams.enabled,
    debugParams: debugParams.enabled ? debugParams : null,
    animationState: "idle" as GameAnimationState,
    lineClearData: null,
    animationController: null,
  };

  if (!debugParams.enabled) {
    return baseStateWithAnimation;
  }

  // Apply debug modifications immutably
  let debugModifiedState = baseStateWithAnimation;

  // Apply preset if specified
  if (debugParams.preset) {
    const preset = getDebugPreset(debugParams.preset);
    if (preset) {
      debugModifiedState = {
        ...debugModifiedState,
        board: preset.board,
        ...(preset.score !== undefined && { score: preset.score }),
        ...(preset.level !== undefined && { level: preset.level }),
        ...(preset.lines !== undefined && { lines: preset.lines }),
      };

      // Set up piece queue if specified in preset
      if (preset.nextPieces && preset.nextPieces.length > 0) {
        createDebugBag(preset.nextPieces); // Initialize debug bag
        debugModifiedState = {
          ...debugModifiedState,
          currentPiece: createTetromino(preset.nextPieces[0]),
          nextPiece: preset.nextPieces[1] || "T",
          pieceBag: preset.nextPieces.slice(2),
        };
      }
    }
  }

  // Override with URL parameters if specified
  debugModifiedState = {
    ...debugModifiedState,
    ...(debugParams.score !== undefined && { score: debugParams.score }),
    ...(debugParams.level !== undefined && { level: debugParams.level }),
    ...(debugParams.lines !== undefined && { lines: debugParams.lines }),
  };

  // Set up custom piece queue from URL
  if (debugParams.queue && debugParams.queue.length > 0) {
    createDebugBag(debugParams.queue); // Initialize debug bag
    debugModifiedState = {
      ...debugModifiedState,
      currentPiece: createTetromino(debugParams.queue[0]),
      nextPiece: debugParams.queue[1] || "T",
      pieceBag: debugParams.queue.slice(2),
    };
  }

  // Recalculate ghost position after debug setup and return final state
  return {
    ...debugModifiedState,
    ghostPosition: calculateGhostPosition(debugModifiedState),
  };
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
      rotate180: () => set((state) => rotateTetromino180Legacy(state)),
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

      hideTSpinIndicator: () =>
        set((state) => {
          state.tSpinState.show = false;
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
