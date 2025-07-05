import { useShallow } from "zustand/shallow";
import { useHighScoreStore } from "@/store/highScoreStore";

/**
 * Custom hook for managing high score data with real-time updates
 * This hook uses Zustand store with persist middleware
 */
export function useHighScore() {
  return useHighScoreStore(
    useShallow((state) => ({
      currentHighScore: state.currentHighScore,
      highScoresList: state.highScoresList,
    })),
  );
}
