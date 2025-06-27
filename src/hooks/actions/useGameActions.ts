import { useMemo } from "react";
import { useGameStore } from "../../store/gameStore";

/**
 * Game action hooks
 */
export const useGameActions = () => {
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const moveDown = useGameStore((state) => state.moveDown);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);
  const togglePause = useGameStore((state) => state.togglePause);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearAnimationStates = useGameStore((state) => state.clearAnimationStates);

  return useMemo(
    () => ({
      moveLeft,
      moveRight,
      moveDown,
      rotate,
      drop,
      togglePause,
      resetGame,
      clearAnimationStates,
    }),
    [moveLeft, moveRight, moveDown, rotate, drop, togglePause, resetGame, clearAnimationStates],
  );
};
