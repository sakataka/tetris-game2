import { useEffect, useRef, useTransition } from "react";
import { getGameSpeed } from "../game/game";
import { useGameStore } from "../store/gameStore";

export function useGameLoop() {
  const { moveDown, isPaused, isGameOver, level } = useGameStore();
  const lastUpdateTime = useRef(0);
  const animationIdRef = useRef<number | null>(null);
  const [, startTransition] = useTransition();

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
        // Use transition for non-urgent game state updates
        startTransition(() => {
          moveDown();
        });
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
  }, [moveDown, isPaused, isGameOver, level]);
}
