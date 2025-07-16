import { useMemo } from "react";
import { useGamePlayActions, useGamePlayStore } from "@/features/game-play";

/**
 * Game input actions interface
 * Provides a consistent API for game controls
 */
export interface GameInputActions {
  readonly moveLeft: () => void;
  readonly moveRight: () => void;
  readonly rotateClockwise: () => void;
  readonly rotateCounterClockwise: () => void;
  readonly rotate180: () => void;
  readonly softDrop: () => void;
  readonly hardDrop: () => void;
  readonly hold: () => void;
  readonly pause: () => void;
  readonly reset: () => void;
}

/**
 * Game-specific action transformation hook following koba04 React best practices
 *
 * Responsibilities:
 * - Maps core game actions to input-specific interface
 * - Provides domain-specific action names for different input types
 * - Uses the new gamePlay store exclusively
 *
 * @returns Game input actions object with semantic naming
 */
export function useGameInputActions(): GameInputActions {
  // Get all actions from the new game play store
  const gamePlayActions = useGamePlayActions();
  // Get showResetDialog directly from store
  const showResetDialog = useGamePlayStore((state) => state.showResetDialog);

  // Transform core actions to input-specific semantic names
  return useMemo(
    () => ({
      moveLeft: gamePlayActions.moveLeft,
      moveRight: gamePlayActions.moveRight,
      rotateClockwise: gamePlayActions.rotateClockwise,
      rotateCounterClockwise: gamePlayActions.rotateCounterClockwise,
      rotate180: gamePlayActions.rotate180,
      softDrop: gamePlayActions.softDrop,
      hardDrop: gamePlayActions.hardDrop,
      hold: gamePlayActions.holdPiece,
      pause: gamePlayActions.pauseGame,
      reset: showResetDialog,
    }),
    [gamePlayActions, showResetDialog],
  );
}
