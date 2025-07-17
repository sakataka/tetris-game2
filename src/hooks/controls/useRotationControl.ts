import { useCallback } from "react";
import { useActionCooldown } from "./useActionCooldown";
import { useGameInputActions } from "./useGameInputActions";

/**
 * Hook for handling rotation control with proper debouncing to prevent double rotation
 *
 * Implements a cooldown period between rotations to ensure single rotation per button press
 */
export function useRotationControl() {
  const { rotate } = useGameInputActions(); // Using consolidated hook with built-in validation

  // Cooldown period in milliseconds to prevent double rotation
  const ROTATION_COOLDOWN = 200;

  const rotateAction = useActionCooldown(
    useCallback(() => rotate(), [rotate]),
    ROTATION_COOLDOWN,
  );

  return { handleRotate: rotateAction.execute };
}
