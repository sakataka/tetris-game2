import { useCallback, useTransition } from "react";
import { useGameStore } from "../store/gameStore";

/**
 * Shared game action handler that provides consistent action execution across all hooks
 *
 * This hook centralizes:
 * - Game state validation (isGameOver, isPaused)
 * - Transition handling for non-urgent actions
 * - Consistent action execution pattern
 *
 * Benefits:
 * - Eliminates duplicate game state checking logic
 * - Provides consistent action execution pattern across all hooks
 * - Centralized transition handling
 * - Easier to modify game state validation logic
 */
export function useGameActionHandler() {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isPaused = useGameStore((state) => state.isPaused);
  const [, startTransition] = useTransition();

  return useCallback(
    (action: () => void, urgent = false) => {
      if (isGameOver || isPaused) return;

      if (urgent) {
        action();
      } else {
        startTransition(action);
      }
    },
    [isGameOver, isPaused],
  );
}
