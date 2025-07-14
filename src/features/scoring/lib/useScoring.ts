import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScoringStore } from "../model/scoringSlice";
import type {
  ComboState,
  FloatingScoreEvent,
  ScoreAnimationState,
  ScoreData,
} from "../ui/ScoreDisplay";

export interface LineClearData {
  linesCleared: number;
  isTSpin: boolean;
  isPerfectClear: boolean;
  level: number;
  combo: number;
}

export interface UseScoringReturn {
  // Score data
  scoreData: ScoreData;
  animationState: ScoreAnimationState;
  comboState: ComboState;
  floatingScoreEvents: FloatingScoreEvent[];

  // Score calculations
  calculateScore: (lineClearData: LineClearData) => number;
  calculateLevel: (totalLines: number) => number;

  // Actions
  addScore: (points: number, source?: string) => void;
  addLines: (lines: number) => void;
  updateLevel: (level: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  addFloatingScore: (event: Omit<FloatingScoreEvent, "id" | "timestamp">) => void;
  removeFloatingScore: (id: string) => void;
  clearAnimations: () => void;

  // Game events
  onLineClear: (data: LineClearData) => void;
  onPiecePlaced: () => void;
  onGameReset: () => void;

  // Utility
  isAnimating: boolean;
  hasActiveCombo: boolean;
}

export const useScoring = (): UseScoringReturn => {
  // Get score state using shallow comparison
  const scoreData = useScoringStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
      previousScore: state.previousScore,
    })),
  );

  const animationState = useScoringStore(
    useShallow((state) => ({
      previousScore: state.previousScore,
      isAnimating: state.isAnimating,
      scoreIncrement: state.scoreIncrement,
    })),
  );

  const comboState = useScoringStore(
    useShallow((state) => ({
      count: state.comboCount,
      isActive: state.comboActive,
      lastUpdate: state.comboLastUpdate,
    })),
  );

  const floatingScoreEvents = useScoringStore((state) => state.floatingScoreEvents);

  // Get actions
  const actions = useScoringStore(
    useShallow((state) => ({
      setScore: state.setScore,
      setLines: state.setLines,
      setLevel: state.setLevel,
      setPreviousScore: state.setPreviousScore,
      setAnimating: state.setAnimating,
      setScoreIncrement: state.setScoreIncrement,
      setComboCount: state.setComboCount,
      setComboActive: state.setComboActive,
      setComboLastUpdate: state.setComboLastUpdate,
      addFloatingScoreEvent: state.addFloatingScoreEvent,
      removeFloatingScoreEvent: state.removeFloatingScoreEvent,
      clearFloatingScoreEvents: state.clearFloatingScoreEvents,
      reset: state.reset,
    })),
  );

  // Score calculation based on modern Tetris scoring
  const calculateScore = useCallback((lineClearData: LineClearData): number => {
    const { linesCleared, isTSpin, isPerfectClear, level, combo } = lineClearData;

    if (linesCleared === 0) return 0;

    let baseScore = 0;

    if (isTSpin) {
      // T-Spin scoring
      switch (linesCleared) {
        case 1:
          baseScore = 800;
          break; // T-Spin Single
        case 2:
          baseScore = 1200;
          break; // T-Spin Double
        case 3:
          baseScore = 1600;
          break; // T-Spin Triple
        default:
          baseScore = 0;
      }
    } else {
      // Normal line clear scoring
      switch (linesCleared) {
        case 1:
          baseScore = 100;
          break; // Single
        case 2:
          baseScore = 300;
          break; // Double
        case 3:
          baseScore = 500;
          break; // Triple
        case 4:
          baseScore = 800;
          break; // Tetris
        default:
          baseScore = 0;
      }
    }

    // Level multiplier
    let score = baseScore * (level + 1);

    // Combo bonus
    if (combo > 0) {
      score += combo * 50 * (level + 1);
    }

    // Perfect Clear bonus
    if (isPerfectClear) {
      const perfectClearBonus = linesCleared === 4 ? 2000 : 1000;
      score += perfectClearBonus * (level + 1);
    }

    return score;
  }, []);

  // Level calculation (every 10 lines)
  const calculateLevel = useCallback((totalLines: number): number => {
    return Math.floor(totalLines / 10);
  }, []);

  // Add score with animation
  const addScore = useCallback(
    (points: number, source?: string) => {
      const currentScore = scoreData.score;

      actions.setPreviousScore(currentScore);
      actions.setScore(currentScore + points);
      actions.setScoreIncrement(points);
      actions.setAnimating(true);

      // Stop animation after a delay
      setTimeout(() => {
        actions.setAnimating(false);
      }, 1000);

      console.log(`[Scoring] Added ${points} points from ${source || "unknown"}`);
    },
    [scoreData.score, actions],
  );

  // Add lines and update level
  const addLines = useCallback(
    (lines: number) => {
      const newTotalLines = scoreData.lines + lines;
      const newLevel = calculateLevel(newTotalLines);

      actions.setLines(newTotalLines);

      if (newLevel > scoreData.level) {
        actions.setLevel(newLevel);
      }
    },
    [scoreData.lines, scoreData.level, calculateLevel, actions],
  );

  // Update level manually
  const updateLevel = useCallback(
    (level: number) => {
      actions.setLevel(level);
    },
    [actions],
  );

  // Increment combo
  const incrementCombo = useCallback(() => {
    const newCombo = comboState.count + 1;
    actions.setComboCount(newCombo);
    actions.setComboActive(true);
    actions.setComboLastUpdate(Date.now());
  }, [comboState.count, actions]);

  // Reset combo
  const resetCombo = useCallback(() => {
    actions.setComboCount(0);
    actions.setComboActive(false);
  }, [actions]);

  // Add floating score event
  const addFloatingScore = useCallback(
    (event: Omit<FloatingScoreEvent, "id" | "timestamp">) => {
      const floatingEvent: FloatingScoreEvent = {
        ...event,
        id: `floating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      actions.addFloatingScoreEvent(floatingEvent);
    },
    [actions],
  );

  // Remove floating score event
  const removeFloatingScore = useCallback(
    (id: string) => {
      actions.removeFloatingScoreEvent(id);
    },
    [actions],
  );

  // Clear all animations
  const clearAnimations = useCallback(() => {
    actions.setAnimating(false);
    actions.setComboActive(false);
    actions.clearFloatingScoreEvents();
  }, [actions]);

  // Handle line clear event
  const onLineClear = useCallback(
    (data: LineClearData) => {
      const { linesCleared, isTSpin, isPerfectClear } = data;

      // Calculate and add score
      const points = calculateScore(data);
      addScore(points, "line-clear");

      // Add lines
      addLines(linesCleared);

      // Handle combo
      if (linesCleared > 0) {
        incrementCombo();
      }

      // Add floating score for visual feedback
      addFloatingScore({
        value: points,
        type: isPerfectClear
          ? "perfect-clear"
          : isTSpin
            ? "t-spin"
            : data.combo > 0
              ? "combo"
              : "line-clear",
        position: { x: 0, y: 0 }, // Will be positioned by the UI component
      });

      console.log(
        `[Scoring] Line clear: ${linesCleared} lines, ${points} points, T-Spin: ${isTSpin}, Perfect: ${isPerfectClear}`,
      );
    },
    [calculateScore, addScore, addLines, incrementCombo, addFloatingScore],
  );

  // Handle piece placed event
  const onPiecePlaced = useCallback(() => {
    // Reset combo if no lines were cleared
    setTimeout(() => {
      if (comboState.lastUpdate < Date.now() - 100) {
        resetCombo();
      }
    }, 50);
  }, [comboState.lastUpdate, resetCombo]);

  // Handle game reset
  const onGameReset = useCallback(() => {
    actions.reset();
  }, [actions]);

  return {
    scoreData,
    animationState,
    comboState,
    floatingScoreEvents,
    calculateScore,
    calculateLevel,
    addScore,
    addLines,
    updateLevel,
    incrementCombo,
    resetCombo,
    addFloatingScore,
    removeFloatingScore,
    clearAnimations,
    onLineClear,
    onPiecePlaced,
    onGameReset,
    isAnimating: animationState.isAnimating,
    hasActiveCombo: comboState.isActive,
  };
};

/**
 * Hook for score data only (read-only)
 */
export const useScoringData = () => {
  return useScoringStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
      previousScore: state.previousScore,
    })),
  );
};

/**
 * Hook for score animation state only (read-only)
 */
export const useScoringAnimationState = () => {
  return useScoringStore(
    useShallow((state) => ({
      isAnimating: state.isAnimating,
      scoreIncrement: state.scoreIncrement,
      comboCount: state.comboCount,
      comboActive: state.comboActive,
      floatingScoreEvents: state.floatingScoreEvents,
    })),
  );
};
