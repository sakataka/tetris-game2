/**
 * Central Event Map for Type-Safe Event Handling
 * Defines all possible events and their payload types
 */

// Simplified AI types
import type { GameBoard, LineClearAnimationData, Position, Tetromino } from "@/types/game";

export interface GameEventMap {
  // Game Control Events
  GAME_STARTED: undefined;
  GAME_PAUSED: { isPaused: boolean };
  GAME_RESET: undefined;
  GAME_OVER: { finalScore: number; level: number };

  // Movement Events
  MOVE_LEFT: undefined;
  MOVE_RIGHT: undefined;
  SOFT_DROP: undefined;
  HARD_DROP: { distance: number };
  ROTATE_CLOCKWISE: undefined;
  ROTATE_COUNTER_CLOCKWISE: undefined;
  ROTATE_180: undefined;
  HOLD_PIECE: undefined;

  // Game State Events
  PIECE_PLACED: {
    piece: Tetromino;
    position: Position;
    board: GameBoard;
  };
  LINE_CLEARED: {
    lines: number[];
    score: number;
    animationData: LineClearAnimationData;
  };
  LEVEL_UP: {
    newLevel: number;
    oldLevel: number;
  };

  // Simple AI Events
  AI_DECISION: {
    decision: { x: number; y: number; rotation: number } | null;
    thinkingTime: number;
  };
  AI_ENABLED: { enabled: boolean };
  AI_ERROR: { error: string };

  // Animation Events
  ANIMATION_START: { type: string; duration: number };
  ANIMATION_END: { type: string };
  TETRIS_FLASH: { lines: number[] };

  // Score Events
  SCORE_UPDATE: {
    score: number;
    delta: number;
    reason: string;
  };
  COMBO_UPDATE: {
    count: number;
    isActive: boolean;
  };

  // Settings Events
  SETTINGS_CHANGED: {
    key: string;
    value: unknown;
  };

  // Performance Events
  PERFORMANCE_SAMPLE: {
    frameTime: number;
    fps: number;
    memoryUsage?: number;
  };
}

export type GameEventType = keyof GameEventMap;
export type GameEventPayload<T extends GameEventType> = GameEventMap[T];
