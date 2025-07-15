import { useShallow } from "zustand/shallow";
import { useScoringStore } from "@/features/scoring";

/**
 * Custom hook for managing high score data with real-time updates
 * This hook uses Zustand store with persist middleware
 */
export function useHighScore() {
  return useScoringStore(
    useShallow((state) => ({
      currentHighScore: state.currentHighScore,
      highScoresList: state.highScoresList,
    })),
  );
}
