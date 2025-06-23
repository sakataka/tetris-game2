import { create } from "zustand";
import {
  createInitialGameState,
  hardDropTetromino,
  moveTetrominoBy,
  rotateTetrominoCW,
} from "../game/game";
import type { GameState } from "../types/game";
import { setHighScore } from "../utils/localStorage";

interface GameStore extends GameState {
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  togglePause: () => void;
  resetGame: () => void;
  clearAnimationStates: () => void;
  saveHighScoreIfNeeded: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialGameState(),

  moveLeft: () => set((state) => moveTetrominoBy(state, -1, 0)),
  moveRight: () => set((state) => moveTetrominoBy(state, 1, 0)),
  moveDown: () => {
    set((state) => {
      const newState = moveTetrominoBy(state, 0, 1);
      // Save high score if game just ended
      if (!state.isGameOver && newState.isGameOver) {
        setHighScore(newState.score, newState.lines, newState.level);
      }
      return newState;
    });
  },
  rotate: () => set((state) => rotateTetrominoCW(state)),
  drop: () => {
    set((state) => {
      const newState = hardDropTetromino(state);
      // Save high score if game just ended
      if (!state.isGameOver && newState.isGameOver) {
        setHighScore(newState.score, newState.lines, newState.level);
      }
      return newState;
    });
  },

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  resetGame: () => set(createInitialGameState()),
  clearAnimationStates: () =>
    set((state) => ({
      ...state,
      placedPositions: [],
      clearingLines: [],
    })),
  saveHighScoreIfNeeded: () => {
    const state = get();
    if (state.isGameOver) {
      setHighScore(state.score, state.lines, state.level);
    }
  },
}));
