import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { PieceDisplay } from "./PieceDisplay";

export function HoldPiece() {
  const heldPiece = useGamePlayStore((state) => state.heldPiece);
  const canHold = useGamePlayStore((state) => state.canHold);
  return <PieceDisplay type="hold" piece={heldPiece} disabled={!canHold} />;
}
