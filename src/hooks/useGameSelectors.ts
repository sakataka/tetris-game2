import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";

/**
 * Game state selectors - optimized with useMemo to prevent infinite loops
 */

export const useScoreState = () => {
  const score = useGameStore((state) => state.score);
  const lines = useGameStore((state) => state.lines);
  const level = useGameStore((state) => state.level);

  return useMemo(() => ({ score, lines, level }), [score, lines, level]);
};

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

export const useBoardData = () => {
  const board = useGameStore((state) => state.board);
  const currentPiece = useGameStore((state) => state.currentPiece);
  const placedPositions = useGameStore((state) => state.placedPositions);
  const clearingLines = useGameStore((state) => state.clearingLines);
  const animationTriggerKey = useGameStore((state) => state.animationTriggerKey);

  return useMemo(
    () => ({
      board,
      currentPiece,
      placedPositions,
      clearingLines,
      animationTriggerKey,
    }),
    [board, currentPiece, placedPositions, clearingLines, animationTriggerKey],
  );
};
