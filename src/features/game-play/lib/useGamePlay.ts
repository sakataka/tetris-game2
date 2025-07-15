import { useCallback } from "react";
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
  rotate180: () => void;
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
      rotate180: state.rotate180,
      softDrop: state.softDrop,
      hardDrop: state.hardDrop,
      holdPiece: state.holdPiece,
    })),
  );

  // Wrap movement actions to emit events
  const moveLeft = useCallback(() => {
    gameEventBus.emitSync("MOVE_LEFT", undefined);
    storeActions.moveLeft();
  }, [storeActions]);

  const moveRight = useCallback(() => {
    gameEventBus.emitSync("MOVE_RIGHT", undefined);
    storeActions.moveRight();
  }, [storeActions]);

  const rotateClockwise = useCallback(() => {
    gameEventBus.emitSync("ROTATE_CLOCKWISE", undefined);
    storeActions.rotateClockwise();
  }, [storeActions]);

  const rotateCounterClockwise = useCallback(() => {
    gameEventBus.emitSync("ROTATE_COUNTER_CLOCKWISE", undefined);
    storeActions.rotateCounterClockwise();
  }, [storeActions]);

  const rotate180 = useCallback(() => {
    gameEventBus.emitSync("ROTATE_180", undefined);
    storeActions.rotate180();
  }, [storeActions]);

  const softDrop = useCallback(() => {
    gameEventBus.emitSync("SOFT_DROP", undefined);
    storeActions.softDrop();
  }, [storeActions]);

  const hardDrop = useCallback(() => {
    gameEventBus.emitSync("HARD_DROP", { distance: 0 });
    storeActions.hardDrop();
  }, [storeActions]);

  const holdPiece = useCallback(() => {
    gameEventBus.emitSync("HOLD_PIECE", undefined);
    storeActions.holdPiece();
  }, [storeActions]);

  // Wrap game control actions to emit events
  const startGame = useCallback(() => {
    gameEventBus.emitSync("GAME_STARTED", undefined);
    storeActions.startGame();
  }, [storeActions]);

  const pauseGame = useCallback(() => {
    const isPaused = !gameState.isPaused;
    gameEventBus.emitSync("GAME_PAUSED", { isPaused });
    storeActions.pauseGame();
  }, [gameState.isPaused, storeActions]);

  const resetGame = useCallback(() => {
    gameEventBus.emitSync("GAME_RESET", undefined);
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
    rotate180,
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
      rotate180: state.rotate180,
      softDrop: state.softDrop,
      hardDrop: state.hardDrop,
      holdPiece: state.holdPiece,
    })),
  );

  // Return wrapped actions that emit events
  return {
    startGame: useCallback(() => {
      gameEventBus.emitSync("GAME_STARTED", undefined);
      storeActions.startGame();
    }, [storeActions]),
    pauseGame: useCallback(() => {
      gameEventBus.emitSync("GAME_PAUSED", { isPaused: true });
      storeActions.pauseGame();
    }, [storeActions]),
    resetGame: useCallback(() => {
      gameEventBus.emitSync("GAME_RESET", undefined);
      storeActions.resetGame();
    }, [storeActions]),
    moveLeft: useCallback(() => {
      gameEventBus.emitSync("MOVE_LEFT", undefined);
      storeActions.moveLeft();
    }, [storeActions]),
    moveRight: useCallback(() => {
      gameEventBus.emitSync("MOVE_RIGHT", undefined);
      storeActions.moveRight();
    }, [storeActions]),
    rotateClockwise: useCallback(() => {
      gameEventBus.emitSync("ROTATE_CLOCKWISE", undefined);
      storeActions.rotateClockwise();
    }, [storeActions]),
    rotateCounterClockwise: useCallback(() => {
      gameEventBus.emitSync("ROTATE_COUNTER_CLOCKWISE", undefined);
      storeActions.rotateCounterClockwise();
    }, [storeActions]),
    rotate180: useCallback(() => {
      gameEventBus.emitSync("ROTATE_180", undefined);
      storeActions.rotate180();
    }, [storeActions]),
    softDrop: useCallback(() => {
      gameEventBus.emitSync("SOFT_DROP", undefined);
      storeActions.softDrop();
    }, [storeActions]),
    hardDrop: useCallback(() => {
      gameEventBus.emitSync("HARD_DROP", { distance: 0 });
      storeActions.hardDrop();
    }, [storeActions]),
    holdPiece: useCallback(() => {
      gameEventBus.emitSync("HOLD_PIECE", undefined);
      storeActions.holdPiece();
    }, [storeActions]),
  };
};
