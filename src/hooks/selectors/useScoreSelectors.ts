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

/**
 * Enhanced score state selectors for animation system
 */
export const useScoreAnimationState = () =>
  useGameStore(
    useShallow((state) => ({
      score: state.score,
      scoreAnimationState: state.scoreAnimationState,
      comboState: state.comboState,
      floatingScoreEvents: state.floatingScoreEvents,
    })),
  );
