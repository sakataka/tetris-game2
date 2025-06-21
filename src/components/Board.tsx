import { motion } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import { BOARD_HEIGHT, BOARD_WIDTH, getTetrominoColorIndex } from "../types/game";

const CELL_SIZE = 30;

export function Board() {
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
    <div
      style={{
        background: "rgba(17, 24, 39, 0.5)",
        backdropFilter: "blur(4px)",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid rgb(55, 65, 81)",
        minWidth: "320px",
        minHeight: "620px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
          gap: "1px",
          background: "rgb(55, 65, 81)",
        }}
      >
        {displayBoard.map((row, y) =>
          row.map((cell, x) => {
            const isCurrentPiece =
              currentPiece &&
              currentPiece.shape.some((shapeRow, shapeY) =>
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
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  background:
                    cell === 0
                      ? "rgb(15, 23, 42)"
                      : cell === 1
                        ? "rgb(34, 211, 238)"
                        : cell === 2
                          ? "rgb(250, 204, 21)"
                          : cell === 3
                            ? "rgb(168, 85, 247)"
                            : cell === 4
                              ? "rgb(34, 197, 94)"
                              : cell === 5
                                ? "rgb(239, 68, 68)"
                                : cell === 6
                                  ? "rgb(59, 130, 246)"
                                  : "rgb(249, 115, 22)",
                  border:
                    cell !== 0
                      ? "1px solid rgba(255,255,255,0.2)"
                      : "1px solid rgba(55, 65, 81, 0.5)",
                  boxShadow: isCurrentPiece
                    ? "0 0 10px rgba(255,255,255,0.5)"
                    : isClearingLine
                      ? "0 0 15px rgba(255,255,255,0.8)"
                      : "none",
                }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
