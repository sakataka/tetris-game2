import type { GameEventPayload } from "@/shared/events/event-map";
import type {
  EventHandler,
  GameEventBus,
  GameEventType,
  UnsubscribeFn,
} from "@/shared/events/game-event-bus";
import { createGameEventBus } from "@/shared/events/game-event-bus";
import type { GameError } from "@/shared/types/errors";
import { GameErrors } from "@/shared/types/errors";
import type { Result } from "@/shared/types/result";
import { ResultUtils } from "@/shared/types/result";
import type { GameState, Position, Tetromino } from "@/types/game";
import type { GameEngine } from "./GameEngine";
import {
  createInitialGameState,
  hardDropTetromino,
  holdCurrentPiece,
  moveTetrominoBy,
  rotateTetromino180Degrees,
  rotateTetrominoCW,
} from "./game";

/**
 * Direction enum for movement operations
 */
export type Direction = "left" | "right" | "down";

/**
 * Rotation direction enum
 */
export type RotationDirection = "clockwise" | "counterclockwise" | "180";

/**
 * Drop type enum
 */
export type DropType = "soft" | "hard";

/**
 * Type-safe game events
 */
export interface GameEvents {
  "piece:moved": { direction: Direction; position: Position };
  "piece:rotated": { direction: RotationDirection; newRotation: number };
  "piece:locked": { position: Position; linesCleared: number };
  "game:over": { finalScore: number; totalLines: number };
  "game:started": { timestamp: number };
  "game:paused": { timestamp: number };
  "game:reset": { timestamp: number };
  "level:up": { newLevel: number; previousLevel: number };
  error: { error: GameError };
}

/**
 * Type-safe event emitter interface
 */
export interface TypedEventEmitter<TEvents> {
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
  on<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): UnsubscribeFn;
  once<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): UnsubscribeFn;
  off<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): void;
}

/**
 * Simplified game engine interface with clear separation of concerns
 */
export interface SimpleGameEngine {
  // Read-only state access
  readonly state: GameState;

  // Actions (with side effects)
  readonly actions: {
    move: (direction: Direction) => Result<void, GameError>;
    rotate: (direction: RotationDirection) => Result<void, GameError>;
    drop: (type: DropType) => Result<void, GameError>;
    hold: () => Result<void, GameError>;
    pause: () => void;
    reset: () => void;
    start: () => void;
  };

  // Type-safe event system
  readonly events: TypedEventEmitter<GameEvents>;
}

/**
 * Creates a type-safe event emitter using the game event bus
 */
function createTypedEventEmitter<TEvents>(eventBus: GameEventBus): TypedEventEmitter<TEvents> {
  return {
    emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
      // Convert to string for the event bus
      eventBus.emitSync(
        event as string as GameEventType,
        payload as GameEventPayload<GameEventType>,
      );
    },

    on<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): UnsubscribeFn {
      return eventBus.subscribe(
        event as string as GameEventType,
        handler as EventHandler<GameEventType>,
      );
    },

    once<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): UnsubscribeFn {
      return eventBus.once(
        event as string as GameEventType,
        handler as EventHandler<GameEventType>,
      );
    },

    off<K extends keyof TEvents>(_event: K, _handler: (payload: TEvents[K]) => void): void {
      // Note: The current event bus doesn't have a direct off method for specific handlers
      // This would need to be implemented if needed
      console.warn("TypedEventEmitter.off not fully implemented");
    },
  };
}

/**
 * Creates the new SimpleGameEngine with improved interface
 */
export function createNewSimpleGameEngine(initialState?: GameState): SimpleGameEngine {
  let gameState: GameState = initialState || createInitialGameState();
  const eventBus = createGameEventBus({ enableLogging: false });
  const typedEvents = createTypedEventEmitter<GameEvents>(eventBus);

  // Helper function to update state and emit events
  const updateState = (newState: GameState): void => {
    gameState = newState;
  };

  // Helper function to handle Result-based operations
  const handleResult = <T>(result: Result<T, GameError>): Result<void, GameError> => {
    if (!result.ok) {
      typedEvents.emit("error", { error: result.error });
      return result;
    }
    return ResultUtils.ok(undefined);
  };

  const engine = {
    // Read-only state access
    get state(): GameState {
      return gameState;
    },

    // Actions with side effects
    actions: {
      move: (direction: Direction): Result<void, GameError> => {
        const dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
        const dy = direction === "down" ? 1 : 0;

        const result = moveTetrominoBy(gameState, dx, dy);
        if (result.ok) {
          updateState(result.value);
          typedEvents.emit("piece:moved", {
            direction,
            position: result.value.currentPiece?.position || { x: 0, y: 0 },
          });

          // Check for game over after move
          if (result.value.isGameOver) {
            typedEvents.emit("game:over", {
              finalScore: result.value.score,
              totalLines: result.value.lines,
            });
          }
        }

        return handleResult(result);
      },

      rotate: (direction: RotationDirection): Result<void, GameError> => {
        let result: Result<GameState, GameError>;

        switch (direction) {
          case "clockwise":
            result = rotateTetrominoCW(gameState);
            break;
          case "counterclockwise":
            // Note: Using 180 rotation as counterclockwise for now
            result = rotateTetromino180Degrees(gameState);
            break;
          case "180":
            result = rotateTetromino180Degrees(gameState);
            break;
          default:
            return ResultUtils.err(
              GameErrors.invalidRotation(direction, `Unknown rotation direction: ${direction}`),
            );
        }

        if (result.ok) {
          updateState(result.value);
          typedEvents.emit("piece:rotated", {
            direction,
            newRotation: result.value.currentPiece?.rotation || 0,
          });
        }

        return handleResult(result);
      },

      drop: (type: DropType): Result<void, GameError> => {
        if (type === "soft") {
          return engine.actions.move("down");
        }
        if (type === "hard") {
          const newState = hardDropTetromino(gameState);
          updateState(newState);

          // Check for game over after hard drop
          if (newState.isGameOver) {
            typedEvents.emit("game:over", {
              finalScore: newState.score,
              totalLines: newState.lines,
            });
          }

          return ResultUtils.ok(undefined);
        }

        return ResultUtils.err(GameErrors.invalidState(`Unknown drop type: ${type}`));
      },

      hold: (): Result<void, GameError> => {
        const result = holdCurrentPiece(gameState);
        if (result.ok) {
          updateState(result.value);
        }

        return handleResult(result);
      },

      pause: (): void => {
        typedEvents.emit("game:paused", { timestamp: Date.now() });
      },

      reset: (): void => {
        gameState = createInitialGameState();
        typedEvents.emit("game:reset", { timestamp: Date.now() });
      },

      start: (): void => {
        gameState = createInitialGameState();
        typedEvents.emit("game:started", { timestamp: Date.now() });
      },
    },

    // Type-safe event system
    events: typedEvents,
  };

  return engine;
}

/**
 * Legacy GameEngine implementation for backward compatibility
 * Wraps the new SimpleGameEngine to maintain existing interface
 */
export function createLegacyGameEngine(initialState?: GameState): GameEngine {
  const simpleEngine = createNewSimpleGameEngine(initialState);

  return {
    startGame(): void {
      simpleEngine.actions.start();
    },

    pauseGame(): void {
      simpleEngine.actions.pause();
    },

    resetGame(): void {
      simpleEngine.actions.reset();
    },

    moveLeft(): boolean {
      const result = simpleEngine.actions.move("left");
      return result.ok;
    },

    moveRight(): boolean {
      const result = simpleEngine.actions.move("right");
      return result.ok;
    },

    softDrop(): boolean {
      const result = simpleEngine.actions.drop("soft");
      return result.ok;
    },

    hardDrop(): boolean {
      const result = simpleEngine.actions.drop("hard");
      return result.ok;
    },

    rotateClockwise(): boolean {
      const result = simpleEngine.actions.rotate("clockwise");
      return result.ok;
    },

    rotateCounterClockwise(): boolean {
      const result = simpleEngine.actions.rotate("counterclockwise");
      return result.ok;
    },

    holdPiece(): boolean {
      const result = simpleEngine.actions.hold();
      return result.ok;
    },

    getState(): GameState {
      return simpleEngine.state;
    },

    getBoard(): GameState["board"] {
      return simpleEngine.state.board;
    },

    getCurrentPiece(): Tetromino | null {
      return simpleEngine.state.currentPiece;
    },

    getGhostPiece(): Tetromino | null {
      return simpleEngine.state.ghostPiece;
    },

    on(event: string, callback: (data: unknown) => void): void {
      // Map legacy events to new typed events
      const eventMap: Record<string, keyof GameEvents> = {
        "game-started": "game:started",
        "game-paused": "game:paused",
        "game-reset": "game:reset",
        "game-over": "game:over",
        "piece-moved": "piece:moved",
        "piece-rotated": "piece:rotated",
        "piece-locked": "piece:locked",
        "level-up": "level:up",
      };

      const mappedEvent = eventMap[event];
      if (mappedEvent) {
        simpleEngine.events.on(
          mappedEvent as keyof GameEvents,
          callback as (payload: unknown) => void,
        );
      }
    },

    off(_event: string, _callback: (data: unknown) => void): void {
      // Legacy off implementation - simplified
      console.warn("Legacy off method called - not fully implemented");
    },
  };
}

// For backward compatibility, export the legacy version as the original function name
export { createLegacyGameEngine as createSimpleGameEngine };
