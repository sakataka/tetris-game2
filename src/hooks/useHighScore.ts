import { useEffect } from "react";
import { useHighScoreStore } from "../store/highScoreStore";

/**
 * Custom hook for managing high score data with real-time updates
 * This hook uses Zustand store for state management instead of CustomEvent
 */
export function useHighScore() {
  const currentHighScore = useHighScoreStore((state) => state.currentHighScore);
  const highScoresList = useHighScoreStore((state) => state.highScoresList);
  const refreshKey = useHighScoreStore((state) => state.refreshKey);
  const refreshHighScores = useHighScoreStore((state) => state.refreshHighScores);

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

  return {
    currentHighScore,
    highScoresList,
    refreshHighScores,
    refreshKey,
  };
}
