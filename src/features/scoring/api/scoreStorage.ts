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

/**
 * Local storage adapter for score persistence
 */
export class ScoreStorageAdapter {
  private readonly HIGH_SCORES_KEY = "tetris-high-scores";
  private readonly STATISTICS_KEY = "tetris-statistics";
  private readonly MAX_HIGH_SCORES = 10;

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

      const highScores = await this.getHighScores();
      const updatedScores = [...highScores, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, this.MAX_HIGH_SCORES);

      await this.saveToStorage(this.HIGH_SCORES_KEY, updatedScores);
      await this.updateStatistics(entry);

      console.log("[ScoreStorage] High score saved:", entry);
      return entry;
    } catch (error) {
      console.error("[ScoreStorage] Failed to save high score:", error);
      throw error;
    }
  }

  /**
   * Get all high scores
   */
  async getHighScores(): Promise<HighScoreEntry[]> {
    try {
      const scores = await this.getFromStorage<HighScoreEntry[]>(this.HIGH_SCORES_KEY);
      return scores || [];
    } catch (error) {
      console.error("[ScoreStorage] Failed to get high scores:", error);
      return [];
    }
  }

  /**
   * Get high scores by mode
   */
  async getHighScoresByMode(mode: "normal" | "ai" | "challenge"): Promise<HighScoreEntry[]> {
    try {
      const allScores = await this.getHighScores();
      return allScores.filter((score) => score.mode === mode);
    } catch (error) {
      console.error("[ScoreStorage] Failed to get high scores by mode:", error);
      return [];
    }
  }

  /**
   * Check if score qualifies for high score list
   */
  async isHighScore(score: number): Promise<boolean> {
    try {
      const highScores = await this.getHighScores();

      if (highScores.length < this.MAX_HIGH_SCORES) {
        return true;
      }

      const lowestHighScore = highScores[highScores.length - 1];
      return score > lowestHighScore.score;
    } catch (error) {
      console.error("[ScoreStorage] Failed to check if high score:", error);
      return false;
    }
  }

  /**
   * Get score rank (1-based)
   */
  async getScoreRank(score: number): Promise<number> {
    try {
      const highScores = await this.getHighScores();
      const rank = highScores.filter((s) => s.score > score).length + 1;
      return rank;
    } catch (error) {
      console.error("[ScoreStorage] Failed to get score rank:", error);
      return -1;
    }
  }

  /**
   * Delete a high score
   */
  async deleteHighScore(id: string): Promise<void> {
    try {
      const highScores = await this.getHighScores();
      const updatedScores = highScores.filter((score) => score.id !== id);
      await this.saveToStorage(this.HIGH_SCORES_KEY, updatedScores);

      console.log("[ScoreStorage] High score deleted:", id);
    } catch (error) {
      console.error("[ScoreStorage] Failed to delete high score:", error);
      throw error;
    }
  }

  /**
   * Clear all high scores
   */
  async clearHighScores(): Promise<void> {
    try {
      await this.removeFromStorage(this.HIGH_SCORES_KEY);
      console.log("[ScoreStorage] All high scores cleared");
    } catch (error) {
      console.error("[ScoreStorage] Failed to clear high scores:", error);
      throw error;
    }
  }

  /**
   * Get score statistics
   */
  async getStatistics(): Promise<ScoreStatistics | null> {
    try {
      return await this.getFromStorage<ScoreStatistics>(this.STATISTICS_KEY);
    } catch (error) {
      console.error("[ScoreStorage] Failed to get statistics:", error);
      return null;
    }
  }

  /**
   * Update score statistics
   */
  private async updateStatistics(newEntry: HighScoreEntry): Promise<void> {
    try {
      const currentStats = await this.getStatistics();
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

      await this.saveToStorage(this.STATISTICS_KEY, updatedStats);
    } catch (error) {
      console.error("[ScoreStorage] Failed to update statistics:", error);
    }
  }

  /**
   * Clear all statistics
   */
  async clearStatistics(): Promise<void> {
    try {
      await this.removeFromStorage(this.STATISTICS_KEY);
      console.log("[ScoreStorage] All statistics cleared");
    } catch (error) {
      console.error("[ScoreStorage] Failed to clear statistics:", error);
      throw error;
    }
  }

  /**
   * Export high scores as JSON
   */
  async exportHighScores(): Promise<string> {
    try {
      const highScores = await this.getHighScores();
      const statistics = await this.getStatistics();

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
  }

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
        (score: any) =>
          score.id &&
          typeof score.score === "number" &&
          typeof score.lines === "number" &&
          typeof score.level === "number" &&
          typeof score.timestamp === "number",
      );

      await this.saveToStorage(this.HIGH_SCORES_KEY, validScores.slice(0, this.MAX_HIGH_SCORES));

      if (importData.statistics) {
        await this.saveToStorage(this.STATISTICS_KEY, importData.statistics);
      }

      console.log("[ScoreStorage] High scores imported successfully");
    } catch (error) {
      console.error("[ScoreStorage] Failed to import high scores:", error);
      throw error;
    }
  }

  /**
   * Save data to localStorage with error handling
   */
  private async saveToStorage<T>(key: string, data: T): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Storage quota exceeded
        console.warn("[ScoreStorage] Storage quota exceeded, clearing old data");
        await this.clearOldData();
        localStorage.setItem(key, JSON.stringify(data));
      } else {
        throw error;
      }
    }
  }

  /**
   * Get data from localStorage with error handling
   */
  private async getFromStorage<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`[ScoreStorage] Failed to parse data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  private async removeFromStorage(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  /**
   * Clear old data when storage is full
   */
  private async clearOldData(): Promise<void> {
    try {
      const highScores = await this.getHighScores();
      const recentScores = highScores.slice(0, Math.floor(this.MAX_HIGH_SCORES / 2));
      await this.saveToStorage(this.HIGH_SCORES_KEY, recentScores);
    } catch (error) {
      console.error("[ScoreStorage] Failed to clear old data:", error);
    }
  }
}

// Singleton instance
export const scoreStorage = new ScoreStorageAdapter();
