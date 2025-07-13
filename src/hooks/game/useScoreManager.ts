import { useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { useGameStore } from "@/store/gameStore";
import { useHighScoreStore } from "@/store/highScoreStore";

export interface ScoreManager {
  currentScore: number;
  currentLines: number;
  currentLevel: number;
  highScore: number;
  addScore: (points: number) => void;
  addLines: (lines: number) => void;
  resetScore: () => void;
  isNewHighScore: boolean;
}

/**
 * Score management hook that integrates game scoring with high score tracking
 *
 * Features:
 * - Level-based score multipliers
 * - Automatic level progression based on lines cleared
 * - High score detection and updates
 * - Score reset functionality
 * - Optimized selectors to prevent unnecessary re-renders
 */
export const useScoreManager = (): ScoreManager => {
  const { score, lines, level, isGameOver } = useGameStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
      isGameOver: state.isGameOver,
    })),
  );

  // Get high score data
  const { currentHighScore, addNewHighScore } = useHighScoreStore(
    useShallow((state) => ({
      currentHighScore: state.currentHighScore,
      addNewHighScore: state.addNewHighScore,
    })),
  );

  // Get reset function from game store
  const resetGame = useGameStore((state) => state.resetGame);

  // Add points with level-based multiplier
  const addScore = useCallback(
    (points: number) => {
      if (isGameOver) return;

      const multiplier = Math.max(1, level);
      const finalScore = points * multiplier;
      const newScore = score + finalScore;

      // Directly update store state (Immer handles immutability)
      useGameStore.setState((state) => {
        state.score = newScore;
      });

      // Check for high score and update if necessary
      const currentHigh = currentHighScore?.score || 0;
      if (newScore > currentHigh) {
        addNewHighScore(newScore, lines, level);
      }
    },
    [score, level, lines, isGameOver, currentHighScore, addNewHighScore],
  );

  // Add cleared lines and handle level progression
  const addLines = useCallback(
    (clearedLines: number) => {
      if (isGameOver) return;

      const newLines = lines + clearedLines;

      // Directly update store state (Immer handles immutability)
      useGameStore.setState((state) => {
        state.lines = newLines;

        // Level progression: every 10 lines
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel !== state.level) {
          state.level = newLevel;
        }
      });
    },
    [lines, isGameOver],
  );

  // Reset all score-related state
  const resetScore = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Calculate if current score is a new high score
  const currentHigh = currentHighScore?.score || 0;
  const isNewHighScore = score > currentHigh;

  return {
    currentScore: score,
    currentLines: lines,
    currentLevel: level,
    highScore: currentHigh,
    addScore,
    addLines,
    resetScore,
    isNewHighScore,
  };
};
