import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { gameEventBus } from "@/shared/events/game-event-bus";
import type {
  GameAnimationState,
  GameBoard,
  LineClearAnimationData,
  Tetromino,
  TetrominoTypeName,
} from "@/types/game";
import { useGamePlayStore } from "../model/gamePlaySlice";

export interface UseGamePlayReturn {
  // Core game state
  board: GameBoard;
  currentPiece: Tetromino | null;
  ghostPiece: Tetromino | null;
  nextPieces: TetrominoTypeName[];
  heldPiece: TetrominoTypeName | null;
  canHold: boolean;

  // Game status
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;

  // Timing information
  lastFall: number;
  fallSpeed: number;
  lockDelay: number;
  lockDelayActive: boolean;

  // Animation state
  animationState: GameAnimationState;
  lineClearData: LineClearAnimationData | null;

  // Actions
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;

  // Movement actions
  moveLeft: () => void;
  moveRight: () => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  holdPiece: () => void;
}

export const useGamePlay = (): UseGamePlayReturn => {
  // Use shallow comparison for object selectors to prevent unnecessary re-renders
  const gameState = useGamePlayStore(
    useShallow((state) => ({
      board: state.board,
      currentPiece: state.currentPiece,
      ghostPiece: state.ghostPiece,
      nextPieces: state.nextPieces,
      heldPiece: state.heldPiece,
      canHold: state.canHold,
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      isGameOver: state.isGameOver,
      lastFall: state.lastFall,
      fallSpeed: state.fallSpeed,
      lockDelay: state.lockDelay,
      lockDelayActive: state.lockDelayActive,
      animationState: state.animationState,
      lineClearData: state.lineClearData,
    })),
  );

  // Get actions from store
  const storeActions = useGamePlayStore(
    useShallow((state) => ({
      startGame: state.startGame,
      pauseGame: state.pauseGame,
      resetGame: state.resetGame,
      moveLeft: state.moveLeft,
      moveRight: state.moveRight,
      rotateClockwise: state.rotateClockwise,
      rotateCounterClockwise: state.rotateCounterClockwise,
      softDrop: state.softDrop,
      hardDrop: state.hardDrop,
      holdPiece: state.holdPiece,
    })),
  );

  // Wrap movement actions to emit events
  const moveLeft = useCallback(() => {
    gameEventBus.emitSync({ type: "MOVE_LEFT", payload: {} });
    storeActions.moveLeft();
  }, [storeActions]);

  const moveRight = useCallback(() => {
    gameEventBus.emitSync({ type: "MOVE_RIGHT", payload: {} });
    storeActions.moveRight();
  }, [storeActions]);

  const rotateClockwise = useCallback(() => {
    gameEventBus.emitSync({ type: "ROTATE_CLOCKWISE", payload: {} });
    storeActions.rotateClockwise();
  }, [storeActions]);

  const rotateCounterClockwise = useCallback(() => {
    gameEventBus.emitSync({ type: "ROTATE_COUNTER_CLOCKWISE", payload: {} });
    storeActions.rotateCounterClockwise();
  }, [storeActions]);

  const softDrop = useCallback(() => {
    gameEventBus.emitSync({ type: "SOFT_DROP", payload: {} });
    storeActions.softDrop();
  }, [storeActions]);

  const hardDrop = useCallback(() => {
    gameEventBus.emitSync({ type: "HARD_DROP", payload: {} });
    storeActions.hardDrop();
  }, [storeActions]);

  const holdPiece = useCallback(() => {
    gameEventBus.emitSync({ type: "HOLD_PIECE", payload: {} });
    storeActions.holdPiece();
  }, [storeActions]);

  // Wrap game control actions to emit events
  const startGame = useCallback(() => {
    gameEventBus.emitSync({ type: "GAME_STARTED", payload: {} });
    storeActions.startGame();
  }, [storeActions]);

  const pauseGame = useCallback(() => {
    const isPaused = !gameState.isPaused;
    gameEventBus.emitSync({ type: "GAME_PAUSED", payload: { isPaused } });
    storeActions.pauseGame();
  }, [gameState.isPaused, storeActions]);

  const resetGame = useCallback(() => {
    gameEventBus.emitSync({ type: "GAME_RESET", payload: {} });
    storeActions.resetGame();
  }, [storeActions]);

  return {
    ...gameState,
    startGame,
    pauseGame,
    resetGame,
    moveLeft,
    moveRight,
    rotateClockwise,
    rotateCounterClockwise,
    softDrop,
    hardDrop,
    holdPiece,
  };
};

/**
 * Hook for game play state only (read-only)
 * Use this when you only need to read state without actions
 */
export const useGamePlayState = () => {
  return useGamePlayStore(
    useShallow((state) => ({
      board: state.board,
      currentPiece: state.currentPiece,
      ghostPiece: state.ghostPiece,
      nextPieces: state.nextPieces,
      heldPiece: state.heldPiece,
      canHold: state.canHold,
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      isGameOver: state.isGameOver,
      animationState: state.animationState,
      lineClearData: state.lineClearData,
    })),
  );
};

/**
 * Hook for game play actions only
 * Use this when you only need actions without state
 */
export const useGamePlayActions = () => {
  const storeActions = useGamePlayStore(
    useShallow((state) => ({
      startGame: state.startGame,
      pauseGame: state.pauseGame,
      resetGame: state.resetGame,
      moveLeft: state.moveLeft,
      moveRight: state.moveRight,
      rotateClockwise: state.rotateClockwise,
      rotateCounterClockwise: state.rotateCounterClockwise,
      softDrop: state.softDrop,
      hardDrop: state.hardDrop,
      holdPiece: state.holdPiece,
    })),
  );

  // Return wrapped actions that emit events
  return {
    startGame: useCallback(() => {
      gameEventBus.emitSync({ type: "GAME_STARTED", payload: {} });
      storeActions.startGame();
    }, [storeActions]),
    pauseGame: useCallback(() => {
      gameEventBus.emitSync({ type: "GAME_PAUSED", payload: { isPaused: true } });
      storeActions.pauseGame();
    }, [storeActions]),
    resetGame: useCallback(() => {
      gameEventBus.emitSync({ type: "GAME_RESET", payload: {} });
      storeActions.resetGame();
    }, [storeActions]),
    moveLeft: useCallback(() => {
      gameEventBus.emitSync({ type: "MOVE_LEFT", payload: {} });
      storeActions.moveLeft();
    }, [storeActions]),
    moveRight: useCallback(() => {
      gameEventBus.emitSync({ type: "MOVE_RIGHT", payload: {} });
      storeActions.moveRight();
    }, [storeActions]),
    rotateClockwise: useCallback(() => {
      gameEventBus.emitSync({ type: "ROTATE_CLOCKWISE", payload: {} });
      storeActions.rotateClockwise();
    }, [storeActions]),
    rotateCounterClockwise: useCallback(() => {
      gameEventBus.emitSync({ type: "ROTATE_COUNTER_CLOCKWISE", payload: {} });
      storeActions.rotateCounterClockwise();
    }, [storeActions]),
    softDrop: useCallback(() => {
      gameEventBus.emitSync({ type: "SOFT_DROP", payload: {} });
      storeActions.softDrop();
    }, [storeActions]),
    hardDrop: useCallback(() => {
      gameEventBus.emitSync({ type: "HARD_DROP", payload: {} });
      storeActions.hardDrop();
    }, [storeActions]),
    holdPiece: useCallback(() => {
      gameEventBus.emitSync({ type: "HOLD_PIECE", payload: {} });
      storeActions.holdPiece();
    }, [storeActions]),
  };
};
