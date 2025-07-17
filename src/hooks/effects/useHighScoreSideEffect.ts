import { useEffect, useRef } from "react";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { useHighScore } from "@/features/scoring/lib/useHighScore";

/**
 * Custom hook that handles high score saving as a side effect
 * Monitors game over state changes and saves high score when game ends
 */
export function useHighScoreSideEffect() {
  const isGameOver = useGamePlayStore((state) => state.isGameOver);
  const { addNewHighScore } = useHighScore();
  const wasGameOverRef = useRef(isGameOver);

  useEffect(() => {
    // Save high score when game transitions from playing to game over
    if (!wasGameOverRef.current && isGameOver) {
      // Score data is already in gamePlayStore, so we can directly save it
      addNewHighScore();
    }
    wasGameOverRef.current = isGameOver;
  }, [isGameOver, addNewHighScore]);
}
