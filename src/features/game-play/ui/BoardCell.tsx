import { motion } from "motion/react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGamePlayState } from "@/features/game-play";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { useSettingsData } from "@/features/settings";
import { forEachPieceCell } from "@/game/board";
import { getTetrominoColorIndex } from "@/game/tetrominos";
import { useCellAnimation } from "@/hooks/ui/useCellAnimation";
import { cn } from "@/lib/utils";
import { createCellKey, isValidBoardPosition } from "@/utils/boardUtils";
import { getCellColor } from "@/utils/colors";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { BOARD_STYLES } from "@/utils/styles";

interface BoardCellProps {
  row: number;
  col: number;
  cellSize?: number;
  showGhost?: boolean;
}

/**
 * Individual cell component for the Tetris board with animation support
 * Uses fine-grained selectors to minimize re-renders
 */
export function BoardCell({ row, col, cellSize = GAME_CONSTANTS.BOARD.CELL_SIZE }: BoardCellProps) {
  // Get state from new architecture
  const { board, currentPiece, ghostPiece } = useGamePlayState();
  const baseCellValue = board[row]?.[col] ?? 0;
  const ghostPosition = ghostPiece?.position;

  // Optimize selectors with useShallow for better performance
  const {
    boardBeforeClear,
    clearingLines,
    placedPositions,
    animationTriggerKey,
    clearAnimationData,
  } = useGamePlayStore(
    useShallow((state) => ({
      boardBeforeClear: state.boardBeforeClear,
      clearingLines: state.clearingLines,
      placedPositions: state.placedPositions,
      animationTriggerKey: state.animationTriggerKey,
      clearAnimationData: state.clearAnimationData,
    })),
  );
  const { showGhostPiece } = useSettingsData();

  // Compute cell display state with optimized calculations
  const cellState = useMemo(() => {
    const positionKey = createCellKey({ x: col, y: row });

    // Use boardBeforeClear during line clearing animation
    const effectiveCellValue =
      boardBeforeClear && clearingLines.length > 0
        ? (boardBeforeClear[row]?.[col] ?? 0)
        : baseCellValue;

    // Single pass through piece cells for both current and ghost pieces
    let isCurrentPiece = false;
    let isGhostPiece = false;
    let cellValue = effectiveCellValue;

    if (currentPiece) {
      const colorIndex = getTetrominoColorIndex(currentPiece.type);

      // Check current piece position first
      forEachPieceCell(currentPiece.shape, currentPiece.position, (boardX, boardY) => {
        if (boardX === col && boardY === row && isValidBoardPosition({ x: boardX, y: boardY })) {
          isCurrentPiece = true;
          cellValue = colorIndex;
        }
      });

      // Check ghost piece position only if showGhostPiece is enabled, ghost position exists, and current piece doesn't occupy this cell
      if (showGhostPiece && ghostPosition && !isCurrentPiece) {
        // Use the same piece shape but ghost position
        forEachPieceCell(currentPiece.shape, ghostPosition, (boardX, boardY) => {
          if (boardX === col && boardY === row && isValidBoardPosition({ x: boardX, y: boardY })) {
            isGhostPiece = true;
          }
        });
      }
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
      // Use the new architecture's clearAnimationData method
      clearAnimationData();
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
    return (
      <div className={cellClasses} style={cellStyle} data-testid="board-cell" data-line={row} />
    );
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
      data-line={row}
    />
  );
}
