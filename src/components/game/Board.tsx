import { useBoardData, useGameActions } from "../../hooks/useGameSelectors";
import { getTetrominoColorIndex } from "../../types/game";
import { BOARD_CELL_SIZE_PX, BOARD_HEIGHT, BOARD_WIDTH } from "../../utils/constants";
import { BOARD_STYLES, CARD_STYLES, combineStyles } from "../../utils/styles";
import { Card } from "../ui/card";
import { BoardCell } from "./BoardCell";

export function Board() {
  const { board, currentPiece, placedPositions, clearingLines, animationTriggerKey } =
    useBoardData();

  const { clearAnimationStates } = useGameActions();

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
            const isCurrentPiece =
              currentPiece?.shape.some((shapeRow, shapeY) =>
                shapeRow.some(
                  (shapeCell, shapeX) =>
                    shapeCell &&
                    currentPiece.position.y + shapeY === y &&
                    currentPiece.position.x + shapeX === x,
                ),
              ) ?? false;

            const isPlacedPiece = placedPositions.some((pos) => pos.x === x && pos.y === y);
            const isClearingLine = clearingLines.includes(y);

            return (
              <BoardCell
                key={`cell-${y * BOARD_WIDTH + x}`}
                cellValue={cell}
                x={x}
                y={y}
                isCurrentPiece={isCurrentPiece}
                isPlacedPiece={isPlacedPiece}
                isClearingLine={isClearingLine}
                animationTriggerKey={animationTriggerKey}
                onAnimationComplete={() => {
                  if (isClearingLine) {
                    clearAnimationStates();
                  } else if (isPlacedPiece) {
                    setTimeout(() => clearAnimationStates(), 50);
                  }
                }}
              />
            );
          }),
        )}
      </div>
    </Card>
  );
}
