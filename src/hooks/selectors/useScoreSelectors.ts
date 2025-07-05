import { useShallow } from "zustand/shallow";
import { useGameStore } from "@/store/gameStore";

/**
 * Score-related state selectors
 */
export const useScoreState = () =>
  useGameStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
    })),
  );
