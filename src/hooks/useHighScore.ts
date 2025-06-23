import { useCallback, useEffect, useState } from "react";
import type { HighScore } from "../utils/localStorage";
import { getCurrentHighScore, getHighScoresList } from "../utils/localStorage";

/**
 * Custom hook for managing high score data with real-time updates
 * This hook will automatically refresh when high scores change
 */
export function useHighScore() {
  const [currentHighScore, setCurrentHighScore] = useState<HighScore | null>(null);
  const [highScoresList, setHighScoresList] = useState<HighScore[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh high score data
  const refreshHighScores = useCallback(() => {
    setCurrentHighScore(getCurrentHighScore());
    setHighScoresList(getHighScoresList());
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Load initial data
  useEffect(() => {
    refreshHighScores();
  }, [refreshHighScores]);

  // Listen for storage events (when localStorage changes in other tabs)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith("tetris-")) {
        refreshHighScores();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshHighScores]);

  // Listen for custom events (when localStorage changes in the same tab)
  useEffect(() => {
    const handleHighScoreUpdate = () => {
      refreshHighScores();
    };

    window.addEventListener("tetris-high-score-update", handleHighScoreUpdate);
    return () => window.removeEventListener("tetris-high-score-update", handleHighScoreUpdate);
  }, [refreshHighScores]);

  return {
    currentHighScore,
    highScoresList,
    refreshHighScores,
    refreshKey,
  };
}
