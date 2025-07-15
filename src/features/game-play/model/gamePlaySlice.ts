import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  GameAnimationState,
  GameBoard,
  LineClearAnimationData,
  Tetromino,
  TetrominoTypeName,
} from "@/types/game";
import { gameEngineAdapter } from "../api/gameEngineAdapter";

interface GamePlayState {
  // Core game state
  board: GameBoard;
  currentPiece: Tetromino | null;
  ghostPiece: Tetromino | null;
  nextPieces: TetrominoTypeName[];
  heldPiece: TetrominoTypeName | null;
  canHold: boolean;

  // Game status
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;

  // Timing
  lastFall: number;
  fallSpeed: number;
  lockDelay: number;
  lockDelayActive: boolean;

  // Animation state
  animationState: GameAnimationState;
  lineClearData: LineClearAnimationData | null;

  // State update actions
  updateBoard: (board: GameBoard) => void;
  updateCurrentPiece: (piece: Tetromino | null) => void;
  updateGhostPiece: (piece: Tetromino | null) => void;
  updateNextPieces: (pieces: TetrominoTypeName[]) => void;
  updateHeldPiece: (piece: TetrominoTypeName | null) => void;
  setCanHold: (canHold: boolean) => void;

  // Game control actions
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  endGame: () => void;

  // Animation control
  startLineClearAnimation: (data: LineClearAnimationData) => void;
  completeLineClearAnimation: () => void;
  startLineFallAnimation: () => void;
  completeLineFallAnimation: () => void;
  clearAnimationData: () => void;

  // Movement actions (these will integrate with the game engine)
  moveLeft: () => void;
  moveRight: () => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  holdPiece: () => void;

  // Timing control
  updateFallSpeed: (speed: number) => void;
  updateLastFall: (timestamp: number) => void;
  setLockDelay: (active: boolean) => void;
}

export const useGamePlayStore = create<GamePlayState>()(
  devtools(
    (set, get) => ({
      // Initial state
      board: Array(20)
        .fill(null)
        .map(() => Array(10).fill(0)) as GameBoard,
      currentPiece: null,
      ghostPiece: null,
      nextPieces: [],
      heldPiece: null,
      canHold: true,
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      lastFall: 0,
      fallSpeed: 1000, // ms
      lockDelay: 500, // ms
      lockDelayActive: false,
      animationState: "idle",
      lineClearData: null,

      // State update actions
      updateBoard: (board) => set(() => ({ board })),
      updateCurrentPiece: (piece) => set(() => ({ currentPiece: piece })),
      updateGhostPiece: (piece) => set(() => ({ ghostPiece: piece })),
      updateNextPieces: (pieces) => set(() => ({ nextPieces: pieces })),
      updateHeldPiece: (piece) => set(() => ({ heldPiece: piece })),
      setCanHold: (canHold) => set(() => ({ canHold })),

      // Game control actions
      startGame: () => {
        // Start the game engine
        gameEngineAdapter.startGame();

        // Get initial state from engine
        const engineState = gameEngineAdapter.getGameState();
        if (engineState) {
          set(() => ({
            board: engineState.board,
            currentPiece: engineState.currentPiece,
            ghostPiece:
              engineState.ghostPosition && engineState.currentPiece
                ? {
                    ...engineState.currentPiece,
                    position: engineState.ghostPosition,
                  }
                : null,
            nextPieces: [engineState.nextPiece],
            heldPiece: engineState.heldPiece,
            canHold: engineState.canHold,
            isPlaying: true,
            isPaused: false,
            isGameOver: false,
            lastFall: Date.now(),
            fallSpeed: 1000, // Will be updated based on level
            animationState: "idle",
            lineClearData: null,
          }));
        } else {
          // Fallback if engine fails
          set(() => ({
            isPlaying: true,
            isPaused: false,
            isGameOver: false,
            lastFall: Date.now(),
            animationState: "idle",
            lineClearData: null,
          }));
        }
      },

      pauseGame: () =>
        set((state) => ({
          isPaused: !state.isPaused,
        })),

      resetGame: () => {
        // Reset the game engine
        gameEngineAdapter.resetGame();

        set(() => ({
          board: Array(20)
            .fill(null)
            .map(() => Array(10).fill(0)) as GameBoard,
          currentPiece: null,
          ghostPiece: null,
          nextPieces: [],
          heldPiece: null,
          canHold: true,
          isPlaying: false,
          isPaused: false,
          isGameOver: false,
          lastFall: 0,
          lockDelayActive: false,
          animationState: "idle",
          lineClearData: null,
        }));
      },

      endGame: () =>
        set(() => ({
          isPlaying: false,
          isGameOver: true,
          animationState: "idle",
          lineClearData: null,
        })),

      // Animation control
      startLineClearAnimation: (data) =>
        set(() => ({
          animationState: "line-clearing",
          lineClearData: data,
        })),

      completeLineClearAnimation: () =>
        set(() => ({
          animationState: "line-falling",
        })),

      startLineFallAnimation: () =>
        set(() => ({
          animationState: "line-falling",
        })),

      completeLineFallAnimation: () =>
        set(() => ({
          animationState: "idle",
          lineClearData: null,
        })),

      clearAnimationData: () =>
        set(() => ({
          animationState: "idle",
          lineClearData: null,
        })),

      // Movement actions
      moveLeft: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.moveLeft()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      moveRight: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.moveRight()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      rotateClockwise: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.rotateClockwise()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      rotateCounterClockwise: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.rotateCounterClockwise()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      softDrop: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.softDrop()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      hardDrop: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.hardDrop()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
              nextPieces: [engineState.nextPiece],
              heldPiece: engineState.heldPiece,
              canHold: true, // Reset hold ability after placing
            }));

            // TODO: Handle line clears, scoring, etc.
          }
        }
      },

      holdPiece: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused || !state.canHold) return;

        if (gameEngineAdapter.holdPiece()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
              heldPiece: engineState.heldPiece,
              canHold: engineState.canHold,
              nextPieces: [engineState.nextPiece],
            }));
          }
        }
      },

      // Timing control
      updateFallSpeed: (speed) => set(() => ({ fallSpeed: speed })),
      updateLastFall: (timestamp) => set(() => ({ lastFall: timestamp })),
      setLockDelay: (active) => set(() => ({ lockDelayActive: active })),
    }),
    { name: "game-play-store" },
  ),
);
