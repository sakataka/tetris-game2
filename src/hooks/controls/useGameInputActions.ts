import { useMemo } from "react";
import { useGameStoreActions } from "@/hooks/core/useGameStoreActions";

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
 * - Leverages useGameStoreActions for DRY principle
 *
 * @returns Game input actions object with semantic naming
 */
export function useGameInputActions(): GameInputActions {
  // Get core actions from game store (eliminates duplication)
  const actions = useGameStoreActions();

  // Transform core actions to input-specific semantic names
  return useMemo(
    () => ({
      moveLeft: actions.moveLeft,
      moveRight: actions.moveRight,
      rotateClockwise: actions.rotate,
      rotateCounterClockwise: actions.rotate, // In current implementation, both use same rotation
      rotate180: actions.rotate180,
      softDrop: actions.moveDown,
      hardDrop: actions.drop,
      hold: actions.holdPiece,
      pause: actions.togglePause,
      reset: actions.showResetDialog,
    }),
    [actions],
  );
}
