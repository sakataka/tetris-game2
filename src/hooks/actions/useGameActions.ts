import { useGameStoreActions } from "@/hooks/core/useGameStoreActions";

/**
 * Core game actions interface
 * Base actions available from the game store
 */
export interface GameActions {
  readonly moveLeft: () => void;
  readonly moveRight: () => void;
  readonly moveDown: () => void;
  readonly rotate: () => void;
  readonly rotate180: () => void;
  readonly drop: () => void;
  readonly holdPiece: () => void;
  readonly togglePause: () => void;
  readonly resetGame: () => void;
  readonly showResetDialog: () => void;
  readonly clearAnimationData: () => void;
}

/**
 * Core game action hooks
 * Provides direct access to all game store actions
 */
export const useGameActions = (): GameActions => useGameStoreActions();
