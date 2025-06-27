import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCellAnimation } from "../../hooks/useCellAnimation";
import { getCellColor } from "../../utils/colors";
import { BOARD_WIDTH } from "../../utils/gameConstants";
import { BOARD_STYLES } from "../../utils/styles";

interface BoardCellProps {
  cellValue: number;
  x: number;
  y: number;
  isCurrentPiece: boolean;
  isGhostPiece: boolean;
  isPlacedPiece: boolean;
  isClearingLine: boolean;
  animationTriggerKey: string | number;
  onAnimationComplete: () => void;
}

/**
 * Individual cell component for the Tetris board with animation support
 */
export function BoardCell({
  cellValue,
  x,
  y,
  isCurrentPiece,
  isGhostPiece,
  isPlacedPiece,
  isClearingLine,
  animationTriggerKey,
  onAnimationComplete,
}: BoardCellProps) {
  const { initialAnimation, animateProps, transitionProps } = useCellAnimation({
    isCurrentPiece,
    isPlacedPiece,
    isClearingLine,
    cellValue,
  });

  // Only use motion.div when animation is actually needed
  const needsAnimation = !isGhostPiece && (isCurrentPiece || isPlacedPiece || isClearingLine);

  const cellClasses = cn(
    BOARD_STYLES.cell,
    !isGhostPiece && getCellColor(cellValue),
    isGhostPiece && BOARD_STYLES.ghostPiece,
    cellValue !== 0 && !isGhostPiece && BOARD_STYLES.cellBorder,
    cellValue === 0 && !isGhostPiece && BOARD_STYLES.emptyCellBorder,
    isCurrentPiece && BOARD_STYLES.activePiece,
    isClearingLine && BOARD_STYLES.clearingLine,
  );

  // Use regular div for static cells to improve performance
  if (!needsAnimation) {
    return <div className={cellClasses} data-testid="board-cell" />;
  }

  // Use motion.div only when animation is needed
  return (
    <motion.div
      key={`cell-${y * BOARD_WIDTH + x}-${animationTriggerKey}-${cellValue}`}
      initial={initialAnimation}
      animate={animateProps}
      transition={transitionProps}
      onAnimationComplete={onAnimationComplete}
      className={cellClasses}
      data-testid="board-cell"
    />
  );
}
