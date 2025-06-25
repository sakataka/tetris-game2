import { useHighScoreStore } from "../store/highScoreStore";

/**
 * Custom hook for managing high score data with real-time updates
 * This hook uses Zustand store with persist middleware
 */
export function useHighScore() {
  const currentHighScore = useHighScoreStore((state) => state.currentHighScore);
  const highScoresList = useHighScoreStore((state) => state.highScoresList);

  return {
    currentHighScore,
    highScoresList,
  };
}
