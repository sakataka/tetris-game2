import { useCallback } from "react";
import { useGameActionHandler } from "@/hooks/core/useGameActionHandler";
import { useGameStoreActions } from "@/hooks/core/useGameStoreActions";
import { useActionCooldown } from "./useActionCooldown";

/**
 * Hook for handling rotation control with proper debouncing to prevent double rotation
 *
 * Implements a cooldown period between rotations to ensure single rotation per button press
 */
export function useRotationControl() {
  const { rotate } = useGameStoreActions();
  const executeAction = useGameActionHandler();

  // Cooldown period in milliseconds to prevent double rotation
  const ROTATION_COOLDOWN = 200;

  const rotateAction = useActionCooldown(
    useCallback(() => executeAction(rotate), [executeAction, rotate]),
    ROTATION_COOLDOWN,
  );

  return { handleRotate: rotateAction.execute };
}
