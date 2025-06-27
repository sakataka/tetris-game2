import type { TransitionStartFunction } from "react";

/**
 * Helper function for executing game actions with common conditions
 * - Prevents actions when game is over or paused
 * - Optionally wraps actions in useTransition for better UI responsiveness
 *
 * We use React's startTransition (concurrent features) to:
 * - Mark state updates as non-urgent, allowing React to interrupt them
 * - Keep the UI responsive during rapid user inputs (e.g., key mashing)
 * - Prevent blocking visual feedback like button presses or animations
 * - Leverage React 19's improved scheduling for smoother gameplay
 *
 * Some actions (like hard drop) skip the transition wrapper for immediate feedback
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
