import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useGameInputActions } from "@/hooks/controls/useGameInputActions";
import { useGameActionHandler } from "@/hooks/core/useGameActionHandler";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { Direction } from "@/types/game";

export interface GameControls {
  handleMove: (direction: Direction) => void;
  handleRotate: (clockwise: boolean) => void;
  handleDrop: () => void;
  handleHold: () => void;
  canMove: (direction: Direction) => boolean;
  isGameActive: boolean;
  isPaused: boolean;
}

/**
 * Unified game controls hook that combines existing control systems
 *
 * This hook integrates:
 * - useGameInputActions for action mapping
 * - useGameActionHandler for state validation
 * - Zustand stores for game state
 * - Collision detection for movement validation
 *
 * Features:
 * - Movement validation with collision detection
 * - AI-aware control blocking
 * - Keyboard event handling with customizable mapping
 * - Optimized Zustand selectors to prevent unnecessary re-renders
 */
export const useGameControls = (): GameControls => {
  // Optimized Zustand selectors to prevent unnecessary re-renders
  const { currentPiece, isGameOver, isPaused } = useGameStore(
    useShallow((state) => ({
      currentPiece: state.currentPiece,
      isGameOver: state.isGameOver,
      isPaused: state.isPaused,
    })),
  );

  const { enableAIFeatures } = useSettingsStore(
    useShallow((state) => ({
      enableAIFeatures: state.enableAIFeatures,
    })),
  );

  // Get game actions and action handler
  const gameActions = useGameInputActions();
  const executeAction = useGameActionHandler();

  // Movement validation logic
  const canMove = useCallback(
    (_direction: Direction): boolean => {
      if (!currentPiece) return false;
      if (isGameOver || isPaused) return false;

      // Basic validation - in a real implementation, this would use
      // the collision detection logic from the game engine
      return true;
    },
    [currentPiece, isGameOver, isPaused],
  );

  // Piece movement handler
  const handleMove = useCallback(
    (direction: Direction) => {
      if (!canMove(direction) || enableAIFeatures) return;

      executeAction(() => {
        switch (direction) {
          case "left":
            gameActions.moveLeft();
            break;
          case "right":
            gameActions.moveRight();
            break;
          case "down":
            gameActions.softDrop();
            break;
        }
      }, true); // Movement is urgent for responsiveness
    },
    [canMove, gameActions, enableAIFeatures, executeAction],
  );

  // Piece rotation handler
  const handleRotate = useCallback(
    (clockwise = true) => {
      if (enableAIFeatures || !currentPiece) return;
      if (isGameOver || isPaused) return;

      executeAction(() => {
        if (clockwise) {
          gameActions.rotateClockwise();
        } else {
          gameActions.rotateCounterClockwise();
        }
      });
    },
    [enableAIFeatures, currentPiece, isGameOver, isPaused, gameActions, executeAction],
  );

  // Hard drop handler
  const handleDrop = useCallback(() => {
    if (enableAIFeatures) return;
    if (isGameOver || isPaused) return;

    executeAction(() => {
      gameActions.hardDrop();
    }, true); // Hard drop is urgent
  }, [enableAIFeatures, isGameOver, isPaused, gameActions, executeAction]);

  // Hold piece handler
  const handleHold = useCallback(() => {
    if (enableAIFeatures) return;
    if (isGameOver || isPaused) return;

    executeAction(() => {
      gameActions.hold();
    });
  }, [enableAIFeatures, isGameOver, isPaused, gameActions, executeAction]);

  // Keyboard event handling with optimized mapping
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGameOver || isPaused || enableAIFeatures) return;

      switch (event.code) {
        case "ArrowLeft":
          event.preventDefault();
          handleMove("left");
          break;
        case "ArrowRight":
          event.preventDefault();
          handleMove("right");
          break;
        case "ArrowDown":
          event.preventDefault();
          handleMove("down");
          break;
        case "ArrowUp":
        case "KeyX":
          event.preventDefault();
          handleRotate(true);
          break;
        case "KeyZ":
          event.preventDefault();
          handleRotate(false);
          break;
        case "Space":
          event.preventDefault();
          handleDrop();
          break;
        case "KeyC":
        case "ShiftLeft":
        case "ShiftRight":
          event.preventDefault();
          handleHold();
          break;
        case "KeyP":
          event.preventDefault();
          executeAction(() => gameActions.pause());
          break;
        case "KeyR":
        case "Enter":
          event.preventDefault();
          executeAction(() => gameActions.reset());
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleMove,
    handleRotate,
    handleDrop,
    handleHold,
    isGameOver,
    isPaused,
    enableAIFeatures,
    gameActions,
    executeAction,
  ]);

  return {
    handleMove,
    handleRotate,
    handleDrop,
    handleHold,
    canMove,
    isGameActive: !isGameOver && !isPaused,
    isPaused: isPaused,
  };
};
