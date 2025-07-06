import type { Position, Tetromino } from "@/types/game";

export type RotationDirection = "clockwise" | "counterclockwise" | "180";

export type RotationTransition90 =
  | "0->1"
  | "1->2"
  | "2->3"
  | "3->0"
  | "1->0"
  | "2->1"
  | "3->2"
  | "0->3";
export type RotationTransition180 = "0->2" | "1->3" | "2->0" | "3->1";

export type RotationTransition = RotationTransition90 | RotationTransition180;

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
