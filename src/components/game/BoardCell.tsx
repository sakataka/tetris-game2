import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAnimationCompletionHandler } from "../../hooks/useAnimationCompletionHandler";
import { useCellAnimation } from "../../hooks/useCellAnimation";
import { getCellColor } from "../../utils/colors";
import { BOARD_WIDTH } from "../../utils/constants";
import { BOARD_STYLES } from "../../utils/styles";

interface BoardCellProps {
  cellValue: number;
  x: number;
  y: number;
  isCurrentPiece: boolean;
  isPlacedPiece: boolean;
  isClearingLine: boolean;
  animationTriggerKey: string | number;
  // onAnimationComplete is now handled internally by useAnimationCompletionHandler
}

/**
 * Individual cell component for the Tetris board with animation support
 */
export function BoardCell({
  cellValue,
  x,
  y,
  isCurrentPiece,
  isPlacedPiece,
  isClearingLine,
  animationTriggerKey,
}: BoardCellProps) {
  const { initialAnimation, animateProps, transitionProps } = useCellAnimation({
    isCurrentPiece,
    isPlacedPiece,
    isClearingLine,
    cellValue,
  });
  const { handleAnimationComplete } = useAnimationCompletionHandler();

  return (
    <motion.div
      key={`cell-${y * BOARD_WIDTH + x}-${isCurrentPiece ? animationTriggerKey : "static"}-${isClearingLine ? "clearing" : "normal"}-${cellValue}`}
      initial={initialAnimation}
      animate={animateProps}
      transition={transitionProps}
      onAnimationComplete={() => handleAnimationComplete(isClearingLine, isPlacedPiece)}
      className={cn(
        BOARD_STYLES.cell,
        getCellColor(cellValue),
        cellValue !== 0 && BOARD_STYLES.cellBorder,
        cellValue === 0 && BOARD_STYLES.emptyCellBorder,
        isCurrentPiece && BOARD_STYLES.activePiece,
        isClearingLine && BOARD_STYLES.clearingLine,
      )}
    />
  );
}
