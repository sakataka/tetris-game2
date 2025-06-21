import { create } from "zustand";
import { createInitialGameState, dropPiece, movePiece, rotatePiece } from "../game/game";
import type { GameState } from "../types/game";

interface GameStore extends GameState {
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  togglePause: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...createInitialGameState(),

  moveLeft: () => set((state) => movePiece(state, -1, 0)),
  moveRight: () => set((state) => movePiece(state, 1, 0)),
  moveDown: () => set((state) => movePiece(state, 0, 1)),
  rotate: () => set((state) => rotatePiece(state)),
  drop: () => set((state) => dropPiece(state)),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  resetGame: () => set(createInitialGameState()),
}));
