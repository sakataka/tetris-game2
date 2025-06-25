import type { TransitionStartFunction } from "react";

/**
 * Helper function for executing game actions with common conditions
 * - Prevents actions when game is over or paused
 * - Optionally wraps actions in useTransition for better UI responsiveness
 */
export function createExecuteGameAction(
  isGameOver: boolean,
  isPaused: boolean,
  startTransition: TransitionStartFunction,
) {
  return (action: () => void, useTransitionWrapper = true) => {
    if (isGameOver || isPaused) return;
    if (useTransitionWrapper) {
      startTransition(action);
    } else {
      action();
    }
  };
}
