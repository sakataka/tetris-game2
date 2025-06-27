import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCellAnimation } from "../../hooks/ui/useCellAnimation";
import type { AnimationTrigger, CellValue } from "../../types/game";
import { getCellColor } from "../../utils/colors";
import { GAME_CONSTANTS } from "../../utils/gameConstants";
import { BOARD_STYLES } from "../../utils/styles";

interface BoardCellProps {
  cellValue: CellValue;
  x: number;
  y: number;
  isCurrentPiece: boolean;
  isGhostPiece: boolean;
  isPlacedPiece: boolean;
  isClearingLine: boolean;
  animationTrigger: AnimationTrigger;
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
  animationTrigger,
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
      key={`cell-${y * GAME_CONSTANTS.BOARD.WIDTH + x}-${animationTrigger}-${cellValue}`}
      initial={initialAnimation}
      animate={animateProps}
      transition={transitionProps}
      onAnimationComplete={onAnimationComplete}
      className={cellClasses}
      data-testid="board-cell"
    />
  );
}
