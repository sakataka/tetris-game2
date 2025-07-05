import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTetrominoShape } from "@/game/tetrominos";
import { cn } from "@/lib/utils";
import type { TetrominoTypeName } from "@/types/game";
import { getTetrominoColor } from "@/utils/colors";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { CARD_STYLES } from "@/utils/styles";
import { TetrominoGrid } from "./TetrominoGrid";

interface PieceDisplayProps {
  type: "next" | "hold";
  piece: TetrominoTypeName | null;
  disabled?: boolean;
}

export function PieceDisplay({ type, piece, disabled = false }: PieceDisplayProps) {
  const { t } = useTranslation();
  const shape = piece ? getTetrominoShape(piece) : null;
  const tetrominoColor = piece ? getTetrominoColor(piece) : "";

  return (
    <Card className={cn(CARD_STYLES.base, CARD_STYLES.hover, "shadow-xl hover:shadow-2xl")}>
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-300 text-center">
          {t(`game.${type}`)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TetrominoGrid
          shape={shape}
          tetrominoColor={tetrominoColor}
          gridSize={GAME_CONSTANTS.TETROMINO.NEXT_PIECE_GRID_SIZE}
          keyPrefix={type}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
