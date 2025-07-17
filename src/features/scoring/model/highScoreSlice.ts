import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type HighScoreEntry, type ScoreStatistics, scoreStorage } from "../api/scoreStorage";

interface HighScoreState {
  // High scores
  currentHighScore: HighScoreEntry | null;
  highScoresList: HighScoreEntry[];
  scoreStatistics: ScoreStatistics | null;
  isNewHighScore: boolean;
  gameStartTime: number;
  gameMode: "normal" | "ai" | "challenge";

  // Actions
  addNewHighScore: (playerName?: string) => Promise<void>;
  loadHighScores: () => Promise<void>;
  clearHighScores: () => Promise<void>;
  deleteHighScore: (id: string) => Promise<void>;
  isHighScore: (score: number) => Promise<boolean>;
  getScoreRank: (score: number) => Promise<number>;
  setGameMode: (mode: "normal" | "ai" | "challenge") => void;
  setGameStartTime: (time: number) => void;
  exportHighScores: () => Promise<string>;
  importHighScores: (jsonData: string) => Promise<void>;
  setIsNewHighScore: (isNew: boolean) => void;
}

export const useHighScoreStore = create<HighScoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentHighScore: null,
      highScoresList: [],
      scoreStatistics: null,
      isNewHighScore: false,
      gameStartTime: 0,
      gameMode: "normal",

      // Actions
      addNewHighScore: async (playerName?: string) => {
        // Get current score data from gamePlay store
        // This will be injected by the calling component

        try {
          // For now, this is a placeholder implementation
          // The actual score data will be passed from the calling component
          console.log("[HighScoreStore] addNewHighScore called with playerName:", playerName);

          // Update the state to reflect new high score
          set(() => ({ isNewHighScore: true }));

          // Reload the full list
          await get().loadHighScores();
        } catch (error) {
          console.error("Failed to save high score:", error);
        }
      },

      loadHighScores: async () => {
        try {
          const [highScores, statistics] = await Promise.all([
            scoreStorage.getHighScores(),
            scoreStorage.getStatistics(),
          ]);

          set(() => ({
            highScoresList: highScores,
            currentHighScore: highScores[0] || null,
            scoreStatistics: statistics,
          }));
        } catch (error) {
          console.error("Failed to load high scores:", error);
        }
      },

      clearHighScores: async () => {
        try {
          await scoreStorage.clearHighScores();
          set(() => ({
            highScoresList: [],
            currentHighScore: null,
            isNewHighScore: false,
          }));
        } catch (error) {
          console.error("Failed to clear high scores:", error);
        }
      },

      deleteHighScore: async (id: string) => {
        try {
          await scoreStorage.deleteHighScore(id);
          await get().loadHighScores();
        } catch (error) {
          console.error("Failed to delete high score:", error);
        }
      },

      isHighScore: async (score: number) => {
        try {
          return await scoreStorage.isHighScore(score);
        } catch (error) {
          console.error("Failed to check if high score:", error);
          return false;
        }
      },

      getScoreRank: async (score: number) => {
        try {
          return await scoreStorage.getScoreRank(score);
        } catch (error) {
          console.error("Failed to get score rank:", error);
          return -1;
        }
      },

      setGameMode: (mode) => set(() => ({ gameMode: mode })),
      setGameStartTime: (time) => set(() => ({ gameStartTime: time })),
      setIsNewHighScore: (isNew) => set(() => ({ isNewHighScore: isNew })),

      exportHighScores: async () => {
        try {
          return await scoreStorage.exportHighScores();
        } catch (error) {
          console.error("Failed to export high scores:", error);
          throw error;
        }
      },

      importHighScores: async (jsonData: string) => {
        try {
          await scoreStorage.importHighScores(jsonData);
          await get().loadHighScores();
        } catch (error) {
          console.error("Failed to import high scores:", error);
          throw error;
        }
      },
    }),
    { name: "high-score-store" },
  ),
);
