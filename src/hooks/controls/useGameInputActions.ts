import { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";

/**
 * Game input actions interface
 * Provides a consistent API for game controls
 */
export interface GameInputActions {
  readonly moveLeft: () => void;
  readonly moveRight: () => void;
  readonly rotateClockwise: () => void;
  readonly rotateCounterClockwise: () => void;
  readonly softDrop: () => void;
  readonly hardDrop: () => void;
  readonly hold: () => void;
  readonly pause: () => void;
  readonly reset: () => void;
}

/**
 * Game-specific action transformation hook following koba04 React best practices
 *
 * Responsibilities:
 * - Maps store actions to a consistent interface
 * - Provides domain-specific action names
 * - Memoizes actions for performance
 *
 * @returns Game input actions object
 */
export function useGameInputActions(): GameInputActions {
  // Get actions from store
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const moveDown = useGameStore((state) => state.moveDown);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);
  const holdPiece = useGameStore((state) => state.holdPiece);
  const togglePause = useGameStore((state) => state.togglePause);
  const resetGame = useGameStore((state) => state.resetGame);

  // Memoize actions to prevent unnecessary re-renders
  return useMemo(
    () => ({
      moveLeft,
      moveRight,
      rotateClockwise: rotate,
      rotateCounterClockwise: rotate, // In current implementation, both use same rotation
      softDrop: moveDown,
      hardDrop: drop,
      hold: holdPiece,
      pause: togglePause,
      reset: resetGame,
    }),
    [moveLeft, moveRight, moveDown, rotate, drop, holdPiece, togglePause, resetGame],
  );
}
