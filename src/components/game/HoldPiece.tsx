import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getTetrominoShape } from "../../game/tetrominos";
import { useGameStore } from "../../store/gameStore";
import { getTetrominoColor } from "../../utils/colors";
import { NEXT_PIECE_GRID_SIZE } from "../../utils/gameConstants";
import { CARD_STYLES } from "../../utils/styles";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TetrominoGrid } from "./TetrominoGrid";

export function HoldPiece() {
  const heldPiece = useGameStore((state) => state.heldPiece);
  const canHold = useGameStore((state) => state.canHold);
  const { t } = useTranslation();

  const shape = heldPiece ? getTetrominoShape(heldPiece) : null;
  const tetrominoColor = heldPiece ? getTetrominoColor(heldPiece) : "";

  return (
    <Card className={cn(CARD_STYLES.base, CARD_STYLES.hover, "shadow-xl hover:shadow-2xl")}>
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-300 text-center">
          {t("game.hold")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TetrominoGrid
          shape={shape}
          tetrominoColor={tetrominoColor}
          gridSize={NEXT_PIECE_GRID_SIZE}
          keyPrefix="hold"
          disabled={!canHold}
        />
      </CardContent>
    </Card>
  );
}
