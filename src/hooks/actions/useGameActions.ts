import { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";

/**
 * Core game actions interface
 * Base actions available from the game store
 */
export interface GameActions {
  readonly moveLeft: () => void;
  readonly moveRight: () => void;
  readonly moveDown: () => void;
  readonly rotate: () => void;
  readonly drop: () => void;
  readonly holdPiece: () => void;
  readonly togglePause: () => void;
  readonly resetGame: () => void;
  readonly clearAnimationData: () => void;
}

/**
 * Core game action hooks
 * Provides direct access to all game store actions with memoization
 */
export const useGameActions = (): GameActions => {
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const moveDown = useGameStore((state) => state.moveDown);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);
  const holdPiece = useGameStore((state) => state.holdPiece);
  const togglePause = useGameStore((state) => state.togglePause);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearAnimationData = useGameStore((state) => state.clearAnimationData);

  return useMemo(
    () => ({
      moveLeft,
      moveRight,
      moveDown,
      rotate,
      drop,
      holdPiece,
      togglePause,
      resetGame,
      clearAnimationData,
    }),
    [
      moveLeft,
      moveRight,
      moveDown,
      rotate,
      drop,
      holdPiece,
      togglePause,
      resetGame,
      clearAnimationData,
    ],
  );
};
