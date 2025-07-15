/**
 * Central Event Map for Type-Safe Event Handling
 * Defines all possible events and their payload types
 */

import type { AdvancedAIDecision } from "@/game/ai/core/advanced-ai-engine";
import type { AIDecision } from "@/game/ai/core/ai-engine";
import type {
  GameBoard,
  GameState,
  LineClearAnimationData,
  Position,
  Tetromino,
} from "@/types/game";

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

  // AI Events
  AI_DECISION: {
    decision: AdvancedAIDecision | AIDecision;
    thinkingTime: number;
  };
  AI_THINKING_START: { requestId?: string };
  AI_THINKING_END: { requestId?: string; thinkingTime: number };
  AI_ERROR: { error: string; requestId?: string };
  AI_MOVE_CALCULATED: {
    result: AdvancedAIDecision | AIDecision;
    responseTime: number;
    source: string;
  };
  AI_MOVE_REQUESTED: { gameState: GameState };
  AI_DIFFICULTY_CHANGED: { difficulty: "easy" | "medium" | "hard" | "expert" };
  WORKER_INITIALIZED: {
    version: string;
    capabilities: string[];
  };

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
