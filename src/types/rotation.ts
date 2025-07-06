import type { Position, Tetromino } from "@/types/game";

export type RotationFailureReason = "collision" | "out-of-bounds" | "invalid-state";

export interface WallKickAttempt {
  offset: Position;
  tested: boolean;
  position: Position;
}

export interface RotationResult {
  success: boolean;
  piece?: Tetromino;
  kicksAttempted: WallKickAttempt[];
  failureReason?: RotationFailureReason;
}
