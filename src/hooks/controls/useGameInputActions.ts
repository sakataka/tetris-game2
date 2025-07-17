import { useCallback, useMemo, useTransition } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGamePlayActions, useGamePlayStore } from "@/features/game-play";

/**
 * Game input actions interface
 * Provides a consistent API for game controls with built-in state validation
 */
export interface GameInputActions {
  readonly moveLeft: () => void;
  readonly moveRight: () => void;
  readonly rotateClockwise: () => void;
  readonly rotateCounterClockwise: () => void;
  readonly rotate180: () => void;
  readonly softDrop: () => void;
  readonly hardDrop: () => void;
  readonly hold: () => void;
  readonly pause: () => void;
  readonly reset: () => void;

  // Extended interface with additional actions from useGameStoreActions
  readonly moveDown: () => void;
  readonly rotate: () => void;
  readonly drop: () => void;
  readonly holdPiece: () => void;
  readonly togglePause: () => void;
  readonly resetGame: () => void;
  readonly showResetDialog: () => void;
  readonly hideResetDialog: () => void;
  readonly confirmReset: () => void;
  readonly clearAnimationData: () => void;
}

/**
 * Consolidated game input actions hook
 *
 * This hook provides a unified interface for all game actions with:
 * - Built-in state validation (isGameOver, isPaused)
 * - React transition handling for performance
 * - Semantic naming for different input types
 * - Complete action set from all previous hooks
 *
 * @returns Game input actions object with comprehensive functionality
 */
export function useGameInputActions(): GameInputActions {
  // Get all actions from the new game play store
  const gamePlayActions = useGamePlayActions();

  // Optimize selectors with useShallow for better performance
  const { isGameOver, isPaused } = useGamePlayStore(
    useShallow((state) => ({
      isGameOver: state.isGameOver,
      isPaused: state.isPaused,
    })),
  );

  const { showResetDialog, hideResetDialog, confirmReset, clearAnimationData } = useGamePlayStore(
    useShallow((state) => ({
      showResetDialog: state.showResetDialog,
      hideResetDialog: state.hideResetDialog,
      confirmReset: state.confirmReset,
      clearAnimationData: state.clearAnimationData,
    })),
  );

  // Transition for non-urgent actions
  const [, startTransition] = useTransition();

  // Action handler with validation
  const executeAction = useCallback(
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

  // Wrap actions with validation
  const createValidatedAction = useCallback(
    (action: () => void, urgent = false) =>
      () =>
        executeAction(action, urgent),
    [executeAction],
  );

  // Transform core actions to input-specific semantic names
  return useMemo(
    () => ({
      // Primary semantic interface
      moveLeft: createValidatedAction(gamePlayActions.moveLeft),
      moveRight: createValidatedAction(gamePlayActions.moveRight),
      rotateClockwise: createValidatedAction(gamePlayActions.rotateClockwise),
      rotateCounterClockwise: createValidatedAction(gamePlayActions.rotateCounterClockwise),
      rotate180: createValidatedAction(gamePlayActions.rotate180),
      softDrop: createValidatedAction(gamePlayActions.softDrop),
      hardDrop: createValidatedAction(gamePlayActions.hardDrop, true), // urgent
      hold: createValidatedAction(gamePlayActions.holdPiece),
      pause: gamePlayActions.pauseGame, // Pause should work even when paused
      reset: showResetDialog,

      // Extended interface with aliases from useGameStoreActions
      moveDown: createValidatedAction(gamePlayActions.softDrop),
      rotate: createValidatedAction(gamePlayActions.rotateClockwise),
      drop: createValidatedAction(gamePlayActions.hardDrop, true), // urgent
      holdPiece: createValidatedAction(gamePlayActions.holdPiece),
      togglePause: gamePlayActions.pauseGame,
      resetGame: gamePlayActions.resetGame,
      showResetDialog,
      hideResetDialog,
      confirmReset,
      clearAnimationData,
    }),
    [
      gamePlayActions,
      showResetDialog,
      hideResetDialog,
      confirmReset,
      clearAnimationData,
      createValidatedAction,
    ],
  );
}
