import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getTetrominoShape } from "../../game/tetrominos";
import { useGameStore } from "../../store/gameStore";
import { getTetrominoColor } from "../../utils/colors";
import { NEXT_PIECE_GRID_SIZE } from "../../utils/constants";
import { CARD_STYLES } from "../../utils/styles";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function NextPiece() {
  const { nextPiece } = useGameStore();
  const { t } = useTranslation();
  const shape = getTetrominoShape(nextPiece);
  const tetrominoColor = getTetrominoColor(nextPiece);

  return (
    <Card className={cn(CARD_STYLES.base, CARD_STYLES.hover, "shadow-xl hover:shadow-2xl")}>
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-300 text-center">
          {t("game.next")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 grid-rows-4 gap-[1px] bg-gray-700 rounded-lg overflow-hidden w-fit mx-auto p-1">
          {Array.from({ length: NEXT_PIECE_GRID_SIZE }).map((_, y) =>
            Array.from({ length: NEXT_PIECE_GRID_SIZE }).map((_, x) => {
              const isActive = shape[y]?.[x] === 1;
              return (
                <div
                  key={`next-${y * NEXT_PIECE_GRID_SIZE + x}`}
                  className={cn(
                    "w-4 h-4 rounded-sm transition-all duration-200",
                    isActive
                      ? cn(tetrominoColor, "border border-white/20 shadow-sm")
                      : "bg-gray-800",
                  )}
                />
              );
            }),
          )}
        </div>
      </CardContent>
    </Card>
  );
}
