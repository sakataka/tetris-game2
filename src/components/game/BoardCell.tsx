import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCellAnimation } from "../../hooks/useCellAnimation";
import { getCellColor } from "../../utils/colors";
import { BOARD_WIDTH } from "../../utils/constants";
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

  // For ghost pieces, we don't want animation
  const shouldDisableAnimation = isGhostPiece;

  return (
    <motion.div
      key={`cell-${y * BOARD_WIDTH + x}-${isCurrentPiece ? animationTriggerKey : "static"}-${isClearingLine ? "clearing" : "normal"}-${cellValue}-${isGhostPiece ? "ghost" : ""}`}
      initial={shouldDisableAnimation ? false : initialAnimation}
      animate={shouldDisableAnimation ? {} : animateProps}
      transition={shouldDisableAnimation ? {} : transitionProps}
      onAnimationComplete={onAnimationComplete}
      className={cn(
        BOARD_STYLES.cell,
        !isGhostPiece && getCellColor(cellValue),
        isGhostPiece && BOARD_STYLES.ghostPiece,
        cellValue !== 0 && !isGhostPiece && BOARD_STYLES.cellBorder,
        cellValue === 0 && !isGhostPiece && BOARD_STYLES.emptyCellBorder,
        isCurrentPiece && BOARD_STYLES.activePiece,
        isClearingLine && BOARD_STYLES.clearingLine,
      )}
    />
  );
}
