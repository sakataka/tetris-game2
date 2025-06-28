import { cn } from "@/lib/utils";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

interface TetrominoGridProps {
  shape: number[][] | null;
  tetrominoColor: string;
  gridSize: number;
  keyPrefix: string;
  disabled?: boolean;
}

export function TetrominoGrid({
  shape,
  tetrominoColor,
  gridSize,
  keyPrefix,
  disabled = false,
}: TetrominoGridProps) {
  return (
    <div
      className={cn(
        `grid grid-cols-4 grid-rows-${GAME_CONSTANTS.TETROMINO.GRID_ROWS} gap-[1px] bg-gray-700 rounded-lg overflow-hidden w-fit mx-auto p-1`,
        disabled && "opacity-50",
      )}
    >
      {Array.from({ length: GAME_CONSTANTS.TETROMINO.GRID_ROWS }).map((_, y) =>
        Array.from({ length: gridSize }).map((_, x) => {
          const isActive = shape?.[y]?.[x] === 1;
          return (
            <div
              key={`${keyPrefix}-${y * gridSize + x}`}
              className={cn(
                "w-4 h-4 rounded-sm transition-all duration-200",
                isActive ? cn(tetrominoColor, "border border-white/20 shadow-sm") : "bg-gray-800",
              )}
            />
          );
        }),
      )}
    </div>
  );
}
