import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  GameAnimationState,
  GameBoard,
  LineClearAnimationData,
  Tetromino,
  TetrominoTypeName,
} from "@/types/game";

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
      startGame: () =>
        set(() => ({
          isPlaying: true,
          isPaused: false,
          isGameOver: false,
          lastFall: Date.now(),
          animationState: "idle",
          lineClearData: null,
        })),

      pauseGame: () =>
        set((state) => ({
          isPaused: !state.isPaused,
        })),

      resetGame: () =>
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
        })),

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

      // Movement actions (placeholders - will integrate with game engine)
      moveLeft: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        console.log("[GamePlay] Move left requested");
        // TODO: Integrate with game engine
      },

      moveRight: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        console.log("[GamePlay] Move right requested");
        // TODO: Integrate with game engine
      },

      rotateClockwise: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        console.log("[GamePlay] Rotate clockwise requested");
        // TODO: Integrate with game engine
      },

      rotateCounterClockwise: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        console.log("[GamePlay] Rotate counter-clockwise requested");
        // TODO: Integrate with game engine
      },

      softDrop: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        console.log("[GamePlay] Soft drop requested");
        // TODO: Integrate with game engine
      },

      hardDrop: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        console.log("[GamePlay] Hard drop requested");
        // TODO: Integrate with game engine
      },

      holdPiece: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused || !state.canHold) return;

        console.log("[GamePlay] Hold piece requested");
        // TODO: Integrate with game engine
      },

      // Timing control
      updateFallSpeed: (speed) => set(() => ({ fallSpeed: speed })),
      updateLastFall: (timestamp) => set(() => ({ lastFall: timestamp })),
      setLockDelay: (active) => set(() => ({ lockDelayActive: active })),
    }),
    { name: "game-play-store" },
  ),
);
