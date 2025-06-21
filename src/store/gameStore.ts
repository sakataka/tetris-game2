import { create } from "zustand";
import {
  createInitialGameState,
  hardDropTetromino,
  moveTetrominoBy,
  rotateTetrominoCW,
} from "../game/game";
import type { GameState } from "../types/game";

interface GameStore extends GameState {
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  togglePause: () => void;
  resetGame: () => void;
  clearAnimationStates: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...createInitialGameState(),

  moveLeft: () => set((state) => moveTetrominoBy(state, -1, 0)),
  moveRight: () => set((state) => moveTetrominoBy(state, 1, 0)),
  moveDown: () => set((state) => moveTetrominoBy(state, 0, 1)),
  rotate: () => set((state) => rotateTetrominoCW(state)),
  drop: () => set((state) => hardDropTetromino(state)),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  resetGame: () => set(createInitialGameState()),
  clearAnimationStates: () =>
    set((state) => ({
      ...state,
      placedPositions: [],
      clearingLines: [],
    })),
}));
