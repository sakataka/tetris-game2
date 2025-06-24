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
}

// Helper function to save high score when game transitions to game over
const saveHighScoreOnGameOver = (oldState: GameState, newState: GameState): void => {
  if (!oldState.isGameOver && newState.isGameOver) {
    setHighScore(newState.score, newState.lines, newState.level);
  }
};

export const useGameStore = create<GameStore>((set) => ({
  ...createInitialGameState(),

  moveLeft: () => set((state) => moveTetrominoBy(state, -1, 0)),
  moveRight: () => set((state) => moveTetrominoBy(state, 1, 0)),
  moveDown: () => {
    set((state) => {
      const newState = moveTetrominoBy(state, 0, 1);
      saveHighScoreOnGameOver(state, newState);
      return newState;
    });
  },
  rotate: () => set((state) => rotateTetrominoCW(state)),
  drop: () => {
    set((state) => {
      const newState = hardDropTetromino(state);
      saveHighScoreOnGameOver(state, newState);
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
}));
