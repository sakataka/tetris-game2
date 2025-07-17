import type { ScoreData } from "../ui/ScoreDisplay";

export interface HighScoreEntry {
  id: string;
  score: number;
  lines: number;
  level: number;
  timestamp: number;
  playerName?: string;
  duration?: number; // Game duration in ms
  mode?: "normal" | "ai" | "challenge";
}

export interface ScoreStatistics {
  totalGames: number;
  averageScore: number;
  bestScore: HighScoreEntry;
  totalPlayTime: number;
  totalLinesCleared: number;
  averageLevel: number;
  gamesPerDay: { [date: string]: number };
}

export interface ScoreStorageAdapter {
  saveHighScore(
    scoreData: ScoreData,
    playerName?: string,
    duration?: number,
    mode?: "normal" | "ai" | "challenge",
  ): Promise<HighScoreEntry>;
  getHighScores(): Promise<HighScoreEntry[]>;
  getHighScoresByMode(mode: "normal" | "ai" | "challenge"): Promise<HighScoreEntry[]>;
  isHighScore(score: number): Promise<boolean>;
  getScoreRank(score: number): Promise<number>;
  deleteHighScore(id: string): Promise<void>;
  clearHighScores(): Promise<void>;
  getStatistics(): Promise<ScoreStatistics | null>;
  clearStatistics(): Promise<void>;
  exportHighScores(): Promise<string>;
  importHighScores(jsonData: string): Promise<void>;
}

/**
 * Local storage adapter for score persistence
 */
export function createScoreStorageAdapter(): ScoreStorageAdapter {
  const HIGH_SCORES_KEY = "tetris-high-scores";
  const STATISTICS_KEY = "tetris-statistics";
  const MAX_HIGH_SCORES = 10;

  /**
   * Save data to localStorage with error handling
   */
  const saveToStorage = async <T>(key: string, data: T): Promise<void> => {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Storage quota exceeded
        console.warn("[ScoreStorage] Storage quota exceeded, clearing old data");
        await clearOldData();
        localStorage.setItem(key, JSON.stringify(data));
      } else {
        throw error;
      }
    }
  };

  /**
   * Get data from localStorage with error handling
   */
  const getFromStorage = async <T>(key: string): Promise<T | null> => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`[ScoreStorage] Failed to parse data for key ${key}:`, error);
      return null;
    }
  };

  /**
   * Remove data from localStorage
   */
  const removeFromStorage = async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  };

  /**
   * Clear old data when storage is full
   */
  const clearOldData = async (): Promise<void> => {
    try {
      const highScores = await getHighScores();
      const recentScores = highScores.slice(0, Math.floor(MAX_HIGH_SCORES / 2));
      await saveToStorage(HIGH_SCORES_KEY, recentScores);
    } catch (error) {
      console.error("[ScoreStorage] Failed to clear old data:", error);
    }
  };

  /**
   * Update score statistics
   */
  const updateStatistics = async (newEntry: HighScoreEntry): Promise<void> => {
    try {
      const currentStats = await getStatistics();
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      const updatedStats: ScoreStatistics = {
        totalGames: (currentStats?.totalGames || 0) + 1,
        averageScore: currentStats
          ? (currentStats.averageScore * currentStats.totalGames + newEntry.score) /
            (currentStats.totalGames + 1)
          : newEntry.score,
        bestScore:
          !currentStats?.bestScore || newEntry.score > currentStats.bestScore.score
            ? newEntry
            : currentStats.bestScore,
        totalPlayTime: (currentStats?.totalPlayTime || 0) + (newEntry.duration || 0),
        totalLinesCleared: (currentStats?.totalLinesCleared || 0) + newEntry.lines,
        averageLevel: currentStats
          ? (currentStats.averageLevel * currentStats.totalGames + newEntry.level) /
            (currentStats.totalGames + 1)
          : newEntry.level,
        gamesPerDay: {
          ...currentStats?.gamesPerDay,
          [today]: (currentStats?.gamesPerDay?.[today] || 0) + 1,
        },
      };

      await saveToStorage(STATISTICS_KEY, updatedStats);
    } catch (error) {
      console.error("[ScoreStorage] Failed to update statistics:", error);
    }
  };

  const getHighScores = async (): Promise<HighScoreEntry[]> => {
    try {
      const scores = await getFromStorage<HighScoreEntry[]>(HIGH_SCORES_KEY);
      return scores || [];
    } catch (error) {
      console.error("[ScoreStorage] Failed to get high scores:", error);
      return [];
    }
  };

  const getStatistics = async (): Promise<ScoreStatistics | null> => {
    try {
      return await getFromStorage<ScoreStatistics>(STATISTICS_KEY);
    } catch (error) {
      console.error("[ScoreStorage] Failed to get statistics:", error);
      return null;
    }
  };

  return {
    /**
     * Save a new high score
     */
    async saveHighScore(
      scoreData: ScoreData,
      playerName?: string,
      duration?: number,
      mode: "normal" | "ai" | "challenge" = "normal",
    ): Promise<HighScoreEntry> {
      try {
        const entry: HighScoreEntry = {
          id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          score: scoreData.score,
          lines: scoreData.lines,
          level: scoreData.level,
          timestamp: Date.now(),
          playerName,
          duration,
          mode,
        };

        const highScores = await getHighScores();
        const updatedScores = [...highScores, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_HIGH_SCORES);

        await saveToStorage(HIGH_SCORES_KEY, updatedScores);
        await updateStatistics(entry);

        console.log("[ScoreStorage] High score saved:", entry);
        return entry;
      } catch (error) {
        console.error("[ScoreStorage] Failed to save high score:", error);
        throw error;
      }
    },

    /**
     * Get all high scores
     */
    getHighScores,

    /**
     * Get high scores by mode
     */
    async getHighScoresByMode(mode: "normal" | "ai" | "challenge"): Promise<HighScoreEntry[]> {
      try {
        const allScores = await getHighScores();
        return allScores.filter((score) => score.mode === mode);
      } catch (error) {
        console.error("[ScoreStorage] Failed to get high scores by mode:", error);
        return [];
      }
    },

    /**
     * Check if score qualifies for high score list
     */
    async isHighScore(score: number): Promise<boolean> {
      try {
        const highScores = await getHighScores();

        if (highScores.length < MAX_HIGH_SCORES) {
          return true;
        }

        const lowestHighScore = highScores[highScores.length - 1];
        return score > lowestHighScore.score;
      } catch (error) {
        console.error("[ScoreStorage] Failed to check if high score:", error);
        return false;
      }
    },

    /**
     * Get score rank (1-based)
     */
    async getScoreRank(score: number): Promise<number> {
      try {
        const highScores = await getHighScores();
        const rank = highScores.filter((s) => s.score > score).length + 1;
        return rank;
      } catch (error) {
        console.error("[ScoreStorage] Failed to get score rank:", error);
        return -1;
      }
    },

    /**
     * Delete a high score
     */
    async deleteHighScore(id: string): Promise<void> {
      try {
        const highScores = await getHighScores();
        const updatedScores = highScores.filter((score) => score.id !== id);
        await saveToStorage(HIGH_SCORES_KEY, updatedScores);

        console.log("[ScoreStorage] High score deleted:", id);
      } catch (error) {
        console.error("[ScoreStorage] Failed to delete high score:", error);
        throw error;
      }
    },

    /**
     * Clear all high scores
     */
    async clearHighScores(): Promise<void> {
      try {
        await removeFromStorage(HIGH_SCORES_KEY);
        console.log("[ScoreStorage] All high scores cleared");
      } catch (error) {
        console.error("[ScoreStorage] Failed to clear high scores:", error);
        throw error;
      }
    },

    /**
     * Get score statistics
     */
    getStatistics,

    /**
     * Clear all statistics
     */
    async clearStatistics(): Promise<void> {
      try {
        await removeFromStorage(STATISTICS_KEY);
        console.log("[ScoreStorage] All statistics cleared");
      } catch (error) {
        console.error("[ScoreStorage] Failed to clear statistics:", error);
        throw error;
      }
    },

    /**
     * Export high scores as JSON
     */
    async exportHighScores(): Promise<string> {
      try {
        const highScores = await getHighScores();
        const statistics = await getStatistics();

        const exportData = {
          highScores,
          statistics,
          exportDate: new Date().toISOString(),
          version: "1.0",
        };

        return JSON.stringify(exportData, null, 2);
      } catch (error) {
        console.error("[ScoreStorage] Failed to export high scores:", error);
        throw error;
      }
    },

    /**
     * Import high scores from JSON
     */
    async importHighScores(jsonData: string): Promise<void> {
      try {
        const importData = JSON.parse(jsonData);

        if (!importData.highScores || !Array.isArray(importData.highScores)) {
          throw new Error("Invalid import data format");
        }

        // Validate each score entry
        const validScores = importData.highScores.filter(
          (score: unknown): score is HighScoreEntry => {
            if (!score || typeof score !== "object") return false;
            const s = score as Record<string, unknown>;
            return (
              typeof s.id === "string" &&
              typeof s.score === "number" &&
              typeof s.lines === "number" &&
              typeof s.level === "number" &&
              typeof s.timestamp === "number"
            );
          },
        );

        await saveToStorage(HIGH_SCORES_KEY, validScores.slice(0, MAX_HIGH_SCORES));

        if (importData.statistics) {
          await saveToStorage(STATISTICS_KEY, importData.statistics);
        }

        console.log("[ScoreStorage] High scores imported successfully");
      } catch (error) {
        console.error("[ScoreStorage] Failed to import high scores:", error);
        throw error;
      }
    },
  };
}

// Singleton instance
export const scoreStorage = createScoreStorageAdapter();
