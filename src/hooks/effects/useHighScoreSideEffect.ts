import { useEffect, useRef } from "react";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { useScoringStore } from "@/features/scoring";

/**
 * Custom hook that handles high score saving as a side effect
 * Monitors game over state changes and saves high score when game ends
 */
export function useHighScoreSideEffect() {
  const isGameOver = useGamePlayStore((state) => state.isGameOver);
  const { score, lines, level } = useScoringStore((state) => ({
    score: state.score,
    lines: state.lines,
    level: state.level,
  }));
  const { addNewHighScore, setScore, setLines, setLevel } = useScoringStore();
  const wasGameOverRef = useRef(isGameOver);

  useEffect(() => {
    // Save high score when game transitions from playing to game over
    if (!wasGameOverRef.current && isGameOver) {
      // Update scoring store with current game data before saving
      setScore(score);
      setLines(lines);
      setLevel(level);
      addNewHighScore();
    }
    wasGameOverRef.current = isGameOver;
  }, [isGameOver, score, lines, level, addNewHighScore, setScore, setLines, setLevel]);
}
