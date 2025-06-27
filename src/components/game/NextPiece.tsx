import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getTetrominoShape } from "../../game/tetrominos";
import { useGameStore } from "../../store/gameStore";
import { getTetrominoColor } from "../../utils/colors";
import { GAME_CONSTANTS } from "../../utils/gameConstants";
import { CARD_STYLES } from "../../utils/styles";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TetrominoGrid } from "./TetrominoGrid";

export function NextPiece() {
  const nextPiece = useGameStore((state) => state.nextPiece);
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
        <TetrominoGrid
          shape={shape}
          tetrominoColor={tetrominoColor}
          gridSize={GAME_CONSTANTS.TETROMINO.NEXT_PIECE_GRID_SIZE}
          keyPrefix="next"
        />
      </CardContent>
    </Card>
  );
}
