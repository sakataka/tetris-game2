import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/gameStore";
import { useHighScoreStore } from "../../store/highScoreStore";

/**
 * Custom hook that handles high score saving as a side effect
 * Monitors game over state changes and saves high score when game ends
 */
export function useHighScoreSideEffect() {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const score = useGameStore((state) => state.score);
  const lines = useGameStore((state) => state.lines);
  const level = useGameStore((state) => state.level);
  const addNewHighScore = useHighScoreStore((state) => state.addNewHighScore);
  const wasGameOverRef = useRef(isGameOver);

  useEffect(() => {
    // Save high score when game transitions from playing to game over
    if (!wasGameOverRef.current && isGameOver) {
      addNewHighScore(score, lines, level);
    }
    wasGameOverRef.current = isGameOver;
  }, [isGameOver, score, lines, level, addNewHighScore]);
}
