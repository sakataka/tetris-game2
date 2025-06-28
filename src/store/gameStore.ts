import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  createInitialGameState,
  hardDropTetromino,
  holdCurrentPiece,
  moveTetrominoBy,
  rotateTetrominoCW,
} from "@/game/game";
import type { GameState } from "@/types/game";

interface GameStore extends GameState {
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  holdPiece: () => void;
  togglePause: () => void;
  resetGame: () => void;
  clearAnimationData: () => void;
}

// Create initial state once outside the store to avoid recreation on each access
const INITIAL_STATE = createInitialGameState();

export const useGameStore = create<GameStore>()(
  devtools(
    (set) => ({
      ...INITIAL_STATE,

      moveLeft: () => set((state) => moveTetrominoBy(state, -1, 0)),
      moveRight: () => set((state) => moveTetrominoBy(state, 1, 0)),
      moveDown: () => set((state) => moveTetrominoBy(state, 0, 1)),
      rotate: () => set((state) => rotateTetrominoCW(state)),
      drop: () => set((state) => hardDropTetromino(state)),
      holdPiece: () => set((state) => holdCurrentPiece(state)),

      togglePause: () =>
        set((state) => {
          if (state.isGameOver) return state; // Cannot pause when game is over
          return { isPaused: !state.isPaused };
        }),
      resetGame: () =>
        set(() => ({
          ...createInitialGameState(),
        })),
      clearAnimationData: () =>
        set((state) => {
          // Prevent unnecessary updates if animation states are already empty
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
    }),
    { name: "game-store" },
  ),
);
