import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import type { ComboState, FloatingScoreEvent } from "@/types/game";
import type { ScoreData } from "../ui/ScoreDisplay";

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
  animationState: {
    previousScore: number;
    isAnimating: boolean;
    scoreIncrement: number;
  };
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
  addFloatingScore: (event: {
    value: number;
    type: string;
    position: { x: number; y: number };
  }) => void;
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
  // Get score state using shallow comparison from gamePlayStore
  const scoreData = useGamePlayStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
      previousScore: state.scoreAnimationState.previousScore,
    })),
  );

  const animationState = useGamePlayStore(
    useShallow((state) => ({
      previousScore: state.scoreAnimationState.previousScore,
      isAnimating: state.scoreAnimationState.scoreIncrease > 0,
      scoreIncrement: state.scoreAnimationState.scoreIncrease,
    })),
  );

  const comboState = useGamePlayStore(
    useShallow((state) => ({
      count: state.comboState.count,
      isActive: state.comboState.isActive,
      lastClearType: state.comboState.lastClearType,
    })),
  );

  const floatingScoreEvents = useGamePlayStore((state) => state.floatingScoreEvents);

  // Get actions
  const actions = useGamePlayStore(
    useShallow((state) => ({
      updateScore: state.updateScore,
      updateLines: state.updateLines,
      updateLevel: state.updateLevel,
      updateScoreAnimationState: state.updateScoreAnimationState,
      updateComboState: state.updateComboState,
      incrementCombo: state.incrementCombo,
      resetCombo: state.resetCombo,
      addFloatingScoreEvent: state.addFloatingScoreEvent,
      removeFloatingScoreEvent: state.removeFloatingScoreEvent,
      clearFloatingScoreEvents: state.clearFloatingScoreEvents,
      resetGame: state.resetGame,
      // Statistics actions
      incrementTotalLines: state.incrementTotalLines,
      incrementTSpins: state.incrementTSpins,
      incrementPerfectClears: state.incrementPerfectClears,
      incrementTetrises: state.incrementTetrises,
      incrementSingles: state.incrementSingles,
      incrementDoubles: state.incrementDoubles,
      incrementTriples: state.incrementTriples,
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
      const newScore = currentScore + points;

      // Update score animation state
      actions.updateScoreAnimationState({
        previousScore: currentScore,
        scoreIncrease: points,
        lineCount: 0,
        clearType: null,
        isTetris: false,
        animationTriggerTime: Date.now(),
      });

      // Update actual score
      actions.updateScore(newScore);

      console.log(`[Scoring] Added ${points} points from ${source || "unknown"}`);
    },
    [scoreData.score, actions],
  );

  // Add lines and update level
  const addLines = useCallback(
    (lines: number) => {
      const newTotalLines = scoreData.lines + lines;
      const newLevel = calculateLevel(newTotalLines);

      actions.updateLines(newTotalLines);

      if (newLevel > scoreData.level) {
        actions.updateLevel(newLevel);
      }
    },
    [scoreData.lines, scoreData.level, calculateLevel, actions],
  );

  // Update level manually
  const updateLevel = useCallback(
    (level: number) => {
      actions.updateLevel(level);
    },
    [actions],
  );

  // Increment combo
  const incrementCombo = useCallback(() => {
    actions.incrementCombo("single");
  }, [actions]);

  // Reset combo
  const resetCombo = useCallback(() => {
    actions.resetCombo();
  }, [actions]);

  // Add floating score event
  const addFloatingScore = useCallback(
    (event: { value: number; type: string; position: { x: number; y: number } }) => {
      const floatingEvent: FloatingScoreEvent = {
        id: `floating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        points: event.value,
        position: event.position,
        startTime: Date.now(),
        isActive: true,
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
    actions.updateScoreAnimationState({
      previousScore: 0,
      scoreIncrease: 0,
      lineCount: 0,
      clearType: null,
      isTetris: false,
      animationTriggerTime: 0,
    });
    actions.resetCombo();
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

      // Update statistics
      actions.incrementTotalLines(linesCleared);

      if (isTSpin) {
        actions.incrementTSpins();
      }

      if (isPerfectClear) {
        actions.incrementPerfectClears();
      }

      // Update specific line clear statistics
      switch (linesCleared) {
        case 1:
          actions.incrementSingles();
          break;
        case 2:
          actions.incrementDoubles();
          break;
        case 3:
          actions.incrementTriples();
          break;
        case 4:
          actions.incrementTetrises();
          break;
      }

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
    [calculateScore, addScore, addLines, incrementCombo, addFloatingScore, actions],
  );

  // Handle piece placed event
  const onPiecePlaced = useCallback(() => {
    // Reset combo if no lines were cleared
    // Note: This is a simplified implementation
    // In a full implementation, this should be coordinated with the game engine
    setTimeout(() => {
      resetCombo();
    }, 50);
  }, [resetCombo]);

  // Handle game reset
  const onGameReset = useCallback(() => {
    actions.resetGame();
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
  return useGamePlayStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
      previousScore: state.scoreAnimationState.previousScore,
    })),
  );
};

/**
 * Hook for score animation state only (read-only)
 */
export const useScoringAnimationState = () => {
  return useGamePlayStore(
    useShallow((state) => ({
      isAnimating: state.scoreAnimationState.scoreIncrease > 0,
      scoreIncrement: state.scoreAnimationState.scoreIncrease,
      comboCount: state.comboState.count,
      comboActive: state.comboState.isActive,
      floatingScoreEvents: state.floatingScoreEvents,
    })),
  );
};
