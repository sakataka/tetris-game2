import { useGameStore } from "../store/gameStore";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../types/game";

const CELL_SIZE = 30;

export function Board() {
  const { board, currentPiece } = useGameStore();

  // Create display board with current piece
  const displayBoard = board.map((row) => [...row]);

  if (currentPiece) {
    const colorIndex = ["I", "O", "T", "S", "Z", "J", "L"].indexOf(currentPiece.type) + 1;
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
          row.map((cell, x) => (
            <div
              key={`cell-${y * BOARD_WIDTH + x}`}
              style={{
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                background:
                  cell === 0
                    ? "rgb(31, 41, 55)"
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
                border: cell !== 0 ? "1px solid rgba(255,255,255,0.2)" : "none",
                transition: "all 0.1s",
              }}
            />
          )),
        )}
      </div>
    </div>
  );
}
