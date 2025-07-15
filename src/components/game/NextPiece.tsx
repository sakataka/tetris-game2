import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { PieceDisplay } from "./PieceDisplay";

export function NextPiece() {
  const nextPieces = useGamePlayStore((state) => state.nextPieces);
  const nextPiece = nextPieces[0] || null; // Get first piece for compatibility
  return <PieceDisplay type="next" piece={nextPiece} />;
}
