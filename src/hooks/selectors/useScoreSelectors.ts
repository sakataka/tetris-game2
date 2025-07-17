import { useShallow } from "zustand/shallow";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";

/**
 * Score-related state selectors using the game play store
 * FIX: Use gamePlayStore as the single source of truth for score/lines/level
 */
export const useScoreState = () =>
  useGamePlayStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
    })),
  );

/**
 * Enhanced score state selectors for animation system
 * Uses gameplay store for both score data and animation state
 */
export const useScoreAnimationState = () => {
  // Get both score data and animation state from gameplay store
  const data = useGamePlayStore(
    useShallow((state) => ({
      score: state.score,
      scoreAnimationState: state.scoreAnimationState,
      comboState: state.comboState,
      floatingScoreEvents: state.floatingScoreEvents,
    })),
  );

  return data;
};

/**
 * Statistics state selectors from gameplay store
 */
export const useStatisticsState = () =>
  useGamePlayStore(
    useShallow((state) => ({
      totalLinesCleared: state.totalLinesCleared,
      totalTSpins: state.totalTSpins,
      totalPerfectClears: state.totalPerfectClears,
      totalTetrises: state.totalTetrises,
      totalSingles: state.totalSingles,
      totalDoubles: state.totalDoubles,
      totalTriples: state.totalTriples,
      maxCombo: state.maxCombo,
    })),
  );
