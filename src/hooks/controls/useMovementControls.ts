import { useCallback } from "react";
import { useActionCooldown } from "./useActionCooldown";
import { useGameInputActions } from "./useGameInputActions";

/**
 * Hook for handling movement controls with proper debouncing to prevent multiple rapid movements
 *
 * Implements cooldown periods between movements to ensure single action per button press
 */
export function useMovementControls() {
  const { moveLeft, moveRight, moveDown, drop } = useGameInputActions(); // Using consolidated hook with built-in validation

  // Cooldown periods in milliseconds to prevent double actions
  const MOVEMENT_COOLDOWN = 150; // Slightly faster than rotation for better feel
  const DROP_COOLDOWN = 200; // Same as rotation for consistency

  const moveLeftAction = useActionCooldown(
    useCallback(() => moveLeft(), [moveLeft]),
    MOVEMENT_COOLDOWN,
  );

  const moveRightAction = useActionCooldown(
    useCallback(() => moveRight(), [moveRight]),
    MOVEMENT_COOLDOWN,
  );

  const moveDownAction = useActionCooldown(
    useCallback(() => moveDown(), [moveDown]),
    MOVEMENT_COOLDOWN,
  );

  const dropAction = useActionCooldown(
    useCallback(() => drop(), [drop]), // Note: drop is already marked as urgent in useGameInputActions
    DROP_COOLDOWN,
  );

  return {
    handleMoveLeft: moveLeftAction.execute,
    handleMoveRight: moveRightAction.execute,
    handleMoveDown: moveDownAction.execute,
    handleDrop: dropAction.execute,
  };
}
