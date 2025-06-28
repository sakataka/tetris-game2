import { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";

/**
 * Score-related state selectors
 */
export const useScoreState = () => {
  const score = useGameStore((state) => state.score);
  const lines = useGameStore((state) => state.lines);
  const level = useGameStore((state) => state.level);

  return useMemo(() => ({ score, lines, level }), [score, lines, level]);
};
