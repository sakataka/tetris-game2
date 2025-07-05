import { useGameStore } from "@/store/gameStore";
import { PieceDisplay } from "./PieceDisplay";

export function NextPiece() {
  const nextPiece = useGameStore((state) => state.nextPiece);
  return <PieceDisplay type="next" piece={nextPiece} />;
}
