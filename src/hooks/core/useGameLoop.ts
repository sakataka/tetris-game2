import { useEffect, useRef } from "react";
import { getGameSpeed } from "../../game/game";
import { useGameStore } from "../../store/gameStore";
import { useGameActionHandler } from "./useGameActionHandler";

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
  const moveDown = useGameStore((state) => state.moveDown);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const level = useGameStore((state) => state.level);
  const lastUpdateTime = useRef(0);
  const animationIdRef = useRef<number | null>(null);
  const executeAction = useGameActionHandler();

  useEffect(() => {
    if (isPaused || isGameOver) return;

    const gameSpeed = getGameSpeed(level);

    const gameLoop = (currentTime: number) => {
      // Check game state before processing - safety check for state changes during execution
      const currentState = useGameStore.getState();
      if (currentState.isPaused || currentState.isGameOver) {
        return; // Stop the loop immediately if game state changed
      }

      if (currentTime - lastUpdateTime.current >= gameSpeed) {
        // Use executeAction which handles game state checks and transitions
        executeAction(moveDown);
        lastUpdateTime.current = currentTime;
      }

      // Only continue the loop if the game is still active
      if (!currentState.isPaused && !currentState.isGameOver) {
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
  }, [moveDown, isPaused, isGameOver, level, executeAction]);
}
