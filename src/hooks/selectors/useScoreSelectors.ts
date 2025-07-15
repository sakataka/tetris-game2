import { useShallow } from "zustand/shallow";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { useScoringStore } from "@/features/scoring/model/scoringSlice";

/**
 * Score-related state selectors using the new scoring store
 */
export const useScoreState = () =>
  useScoringStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
    })),
  );

/**
 * Enhanced score state selectors for animation system
 * Uses both scoring store for score data and gameplay store for animation state
 */
export const useScoreAnimationState = () => {
  // Get score data from scoring store
  const scoreData = useScoringStore(
    useShallow((state) => ({
      score: state.score,
    })),
  );

  // Get animation state from gameplay store
  const animationData = useGamePlayStore(
    useShallow((state) => ({
      scoreAnimationState: state.scoreAnimationState,
      comboState: state.comboState,
      floatingScoreEvents: state.floatingScoreEvents,
    })),
  );

  return {
    ...scoreData,
    ...animationData,
  };
};
