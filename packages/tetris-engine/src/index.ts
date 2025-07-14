/**
 * @tetris-game/engine - Pure TypeScript Tetris Game Engine
 *
 * High-performance BitBoard implementation with event-driven architecture
 * for framework-agnostic Tetris game development.
 */

// BitBoard operations
export {
  clearCell,
  clearLine,
  copyMatrix,
  createMatrix,
  isOccupied,
  isRowEmpty,
  isRowFull,
  matrixToString,
  setCell,
} from "./core/bitboard.js";
// Collision detection
export {
  checkCollision,
  findWallKick,
  validateMove,
} from "./core/collision.js";
// Game operations
export {
  calculateScore,
  canPlacePiece,
  clearLines,
  dropPiece,
  movePiece,
  rotatePiece,
} from "./core/operations.js";
// Event system
export { GameEventBus } from "./events/bus.js";
// Core types
export type {
  EngineConfig,
  EventHandler,
  GameEvent,
  GameState,
  LineClearResult,
  Matrix,
  MoveResult,
  Piece,
  PieceType,
  RotationState,
  UnsubscribeFunction,
  Vec2,
  WallKickData,
  WallKickOffset,
} from "./types.js";
// Core constants
export {
  MAX_ROWS,
  ROW_BITS,
  VISIBLE_COLS,
} from "./types.js";

// Note: GameEngine will be implemented later as it depends on all other modules
