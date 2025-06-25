import { create } from "zustand";
import {
  createInitialGameState,
  hardDropTetromino,
  moveTetrominoBy,
  rotateTetrominoCW,
} from "../game/game";
import type { GameState } from "../types/game";
import { getSettings } from "../utils/localStorage";

interface GameStore extends GameState {
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  togglePause: () => void;
  resetGame: () => void;
  clearAnimationStates: () => void;
  toggleGhostPiece: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...createInitialGameState(),
  showGhostPiece: getSettings().showGhostPiece,

  moveLeft: () => set((state) => moveTetrominoBy(state, -1, 0)),
  moveRight: () => set((state) => moveTetrominoBy(state, 1, 0)),
  moveDown: () => set((state) => moveTetrominoBy(state, 0, 1)),
  rotate: () => set((state) => rotateTetrominoCW(state)),
  drop: () => set((state) => hardDropTetromino(state)),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  resetGame: () =>
    set(() => ({
      ...createInitialGameState(),
      showGhostPiece: getSettings().showGhostPiece,
    })),
  clearAnimationStates: () =>
    set((state) => {
      // Prevent unnecessary updates if animation states are already empty
      if (state.placedPositions.length === 0 && state.clearingLines.length === 0) {
        return state;
      }
      return {
        ...state,
        placedPositions: [],
        clearingLines: [],
      };
    }),
  toggleGhostPiece: () => set((state) => ({ showGhostPiece: !state.showGhostPiece })),
}));
