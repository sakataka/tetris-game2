import { cn } from "@/lib/utils";
import { useBoardData } from "../../hooks/selectors/useBoardSelectors";
import { useAnimationCompletionHandler } from "../../hooks/ui/useAnimationCompletionHandler";
import { GAME_CONSTANTS } from "../../utils/gameConstants";
import { BOARD_STYLES, CARD_STYLES } from "../../utils/styles";
import { Card } from "../ui/card";
import { BoardCell } from "./BoardCell";

export function Board() {
  const {
    displayBoard,
    currentPiecePositions,
    ghostPiecePositions,
    placedPositionsSet,
    clearingLines,
    animationTriggerKey,
  } = useBoardData();
  const { handleAnimationComplete } = useAnimationCompletionHandler();

  return (
    <Card
      className={cn(
        CARD_STYLES.base,
        CARD_STYLES.hover,
        `p-6 min-w-[${GAME_CONSTANTS.BOARD.MIN_WIDTH_PX}px] min-h-[${GAME_CONSTANTS.BOARD.MIN_HEIGHT_PX}px] shadow-2xl hover:shadow-3xl`,
      )}
    >
      <div
        className={BOARD_STYLES.container}
        aria-label="Tetris game board"
        role="img"
        style={{
          gridTemplateColumns: `repeat(${GAME_CONSTANTS.BOARD.WIDTH}, ${GAME_CONSTANTS.BOARD.CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GAME_CONSTANTS.BOARD.HEIGHT}, ${GAME_CONSTANTS.BOARD.CELL_SIZE}px)`,
        }}
      >
        {displayBoard.map((row, y) =>
          row.map((cell, x) => {
            const positionKey = `${x},${y}`;
            const isCurrentPiece = currentPiecePositions.has(positionKey);
            const isGhostPiece = ghostPiecePositions.has(positionKey) && !isCurrentPiece;
            const isPlacedPiece = placedPositionsSet.has(positionKey);
            const isClearingLine = clearingLines.includes(y);

            // Use the actual cell value, not forced to 0
            const cellValue = cell;

            return (
              <BoardCell
                key={`cell-${y * GAME_CONSTANTS.BOARD.WIDTH + x}`}
                cellValue={cellValue}
                x={x}
                y={y}
                isCurrentPiece={isCurrentPiece}
                isGhostPiece={isGhostPiece}
                isPlacedPiece={isPlacedPiece}
                isClearingLine={isClearingLine}
                animationTrigger={animationTriggerKey}
                onAnimationComplete={() => handleAnimationComplete(isClearingLine, isPlacedPiece)}
              />
            );
          }),
        )}
      </div>
    </Card>
  );
}
