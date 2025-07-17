import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { getGameSpeed } from "@/game/game";

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
  // Optimize selectors with useShallow for better performance
  const { isPaused, isGameOver, isPlaying, showResetConfirmation, level } = useGamePlayStore(
    useShallow((state) => ({
      isPaused: state.isPaused,
      isGameOver: state.isGameOver,
      isPlaying: state.isPlaying,
      showResetConfirmation: state.showResetConfirmation,
      level: state.level,
    })),
  );

  const softDrop = useGamePlayStore((state) => state.softDrop);
  const lastUpdateTime = useRef(0);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || showResetConfirmation) return;

    const gameSpeed = getGameSpeed(level);

    const gameLoop = (currentTime: number) => {
      // Check game state before processing - safety check for state changes during execution
      const currentGamePlayState = useGamePlayStore.getState();
      if (
        !currentGamePlayState.isPlaying ||
        currentGamePlayState.isPaused ||
        currentGamePlayState.isGameOver ||
        currentGamePlayState.showResetConfirmation
      ) {
        return; // Stop the loop immediately if game state changed
      }

      if (currentTime - lastUpdateTime.current >= gameSpeed) {
        // Use softDrop from new store
        softDrop();
        lastUpdateTime.current = currentTime;
      }

      // Only continue the loop if the game is still active
      if (
        currentGamePlayState.isPlaying &&
        !currentGamePlayState.isPaused &&
        !currentGamePlayState.isGameOver &&
        !currentGamePlayState.showResetConfirmation
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
