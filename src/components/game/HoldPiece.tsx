import { useGameStore } from "@/store/gameStore";
import { PieceDisplay } from "./PieceDisplay";

export function HoldPiece() {
  const heldPiece = useGameStore((state) => state.heldPiece);
  const canHold = useGameStore((state) => state.canHold);
  return <PieceDisplay type="hold" piece={heldPiece} disabled={!canHold} />;
}
