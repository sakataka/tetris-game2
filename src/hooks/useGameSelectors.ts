import { useMemo } from "react";
import { getTetrominoColorIndex } from "../game/tetrominos";
import { useGameStore } from "../store/gameStore";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../utils/constants";

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

  // Unified current piece processing - compute both display board and positions
  const { displayBoard, currentPiecePositions } = useMemo(() => {
    const newBoard = board.map((row) => [...row]);
    const positions = new Set<string>();

    if (currentPiece) {
      const colorIndex = getTetrominoColorIndex(currentPiece.type);
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              newBoard[boardY][boardX] = colorIndex;
              positions.add(`${boardX},${boardY}`);
            }
          }
        });
      });
    }

    return { displayBoard: newBoard, currentPiecePositions: positions };
  }, [board, currentPiece]);

  // Pre-compute placed positions for O(1) lookup
  const placedPositionsSet = useMemo(() => {
    const positions = new Set<string>();
    placedPositions.forEach((pos) => {
      positions.add(`${pos.x},${pos.y}`);
    });
    return positions;
  }, [placedPositions]);

  return useMemo(
    () => ({
      board,
      currentPiece,
      placedPositions,
      clearingLines,
      animationTriggerKey,
      displayBoard,
      currentPiecePositions,
      placedPositionsSet,
    }),
    [
      board,
      currentPiece,
      placedPositions,
      clearingLines,
      animationTriggerKey,
      displayBoard,
      currentPiecePositions,
      placedPositionsSet,
    ],
  );
};
