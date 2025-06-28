import { useMemo } from "react";
import { forEachPieceCell } from "../../game/board";
import { getTetrominoColorIndex } from "../../game/tetrominos";
import { useGameStore } from "../../store/gameStore";
import { useSettingsStore } from "../../store/settingsStore";
import { createCellKey, isValidBoardPosition } from "../../utils/boardUtils";

/**
 * Board-related state selectors
 */
export const useBoardData = () => {
  const board = useGameStore((state) => state.board);
  const boardBeforeClear = useGameStore((state) => state.boardBeforeClear);
  const currentPiece = useGameStore((state) => state.currentPiece);
  const ghostPosition = useGameStore((state) => state.ghostPosition);
  const placedPositions = useGameStore((state) => state.placedPositions);
  const clearingLines = useGameStore((state) => state.clearingLines);
  const animationTriggerKey = useGameStore((state) => state.animationTriggerKey);
  const showGhostPiece = useSettingsStore((state) => state.showGhostPiece);

  // Unified current piece processing - compute both display board and positions
  const { displayBoard, currentPiecePositions } = useMemo(() => {
    // Use boardBeforeClear during line clearing animation, otherwise use current board
    const activeBoard = boardBeforeClear && clearingLines.length > 0 ? boardBeforeClear : board;

    // Safety check for board existence
    if (!activeBoard || !Array.isArray(activeBoard)) {
      return { displayBoard: [], currentPiecePositions: new Set<string>() };
    }

    const newBoard = activeBoard.map((row) => [...row]);
    const positions = new Set<string>();

    if (currentPiece) {
      const colorIndex = getTetrominoColorIndex(currentPiece.type);
      forEachPieceCell(currentPiece.shape, currentPiece.position, (boardX, boardY) => {
        const position = { x: boardX, y: boardY };
        if (isValidBoardPosition(position)) {
          newBoard[boardY][boardX] = colorIndex;
          positions.add(createCellKey(position));
        }
      });
    }

    return { displayBoard: newBoard, currentPiecePositions: positions };
  }, [board, boardBeforeClear, currentPiece, clearingLines]);

  // Pre-compute placed positions for O(1) lookup
  const placedPositionsSet = useMemo(() => {
    const positions = new Set<string>();
    placedPositions.forEach((pos) => {
      positions.add(createCellKey(pos));
    });
    return positions;
  }, [placedPositions]);

  // Pre-compute ghost piece positions for O(1) lookup
  const ghostPiecePositions = useMemo(() => {
    const positions = new Set<string>();

    // Check if ghost piece display is enabled
    if (!showGhostPiece || !currentPiece || !ghostPosition) {
      return positions;
    }

    forEachPieceCell(currentPiece.shape, ghostPosition, (boardX, boardY) => {
      const position = { x: boardX, y: boardY };
      if (isValidBoardPosition(position)) {
        positions.add(createCellKey(position));
      }
    });

    return positions;
  }, [currentPiece, ghostPosition, showGhostPiece]);

  return useMemo(
    () => ({
      board,
      currentPiece,
      ghostPosition,
      placedPositions,
      clearingLines,
      animationTriggerKey,
      displayBoard,
      currentPiecePositions,
      ghostPiecePositions,
      placedPositionsSet,
    }),
    [
      board,
      currentPiece,
      ghostPosition,
      placedPositions,
      clearingLines,
      animationTriggerKey,
      displayBoard,
      currentPiecePositions,
      ghostPiecePositions,
      placedPositionsSet,
    ],
  );
};
