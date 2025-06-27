import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GAME_CONSTANTS } from "../utils/gameConstants";
import type { HighScore } from "../utils/localStorage";

interface HighScoreStore {
  currentHighScore: HighScore | null;
  highScoresList: HighScore[];
  addNewHighScore: (score: number, lines: number, level: number) => void;
}

export const useHighScoreStore = create<HighScoreStore>()(
  persist(
    (set, get) => ({
      currentHighScore: null,
      highScoresList: [],

      addNewHighScore: (score: number, lines: number, level: number) => {
        const currentHighScore = get().currentHighScore;

        // Check if this is a new high score
        if (!currentHighScore || score > currentHighScore.score) {
          const newHighScore: HighScore = {
            score,
            lines,
            level,
            date: new Date().toISOString(),
          };

          // Update current high score
          set({ currentHighScore: newHighScore });

          // Add to high scores list and keep top scores
          const updatedList = [...get().highScoresList, newHighScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, GAME_CONSTANTS.UI.HIGH_SCORE_LIST_MAX);

          set({ highScoresList: updatedList });
        }
      },
    }),
    {
      name: "tetris-high-scores",
    },
  ),
);
