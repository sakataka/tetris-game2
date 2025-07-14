import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/store/gameStore";
import type { GameState, Piece } from "@/types/game";

export interface UseGamePlayReturn {
  // Core game state
  board: GameState["board"];
  currentPiece: Piece | null;
  ghostPiece: Piece | null;
  nextPieces: string[];
  heldPiece: string | null;
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
  animationState: GameState["animationState"];
  lineClearData: GameState["lineClearData"];

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
  const gameState = useGameStore(
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

  // Individual primitive selectors for actions (better performance)
  const actions = useGameStore(
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

  return {
    ...gameState,
    ...actions,
  };
};

/**
 * Hook for game play state only (read-only)
 * Use this when you only need to read state without actions
 */
export const useGamePlayState = () => {
  return useGameStore(
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
  return useGameStore(
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
};
