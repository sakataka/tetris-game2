import { useCallback } from "react";
import { useGameActions } from "./useGameSelectors";

export function useAnimationCompletionHandler() {
  const { clearAnimationStates } = useGameActions();

  const handleAnimationComplete = useCallback(
    (isClearingLine: boolean, isPlacedPiece: boolean) => {
      if (isClearingLine) {
        // For line clear animation, clear the state immediately
        clearAnimationStates();
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
