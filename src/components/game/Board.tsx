import { Card } from "@/components/ui/card";
import { useResponsiveBoard } from "@/hooks/ui/useResponsiveBoard";
import { cn } from "@/lib/utils";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { BOARD_STYLES, CARD_STYLES } from "@/utils/styles";
import { BoardCell } from "./BoardCell";

export function Board() {
  const { cellSize } = useResponsiveBoard();

  // Generate all cell positions (20 rows x 10 columns)
  const cellPositions = Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, (_, row) =>
    Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, (_, col) => ({ row, col })),
  ).flat();

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
        {cellPositions.map(({ row, col }) => (
          <BoardCell
            key={`cell-${row * GAME_CONSTANTS.BOARD.WIDTH + col}`}
            row={row}
            col={col}
            cellSize={cellSize}
          />
        ))}
      </div>
    </Card>
  );
}
