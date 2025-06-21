import { motion } from "framer-motion";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { useGameStore } from "../store/gameStore";
import { BOARD_HEIGHT, BOARD_WIDTH, getTetrominoColorIndex } from "../types/game";
import { Card } from "./ui/card";

const CELL_SIZE = 30;

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

  // Color mapping function using Tailwind colors
  const getCellColor = (cell: number) => {
    switch (cell) {
      case 0:
        return "bg-slate-900"; // Empty
      case 1:
        return "bg-tetris-cyan"; // I piece
      case 2:
        return "bg-tetris-yellow"; // O piece
      case 3:
        return "bg-tetris-purple"; // T piece
      case 4:
        return "bg-tetris-green"; // S piece
      case 5:
        return "bg-tetris-red"; // Z piece
      case 6:
        return "bg-tetris-blue"; // J piece
      case 7:
        return "bg-tetris-orange"; // L piece
      default:
        return "bg-slate-900";
    }
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 p-6 min-w-[320px] min-h-[620px] shadow-2xl hover:shadow-3xl hover:border-gray-600 transition-all duration-300">
      <div
        className="grid gap-[1px] bg-gray-700 p-1 rounded-sm"
        role="grid"
        aria-label="Tetris game board"
        style={{
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
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
                  "w-[30px] h-[30px] rounded-sm transition-all duration-150",
                  getCellColor(cell),
                  cell !== 0 && "border border-white/20 shadow-sm",
                  cell === 0 && "border border-gray-700/50",
                  isCurrentPiece && "shadow-white/50 shadow-lg ring-1 ring-white/30",
                  isClearingLine && "shadow-white/80 shadow-xl ring-2 ring-white/50 animate-pulse",
                )}
              />
            );
          }),
        )}
      </div>
    </Card>
  );
});
