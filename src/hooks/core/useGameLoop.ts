import { useEffect, useRef } from "react";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { getGameSpeed } from "@/game/game";
import { useGameStore } from "@/store/gameStore";

/**
 * Game loop implementation using requestAnimationFrame
 *
 * We use requestAnimationFrame instead of setInterval to:
 * - Sync with browser's repaint cycle for smoother animations
 * - Automatically pause when tab is not visible (browser optimization)
 * - Better performance on high refresh rate displays
 * - Prevent timer drift that can occur with setInterval
 */
export function useGameLoop() {
  // Use new game-play store for game state
  const softDrop = useGamePlayStore((state) => state.softDrop);
  const isPaused = useGamePlayStore((state) => state.isPaused);
  const isGameOver = useGamePlayStore((state) => state.isGameOver);
  const isPlaying = useGamePlayStore((state) => state.isPlaying);

  // Keep using old store for reset confirmation and level (until migration is complete)
  const showResetConfirmation = useGameStore((state) => state.showResetConfirmation);
  const level = useGameStore((state) => state.level);
  const lastUpdateTime = useRef(0);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || showResetConfirmation) return;

    const gameSpeed = getGameSpeed(level);

    const gameLoop = (currentTime: number) => {
      // Check game state before processing - safety check for state changes during execution
      const currentGamePlayState = useGamePlayStore.getState();
      const currentGameState = useGameStore.getState();
      if (
        !currentGamePlayState.isPlaying ||
        currentGamePlayState.isPaused ||
        currentGamePlayState.isGameOver ||
        currentGameState.showResetConfirmation
      ) {
        return; // Stop the loop immediately if game state changed
      }

      if (currentTime - lastUpdateTime.current >= gameSpeed) {
        // Use softDrop from new store instead of moveDown
        softDrop();
        lastUpdateTime.current = currentTime;
      }

      // Only continue the loop if the game is still active
      if (
        currentGamePlayState.isPlaying &&
        !currentGamePlayState.isPaused &&
        !currentGamePlayState.isGameOver &&
        !currentGameState.showResetConfirmation
      ) {
        animationIdRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animationIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [softDrop, isPlaying, isPaused, isGameOver, showResetConfirmation, level]);
}
