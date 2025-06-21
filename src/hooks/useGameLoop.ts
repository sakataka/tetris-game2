import { useEffect, useRef } from "react";
import { getGameSpeed } from "../game/game";
import { useGameStore } from "../store/gameStore";

export function useGameLoop() {
  const { moveDown, isPaused, isGameOver, level } = useGameStore();
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    if (isPaused || isGameOver) return;

    const gameSpeed = getGameSpeed(level);

    const gameLoop = (currentTime: number) => {
      if (currentTime - lastUpdateTime.current >= gameSpeed) {
        moveDown();
        lastUpdateTime.current = currentTime;
      }

      requestAnimationFrame(gameLoop);
    };

    const animationId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationId);
  }, [moveDown, isPaused, isGameOver, level]);
}
