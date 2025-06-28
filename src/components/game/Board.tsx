import { cn } from "@/lib/utils";
import { useBoardData } from "@/hooks/selectors/useBoardSelectors";
import { useAnimationCompletionHandler } from "@/hooks/ui/useAnimationCompletionHandler";
import { useResponsiveBoard } from "@/hooks/ui/useResponsiveBoard";
import { createCellKey } from "@/utils/boardUtils";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { BOARD_STYLES, CARD_STYLES } from "@/utils/styles";
import { Card } from "@/components/ui/card";
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
  const { cellSize } = useResponsiveBoard();

  return (
    <Card className={cn(CARD_STYLES.base, CARD_STYLES.hover, "p-3 md:p-6")}>
      <div
        className={BOARD_STYLES.container}
        aria-label="Tetris game board"
        role="img"
        style={{
          gridTemplateColumns: `repeat(${GAME_CONSTANTS.BOARD.WIDTH}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${GAME_CONSTANTS.BOARD.HEIGHT}, ${cellSize}px)`,
        }}
      >
        {displayBoard.map((row, y) =>
          row.map((cell, x) => {
            const positionKey = createCellKey({ x, y });
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
                cellSize={cellSize}
              />
            );
          }),
        )}
      </div>
    </Card>
  );
}
