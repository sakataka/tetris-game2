import { motion } from "motion/react";
import { useMemo } from "react";
import { forEachPieceCell } from "@/game/board";
import { getTetrominoColorIndex } from "@/game/tetrominos";
import { useCellAnimation } from "@/hooks/ui/useCellAnimation";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { createCellKey, isValidBoardPosition } from "@/utils/boardUtils";
import { getCellColor } from "@/utils/colors";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { BOARD_STYLES } from "@/utils/styles";

interface BoardCellProps {
  row: number;
  col: number;
  cellSize?: number;
}

/**
 * Individual cell component for the Tetris board with animation support
 * Uses fine-grained selectors to minimize re-renders
 */
export function BoardCell({ row, col, cellSize = GAME_CONSTANTS.BOARD.CELL_SIZE }: BoardCellProps) {
  // Fine-grained selectors - only re-render when specific data changes
  const baseCellValue = useGameStore((state) => state.board[row]?.[col] ?? 0);
  const currentPiece = useGameStore((state) => state.currentPiece);
  const boardBeforeClear = useGameStore((state) => state.boardBeforeClear);
  const clearingLines = useGameStore((state) => state.clearingLines);
  const ghostPosition = useGameStore((state) => state.ghostPosition);
  const placedPositions = useGameStore((state) => state.placedPositions);
  const animationTriggerKey = useGameStore((state) => state.animationTriggerKey);
  const showGhostPiece = useSettingsStore((state) => state.showGhostPiece);

  // Compute cell display state
  const cellState = useMemo(() => {
    const positionKey = createCellKey({ x: col, y: row });

    // Use boardBeforeClear during line clearing animation
    const effectiveCellValue =
      boardBeforeClear && clearingLines.length > 0
        ? (boardBeforeClear[row]?.[col] ?? 0)
        : baseCellValue;

    // Check if current piece is at this position
    let isCurrentPiece = false;
    let cellValue = effectiveCellValue;

    if (currentPiece) {
      const colorIndex = getTetrominoColorIndex(currentPiece.type);
      forEachPieceCell(currentPiece.shape, currentPiece.position, (boardX, boardY) => {
        if (boardX === col && boardY === row && isValidBoardPosition({ x: boardX, y: boardY })) {
          isCurrentPiece = true;
          cellValue = colorIndex;
        }
      });
    }

    // Check if ghost piece is at this position
    let isGhostPiece = false;
    if (showGhostPiece && currentPiece && ghostPosition && !isCurrentPiece) {
      forEachPieceCell(currentPiece.shape, ghostPosition, (boardX, boardY) => {
        if (boardX === col && boardY === row && isValidBoardPosition({ x: boardX, y: boardY })) {
          isGhostPiece = true;
        }
      });
    }

    // Check if this position was recently placed
    const isPlacedPiece = placedPositions.some((pos) => createCellKey(pos) === positionKey);

    // Check if this line is clearing
    const isClearingLine = clearingLines.includes(row);

    return {
      cellValue,
      isCurrentPiece,
      isGhostPiece,
      isPlacedPiece,
      isClearingLine,
      animationTrigger: animationTriggerKey,
    };
  }, [
    row,
    col,
    baseCellValue,
    currentPiece,
    boardBeforeClear,
    clearingLines,
    ghostPosition,
    placedPositions,
    animationTriggerKey,
    showGhostPiece,
  ]);

  const { initialAnimation, animateProps, transitionProps } = useCellAnimation({
    isCurrentPiece: cellState.isCurrentPiece,
    isPlacedPiece: cellState.isPlacedPiece,
    isClearingLine: cellState.isClearingLine,
    cellValue: cellState.cellValue,
  });

  // Animation completion handler
  const handleAnimationComplete = () => {
    // Only trigger completion for clearing lines and placed pieces
    if (cellState.isClearingLine || cellState.isPlacedPiece) {
      // Use the gameStore's clearAnimationData method
      useGameStore.getState().clearAnimationData();
    }
  };

  // Only use motion.div when animation is actually needed
  const needsAnimation =
    !cellState.isGhostPiece &&
    (cellState.isCurrentPiece || cellState.isPlacedPiece || cellState.isClearingLine);

  const cellClasses = cn(
    BOARD_STYLES.cell,
    !cellState.isGhostPiece && getCellColor(cellState.cellValue),
    cellState.isGhostPiece && BOARD_STYLES.ghostPiece,
    cellState.cellValue !== 0 && !cellState.isGhostPiece && BOARD_STYLES.cellBorder,
    cellState.cellValue === 0 && !cellState.isGhostPiece && BOARD_STYLES.emptyCellBorder,
    cellState.isCurrentPiece && BOARD_STYLES.activePiece,
    cellState.isClearingLine && BOARD_STYLES.clearingLine,
  );

  const cellStyle = {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
  };

  // Use regular div for static cells to improve performance
  if (!needsAnimation) {
    return <div className={cellClasses} style={cellStyle} data-testid="board-cell" />;
  }

  // Use motion.div only when animation is needed
  return (
    <motion.div
      key={`cell-${row * GAME_CONSTANTS.BOARD.WIDTH + col}-${cellState.animationTrigger}-${cellState.cellValue}`}
      initial={initialAnimation}
      animate={animateProps}
      transition={transitionProps}
      onAnimationComplete={handleAnimationComplete}
      className={cellClasses}
      style={cellStyle}
      data-testid="board-cell"
    />
  );
}
