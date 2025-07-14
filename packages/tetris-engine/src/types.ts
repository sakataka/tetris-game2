/**
 * Core type definitions for Tetris Game Engine
 */

/** Performance optimization constants */
export const ROW_BITS = 16; // Future extensibility constant
export const VISIBLE_COLS = 10; // Standard Tetris board width
export const MAX_ROWS = 24; // 20 visible + 4 buffer rows

/** Position vector */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** Tetromino piece types */
export type PieceType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

/** Rotation states (0-3) */
export type RotationState = 0 | 1 | 2 | 3;

/** Game board representation using Uint32Array */
export type Matrix = Uint32Array;

/** Piece definition */
export interface Piece {
  readonly type: PieceType;
  readonly position: Vec2;
  readonly rotation: RotationState;
  readonly shape: readonly boolean[][];
}

/** Game state snapshot */
export interface GameState {
  readonly board: Matrix;
  readonly currentPiece: Piece | null;
  readonly nextPieces: readonly PieceType[];
  readonly heldPiece: PieceType | null;
  readonly canHold: boolean;
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly gameOver: boolean;
  readonly paused: boolean;
}

/** Game event types */
export type GameEvent =
  | {
      type: "LINE_CLEARED";
      payload: { lines: number; positions: readonly number[]; score: number };
      timestamp?: number;
    }
  | {
      type: "PIECE_PLACED";
      payload: { piece: PieceType; position: Vec2; rotation: RotationState };
      timestamp?: number;
    }
  | { type: "HARD_DROP"; payload: { distance: number; score: number }; timestamp?: number }
  | {
      type: "T_SPIN";
      payload: { type: "single" | "double" | "triple"; corners: number };
      timestamp?: number;
    }
  | {
      type: "PIECE_HELD";
      payload: { piece: PieceType; previousHeld: PieceType | null };
      timestamp?: number;
    }
  | { type: "GAME_OVER"; payload: { finalScore: number; totalLines: number }; timestamp?: number }
  | { type: "LEVEL_UP"; payload: { level: number; lines: number }; timestamp?: number };

/** Event handler function type */
export type EventHandler<T extends GameEvent> = (event: T) => void;

/** Unsubscribe function type */
export type UnsubscribeFunction = () => void;

/** Engine configuration */
export interface EngineConfig {
  /** Random seed for reproducible gameplay */
  readonly randomSeed?: number;
  /** Enable performance monitoring */
  readonly enablePerformanceMonitoring?: boolean;
  /** Maximum evaluation time in microseconds */
  readonly maxEvaluationTime?: number;
}

/** Move validation result */
export interface MoveResult {
  readonly valid: boolean;
  readonly newPosition?: Vec2;
  readonly newRotation?: RotationState;
  readonly wallKickUsed?: boolean;
}

/** Line clear result */
export interface LineClearResult {
  readonly clearedLines: readonly number[];
  readonly newBoard: Matrix;
  readonly score: number;
  readonly isTSpin: boolean;
}

/** SRS wall kick offset */
export interface WallKickOffset {
  readonly x: number;
  readonly y: number;
}

/** SRS wall kick data */
export interface WallKickData {
  readonly [key: string]: readonly WallKickOffset[];
}
