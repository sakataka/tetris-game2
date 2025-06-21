import { motion } from "framer-motion";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { useGameStore } from "../../store/gameStore";
import { getTetrominoColorIndex } from "../../types/game";
import { getCellColor } from "../../utils/colors";
import { BOARD_CELL_SIZE_PX, BOARD_HEIGHT, BOARD_WIDTH } from "../../utils/constants";
import { BOARD_STYLES, CARD_STYLES, combineStyles } from "../../utils/styles";
import { Card } from "../ui/card";

export const Board = memo(function Board() {
  const { board, currentPiece, placedPositions, clearingLines, rotationKey, clearAnimationStates } =
    useGameStore();

  // Create display board with current piece
  const displayBoard = board.map((row) => [...row]);

  if (currentPiece) {
    const colorIndex = getTetrominoColorIndex(currentPiece.type);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = currentPiece.position.y + y;
          const boardX = currentPiece.position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            displayBoard[boardY][boardX] = colorIndex;
          }
        }
      });
    });
  }

  return (
    <Card
      className={combineStyles(
        CARD_STYLES.base,
        CARD_STYLES.hover,
        "p-6 min-w-[320px] min-h-[620px] shadow-2xl hover:shadow-3xl",
      )}
    >
      <div
        className={BOARD_STYLES.container}
        aria-label="Tetris game board"
        role="img"
        style={{
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${BOARD_CELL_SIZE_PX}px)`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${BOARD_CELL_SIZE_PX}px)`,
        }}
      >
        {displayBoard.map((row, y) =>
          row.map((cell, x) => {
            const isCurrentPiece = currentPiece?.shape.some((shapeRow, shapeY) =>
              shapeRow.some(
                (shapeCell, shapeX) =>
                  shapeCell &&
                  currentPiece.position.y + shapeY === y &&
                  currentPiece.position.x + shapeX === x,
              ),
            );

            const isPlacedPiece = placedPositions.some((pos) => pos.x === x && pos.y === y);
            const isClearingLine = clearingLines.includes(y);

            // Ensure animation states don't interfere with static cells
            // Only animate if cell has content OR if it's currently clearing
            const shouldAnimate =
              (isCurrentPiece && cell !== 0) ||
              (isPlacedPiece && cell !== 0) ||
              (isClearingLine && cell !== 0);

            return (
              <motion.div
                key={`cell-${y * BOARD_WIDTH + x}-${isCurrentPiece ? rotationKey : "static"}`}
                initial={
                  shouldAnimate
                    ? isCurrentPiece
                      ? { y: -8, opacity: 0.9 }
                      : isPlacedPiece
                        ? { scale: 0.9 }
                        : false
                    : false
                }
                animate={
                  shouldAnimate
                    ? isCurrentPiece
                      ? { y: 0, opacity: 1 }
                      : isPlacedPiece
                        ? { scale: 1 }
                        : isClearingLine
                          ? { opacity: [1, 0.3, 1, 0.3, 1], scale: [1, 1.1, 1] }
                          : {}
                    : {}
                }
                transition={
                  shouldAnimate
                    ? isCurrentPiece
                      ? {
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          duration: 0.25,
                        }
                      : {
                          duration: isClearingLine ? 0.6 : 0.15,
                          repeat: isClearingLine ? 2 : 0,
                        }
                    : {}
                }
                onAnimationComplete={() => {
                  // Clear animation states after any animation completes
                  if (shouldAnimate) {
                    // Immediate clear for clearing lines to prevent color mixing
                    if (isClearingLine) {
                      clearAnimationStates();
                    } else if (isPlacedPiece) {
                      setTimeout(() => clearAnimationStates(), 50);
                    }
                  }
                }}
                className={cn(
                  BOARD_STYLES.cell,
                  getCellColor(cell),
                  cell !== 0 && BOARD_STYLES.cellBorder,
                  cell === 0 && BOARD_STYLES.emptyCellBorder,
                  isCurrentPiece && BOARD_STYLES.activePiece,
                  isClearingLine && BOARD_STYLES.clearingLine,
                )}
              />
            );
          }),
        )}
      </div>
    </Card>
  );
});
