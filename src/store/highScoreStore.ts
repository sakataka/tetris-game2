import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { HighScore } from "@/types/storage";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

interface HighScoreStore {
  currentHighScore: HighScore | null;
  highScoresList: HighScore[];
  addNewHighScore: (score: number, lines: number, level: number) => void;
}

export const useHighScoreStore = create<HighScoreStore>()(
  devtools(
    persist(
      immer((set, get) => ({
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

            set((state) => {
              // Update current high score
              state.currentHighScore = newHighScore;

              // Add to high scores list and keep top scores
              state.highScoresList.push(newHighScore);
              state.highScoresList.sort((a, b) => b.score - a.score);
              state.highScoresList = state.highScoresList.slice(
                0,
                GAME_CONSTANTS.UI.HIGH_SCORE_LIST_MAX,
              );
            });
          }
        },
      })),
      {
        name: "tetris-high-scores",
      },
    ),
    { name: "high-score-store" },
  ),
);
