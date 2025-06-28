import { useCallback } from "react";
import { useGameStore } from "../../store/gameStore";
import { useGameActionHandler } from "../core/useGameActionHandler";
import { useActionCooldown } from "./useActionCooldown";

/**
 * Hook for handling movement controls with proper debouncing to prevent multiple rapid movements
 *
 * Implements cooldown periods between movements to ensure single action per button press
 */
export function useMovementControls() {
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const moveDown = useGameStore((state) => state.moveDown);
  const drop = useGameStore((state) => state.drop);
  const executeAction = useGameActionHandler();

  // Cooldown periods in milliseconds to prevent double actions
  const MOVEMENT_COOLDOWN = 150; // Slightly faster than rotation for better feel
  const DROP_COOLDOWN = 200; // Same as rotation for consistency

  const handleMoveLeft = useActionCooldown(
    useCallback(() => executeAction(moveLeft), [executeAction, moveLeft]),
    MOVEMENT_COOLDOWN,
  );

  const handleMoveRight = useActionCooldown(
    useCallback(() => executeAction(moveRight), [executeAction, moveRight]),
    MOVEMENT_COOLDOWN,
  );

  const handleMoveDown = useActionCooldown(
    useCallback(() => executeAction(moveDown), [executeAction, moveDown]),
    MOVEMENT_COOLDOWN,
  );

  const handleDrop = useActionCooldown(
    useCallback(() => executeAction(drop, true), [executeAction, drop]), // urgent = true for hard drop
    DROP_COOLDOWN,
  );

  return {
    handleMoveLeft,
    handleMoveRight,
    handleMoveDown,
    handleDrop,
  };
}
