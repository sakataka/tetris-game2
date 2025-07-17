import { useShallow } from "zustand/shallow";
import { useHighScoreStore } from "@/features/scoring/model/highScoreSlice";

/**
 * Custom hook for managing high score data with real-time updates
 * This hook uses the dedicated high score store
 */
export function useHighScore() {
  return useHighScoreStore(
    useShallow((state) => ({
      currentHighScore: state.currentHighScore,
      highScoresList: state.highScoresList,
    })),
  );
}
