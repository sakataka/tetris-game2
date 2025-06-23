import { useMemo } from "react";
import { getTetrominoColorIndex } from "../../game/tetrominos";
import { useBoardData } from "../../hooks/useGameSelectors"; // useGameActions removed
import { BOARD_CELL_SIZE_PX, BOARD_HEIGHT, BOARD_WIDTH } from "../../utils/constants";
import { BOARD_STYLES, CARD_STYLES, combineStyles } from "../../utils/styles";
import { Card } from "../ui/card";
import { BoardCell } from "./BoardCell";

export function Board() {
  const { board, currentPiece, placedPositions, clearingLines, animationTriggerKey } =
    useBoardData();

  // Unified current piece processing - compute both display board and positions
  const { displayBoard, currentPiecePositions } = useMemo(() => {
    const newBoard = board.map((row) => [...row]);
    const positions = new Set<string>();

    if (currentPiece) {
      const colorIndex = getTetrominoColorIndex(currentPiece.type);
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              newBoard[boardY][boardX] = colorIndex;
              positions.add(`${boardX},${boardY}`);
            }
          }
        });
      });
    }

    return { displayBoard: newBoard, currentPiecePositions: positions };
  }, [board, currentPiece]);

  // Pre-compute placed positions for O(1) lookup
  const placedPositionsSet = useMemo(() => {
    const positions = new Set<string>();
    placedPositions.forEach((pos) => {
      positions.add(`${pos.x},${pos.y}`);
    });
    return positions;
  }, [placedPositions]);

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
            const positionKey = `${x},${y}`;
            const isCurrentPiece = currentPiecePositions.has(positionKey);
            const isPlacedPiece = placedPositionsSet.has(positionKey);
            const isClearingLine = clearingLines.includes(y);

            // Force cell value to 0 for clearing lines to prevent color bleeding
            const cellValue = isClearingLine ? 0 : cell;

            return (
              <BoardCell
                key={`cell-${y * BOARD_WIDTH + x}`}
                cellValue={cellValue}
                x={x}
                y={y}
                isCurrentPiece={isCurrentPiece}
                isPlacedPiece={isPlacedPiece}
                isClearingLine={isClearingLine}
                animationTriggerKey={animationTriggerKey}
                // onAnimationComplete is now handled by useAnimationCompletionHandler in BoardCell
              />
            );
          }),
        )}
      </div>
    </Card>
  );
}
