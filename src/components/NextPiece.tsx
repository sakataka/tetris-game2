import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getTetrominoShape } from "../game/tetrominos";
import { useGameStore } from "../store/gameStore";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function NextPiece() {
  const { nextPiece } = useGameStore();
  const { t } = useTranslation();
  const shape = getTetrominoShape(nextPiece);
  const colorIndex = ["I", "O", "T", "S", "Z", "J", "L"].indexOf(nextPiece) + 1;

  // Color mapping function using Tailwind colors
  const getCellColor = (colorIndex: number) => {
    switch (colorIndex) {
      case 1:
        return "bg-tetris-cyan"; // I piece
      case 2:
        return "bg-tetris-yellow"; // O piece
      case 3:
        return "bg-tetris-purple"; // T piece
      case 4:
        return "bg-tetris-green"; // S piece
      case 5:
        return "bg-tetris-red"; // Z piece
      case 6:
        return "bg-tetris-blue"; // J piece
      case 7:
        return "bg-tetris-orange"; // L piece
      default:
        return "bg-gray-800";
    }
  };

  const getPieceType = (piece: string) => {
    const types = {
      I: "Line",
      O: "Square",
      T: "T-Shape",
      S: "S-Shape",
      Z: "Z-Shape",
      J: "J-Shape",
      L: "L-Shape",
    };
    return types[piece as keyof typeof types] || piece;
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl hover:bg-gray-900/60 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-300 text-center flex items-center justify-center gap-2">
          {t("game.next")}
          <Badge variant="outline" className="border-gray-600 text-gray-400">
            {getPieceType(nextPiece)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 grid-rows-4 gap-[1px] bg-gray-700 rounded-lg overflow-hidden w-fit mx-auto p-1">
          {Array.from({ length: 4 }).map((_, y) =>
            Array.from({ length: 4 }).map((_, x) => {
              const isActive = shape[y]?.[x] === 1;
              return (
                <div
                  key={`next-${y * 4 + x}`}
                  className={cn(
                    "w-5 h-5 rounded-sm transition-all duration-200",
                    isActive
                      ? cn(getCellColor(colorIndex), "border border-white/20 shadow-sm")
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
