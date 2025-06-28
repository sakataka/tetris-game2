import { useCallback, useRef } from "react";
import { useGameStore } from "../../store/gameStore";
import { useGameActionHandler } from "../core/useGameActionHandler";

/**
 * Hook for handling rotation control with proper debouncing to prevent double rotation
 *
 * Implements a cooldown period between rotations to ensure single rotation per button press
 */
export function useRotationControl() {
  const rotate = useGameStore((state) => state.rotate);
  const executeAction = useGameActionHandler();
  const lastRotationTimeRef = useRef<number>(0);

  // Cooldown period in milliseconds to prevent double rotation
  const ROTATION_COOLDOWN = 200;

  const handleRotate = useCallback(() => {
    const now = Date.now();

    // Check if enough time has passed since last rotation
    if (now - lastRotationTimeRef.current < ROTATION_COOLDOWN) {
      return; // Ignore this rotation attempt
    }

    // Update last rotation time and execute rotation
    lastRotationTimeRef.current = now;
    executeAction(rotate);
  }, [rotate, executeAction]);

  return { handleRotate };
}
