import { useEffect, useRef, useTransition } from "react";
import { getGameSpeed } from "../game/game";
import { useGameStore } from "../store/gameStore";

export function useGameLoop() {
  const { moveDown, isPaused, isGameOver, level, clearAnimationStates } = useGameStore();
  const lastUpdateTime = useRef(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isPaused || isGameOver) return;

    const gameSpeed = getGameSpeed(level);

    const gameLoop = (currentTime: number) => {
      if (currentTime - lastUpdateTime.current >= gameSpeed) {
        // Use transition for non-urgent game state updates
        startTransition(() => {
          moveDown();
          // Clear any lingering animation states periodically
          clearAnimationStates();
        });
        lastUpdateTime.current = currentTime;
      }

      requestAnimationFrame(gameLoop);
    };

    const animationId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationId);
  }, [moveDown, isPaused, isGameOver, level, clearAnimationStates]);
}
