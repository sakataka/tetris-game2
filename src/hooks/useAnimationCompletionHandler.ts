import { useCallback } from "react";
import { useGameActions } from "./useGameSelectors";

export function useAnimationCompletionHandler() {
  const { clearAnimationStates } = useGameActions();

  const handleAnimationComplete = useCallback(
    (isClearingLine: boolean, isPlacedPiece: boolean) => {
      if (isClearingLine) {
        // For line clear animation, delay clearing to ensure animation completes
        setTimeout(() => {
          clearAnimationStates();
        }, 50); // Small delay to ensure animation DOM updates complete
      } else if (isPlacedPiece) {
        // For piece placement animation, clear the state in the next frame
        // This attempts to avoid consecutive calls to clearAnimationStates
        // when multiple cells complete animations simultaneously
        requestAnimationFrame(() => {
          clearAnimationStates();
        });
      }
    },
    [clearAnimationStates],
  );

  return { handleAnimationComplete };
}
