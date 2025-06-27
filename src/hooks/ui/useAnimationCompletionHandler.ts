import { useCallback, useEffect, useRef } from "react";
import { useGameActions } from "../actions/useGameActions";

export function useAnimationCompletionHandler() {
  const { clearAnimationStates } = useGameActions();
  const clearTimeoutRef = useRef<number | null>(null);
  const clearRequestRef = useRef<number | null>(null);

  const handleAnimationComplete = useCallback(
    (isClearingLine: boolean, isPlacedPiece: boolean) => {
      if (isClearingLine) {
        // Cancel any pending clear operations to prevent duplicate calls
        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
        }
        if (clearRequestRef.current) {
          cancelAnimationFrame(clearRequestRef.current);
        }

        // For line clear animation, delay clearing to ensure animation completes
        clearTimeoutRef.current = window.setTimeout(() => {
          clearAnimationStates();
          clearTimeoutRef.current = null;
        }, 10); // Minimal delay to ensure animation DOM updates complete
      } else if (isPlacedPiece) {
        // Cancel any pending clear operations to prevent duplicate calls
        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
        }
        if (clearRequestRef.current) {
          cancelAnimationFrame(clearRequestRef.current);
        }

        // For piece placement animation, clear the state in the next frame
        clearRequestRef.current = requestAnimationFrame(() => {
          clearAnimationStates();
          clearRequestRef.current = null;
        });
      }
    },
    [clearAnimationStates],
  );

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }
      if (clearRequestRef.current) {
        cancelAnimationFrame(clearRequestRef.current);
        clearRequestRef.current = null;
      }
    };
  }, []);

  return { handleAnimationComplete };
}
