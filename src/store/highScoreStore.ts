import { create } from "zustand";
import type { HighScore } from "../utils/localStorage";
import { getCurrentHighScore, getHighScoresList } from "../utils/localStorage";

interface HighScoreStore {
  currentHighScore: HighScore | null;
  highScoresList: HighScore[];
  refreshKey: number;
  refreshHighScores: () => void;
  updateHighScore: () => void;
}

export const useHighScoreStore = create<HighScoreStore>((set, get) => ({
  currentHighScore: null,
  highScoresList: [],
  refreshKey: 0,

  refreshHighScores: () => {
    set({
      currentHighScore: getCurrentHighScore(),
      highScoresList: getHighScoresList(),
      refreshKey: get().refreshKey + 1,
    });
  },

  updateHighScore: () => {
    // This will be called when a new high score is set
    get().refreshHighScores();
  },
}));
