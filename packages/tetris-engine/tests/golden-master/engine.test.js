import { describe, expect, it } from "vitest";
import {
  clearLines,
  createMatrix,
  findFullRows,
  matrixToString,
  setCell,
} from "../../src/core/bitboard.js";
import { checkCollision, validateRotation } from "../../src/core/collision.js";
import {
  calculateScore,
  createPiece,
  dropPiece,
  hardDropPiece,
  movePiece,
  placePieceOnBoard,
} from "../../src/core/operations.js";
import { getTetrominoShape } from "../../src/core/tetrominos.js";
import { GameEventBus } from "../../src/events/bus.js";

/**
 * Simple Linear Congruential Generator for reproducible randomness
 */
class SeededRandom {
  seed;
  constructor(seed) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 1103515245 + 12345) % 2 ** 31;
    return this.seed / 2 ** 31;
  }
  nextInt(max) {
    return Math.floor(this.next() * max);
  }
}
/**
 * Simple 7-bag system for piece generation
 */
class PieceBag {
  pieces = [];
  random;
  constructor(seed) {
    this.random = new SeededRandom(seed);
    this.refill();
  }
  refill() {
    const allPieces = ["I", "J", "L", "O", "S", "T", "Z"];
    this.pieces = [...allPieces];
    // Fisher-Yates shuffle with seeded random
    for (let i = this.pieces.length - 1; i > 0; i--) {
      const j = this.random.nextInt(i + 1);
      [this.pieces[i], this.pieces[j]] = [this.pieces[j], this.pieces[i]];
    }
  }
  getNext() {
    if (this.pieces.length === 0) {
      this.refill();
    }
    const piece = this.pieces.pop();
    if (!piece) {
      throw new Error("No piece available after refill");
    }
    return piece;
  }
  peek(count) {
    const result = [];
    const tempPieces = [...this.pieces];
    const tempRandom = new SeededRandom(this.random.seed);
    for (let i = 0; i < count; i++) {
      if (tempPieces.length === 0) {
        // Simulate refill
        const allPieces = ["I", "J", "L", "O", "S", "T", "Z"];
        tempPieces.push(...allPieces);
        // Fisher-Yates shuffle
        for (let j = tempPieces.length - 1; j > 0; j--) {
          const k = tempRandom.nextInt(j + 1);
          [tempPieces[j], tempPieces[k]] = [tempPieces[k], tempPieces[j]];
        }
      }
      const piece = tempPieces.pop();
      if (!piece) {
        throw new Error("No piece available in temp pieces");
      }
      result.push(piece);
    }
    return result;
  }
}
/**
 * Simple game engine for testing
 */
class TestGameEngine {
  matrix;
  currentPiece = null;
  nextPieces = [];
  heldPiece = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  pieceBag;
  eventBus;
  constructor(seed) {
    this.matrix = createMatrix();
    this.pieceBag = new PieceBag(seed);
    this.eventBus = new GameEventBus();
    this.spawnNextPiece();
  }
  spawnNextPiece() {
    const pieceType = this.pieceBag.getNext();
    this.currentPiece = createPiece(pieceType);
    this.nextPieces = this.pieceBag.peek(5);
    this.canHold = true;
    if (this.currentPiece && checkCollision(this.matrix, this.currentPiece)) {
      this.gameOver = true;
      this.eventBus.emit({
        type: "GAME_OVER",
        payload: { finalScore: this.score, totalLines: this.lines },
      });
    }
  }
  tick() {
    if (this.gameOver || !this.currentPiece) return;
    // Try to drop piece
    const droppedPiece = dropPiece(this.matrix, this.currentPiece);
    if (droppedPiece) {
      this.currentPiece = droppedPiece;
    } else {
      // Piece landed, place it
      this.placePiece();
    }
  }
  placePiece() {
    if (!this.currentPiece) return;
    // Place piece on board
    this.matrix = placePieceOnBoard(this.matrix, this.currentPiece);
    this.eventBus.emit({
      type: "PIECE_PLACED",
      payload: {
        piece: this.currentPiece.type,
        position: this.currentPiece.position,
        rotation: this.currentPiece.rotation,
      },
    });
    // Check for line clears
    this.checkLineClear();
    // Spawn next piece
    this.spawnNextPiece();
  }
  checkLineClear() {
    const fullRows = findFullRows(this.matrix);
    if (fullRows.length > 0) {
      this.matrix = clearLines(this.matrix, fullRows).newBoard;
      const lineScore = calculateScore(fullRows.length, this.level);
      this.score += lineScore;
      this.lines += fullRows.length;
      // Level up every 10 lines
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.eventBus.emit({
          type: "LEVEL_UP",
          payload: { level: this.level, lines: this.lines },
        });
      }
      this.eventBus.emit({
        type: "LINE_CLEARED",
        payload: { lines: fullRows.length, positions: fullRows, score: lineScore },
      });
    }
  }
  moveLeft() {
    if (!this.currentPiece) return false;
    const movedPiece = movePiece(this.matrix, this.currentPiece, -1);
    if (movedPiece) {
      this.currentPiece = movedPiece;
      return true;
    }
    return false;
  }
  moveRight() {
    if (!this.currentPiece) return false;
    const movedPiece = movePiece(this.matrix, this.currentPiece, 1);
    if (movedPiece) {
      this.currentPiece = movedPiece;
      return true;
    }
    return false;
  }
  rotate() {
    if (!this.currentPiece) return false;
    const rotationResult = validateRotation(this.matrix, this.currentPiece, true);
    if (
      rotationResult.valid &&
      rotationResult.newPosition &&
      rotationResult.newRotation !== undefined
    ) {
      this.currentPiece = {
        ...this.currentPiece,
        position: rotationResult.newPosition,
        rotation: rotationResult.newRotation,
        shape: getTetrominoShape(this.currentPiece.type, rotationResult.newRotation),
      };
      return true;
    }
    return false;
  }
  hardDrop() {
    if (!this.currentPiece) return;
    const result = hardDropPiece(this.matrix, this.currentPiece);
    this.currentPiece = result.piece;
    this.score += result.distance * 2;
    this.eventBus.emit({
      type: "HARD_DROP",
      payload: { distance: result.distance, score: result.distance * 2 },
    });
    this.placePiece();
  }
  hold() {
    if (!this.currentPiece || !this.canHold) return false;
    const currentType = this.currentPiece.type;
    const previousHeld = this.heldPiece;
    this.heldPiece = currentType;
    this.canHold = false;
    if (previousHeld) {
      this.currentPiece = createPiece(previousHeld);
    } else {
      this.spawnNextPiece();
    }
    this.eventBus.emit({
      type: "PIECE_HELD",
      payload: { piece: currentType, previousHeld },
    });
    return true;
  }
  getState() {
    return {
      matrix: this.matrix,
      currentPiece: this.currentPiece,
      nextPieces: this.nextPieces,
      heldPiece: this.heldPiece,
      canHold: this.canHold,
      score: this.score,
      lines: this.lines,
      level: this.level,
      gameOver: this.gameOver,
    };
  }
  getMatrixString() {
    return matrixToString(this.matrix);
  }
  getEventBus() {
    return this.eventBus;
  }
}
describe("Game Engine Golden Master Tests", () => {
  it("should produce identical game sequences for seed 12345", () => {
    const engine = new TestGameEngine(12345);
    const frames = [];
    const events = [];
    // Collect all events
    engine.getEventBus().subscribe("LINE_CLEARED", (event) => events.push(event));
    engine.getEventBus().subscribe("PIECE_PLACED", (event) => events.push(event));
    engine.getEventBus().subscribe("HARD_DROP", (event) => events.push(event));
    engine.getEventBus().subscribe("GAME_OVER", (event) => events.push(event));
    engine.getEventBus().subscribe("LEVEL_UP", (event) => events.push(event));
    // Simulate controlled gameplay
    for (let frame = 0; frame < 100; frame++) {
      const state = engine.getState();
      // Simple AI: move pieces around and drop them
      if (state.currentPiece && !state.gameOver) {
        // Move left/right based on frame number
        if (frame % 4 === 0) {
          engine.moveLeft();
        } else if (frame % 4 === 1) {
          engine.moveRight();
        } else if (frame % 4 === 2) {
          engine.rotate();
        }
        // Hard drop every 10 frames
        if (frame % 10 === 9) {
          engine.hardDrop();
        } else {
          engine.tick();
        }
      }
      // Record state
      frames.push(
        JSON.stringify({
          frame,
          matrix: Array.from(state.matrix),
          currentPiece: state.currentPiece,
          nextPieces: state.nextPieces,
          score: state.score,
          lines: state.lines,
          level: state.level,
          gameOver: state.gameOver,
        }),
      );
      if (state.gameOver) break;
    }
    // This will create a snapshot on first run
    expect(frames).toMatchSnapshot("game-sequence-seed-12345.snap");
    expect(events.map((e) => ({ type: e.type, payload: e.payload }))).toMatchSnapshot(
      "game-events-seed-12345.snap",
    );
  });
  it("should produce identical game sequences for seed 54321", () => {
    const engine = new TestGameEngine(54321);
    const frames = [];
    // Different gameplay pattern
    for (let frame = 0; frame < 50; frame++) {
      const state = engine.getState();
      if (state.currentPiece && !state.gameOver) {
        // More aggressive gameplay
        if (frame % 3 === 0) {
          engine.rotate();
        } else if (frame % 3 === 1) {
          engine.moveLeft();
        } else {
          engine.moveRight();
        }
        // Hard drop every 5 frames
        if (frame % 5 === 4) {
          engine.hardDrop();
        } else {
          engine.tick();
        }
      }
      frames.push(
        JSON.stringify({
          frame,
          matrix: Array.from(state.matrix),
          score: state.score,
          lines: state.lines,
          gameOver: state.gameOver,
        }),
      );
      if (state.gameOver) break;
    }
    expect(frames).toMatchSnapshot("game-sequence-seed-54321.snap");
  });
  it("should handle hold mechanic consistently", () => {
    const engine = new TestGameEngine(99999);
    const actions = [];
    for (let frame = 0; frame < 30; frame++) {
      const state = engine.getState();
      if (state.currentPiece && !state.gameOver) {
        // Use hold every 7 frames
        if (frame % 7 === 0 && state.canHold) {
          engine.hold();
          actions.push(`Frame ${frame}: Hold ${state.currentPiece.type}`);
        } else if (frame % 3 === 0) {
          engine.hardDrop();
          actions.push(`Frame ${frame}: Hard drop`);
        } else {
          engine.tick();
          actions.push(`Frame ${frame}: Tick`);
        }
      }
      if (state.gameOver) break;
    }
    expect(actions).toMatchSnapshot("hold-mechanic-seed-99999.snap");
  });
  it("should handle line clearing consistently", () => {
    const engine = new TestGameEngine(77777);
    const lineClears = [];
    engine.getEventBus().subscribe("LINE_CLEARED", (event) => {
      lineClears.push({
        frame: lineClears.length,
        lines: event.payload.lines,
        score: event.payload.score,
      });
    });
    // Force line clears by filling bottom rows
    let matrix = engine.getState().matrix;
    // Fill bottom 4 rows with gaps
    for (let row = 20; row < 24; row++) {
      for (let col = 0; col < 9; col++) {
        // Leave gap in last column
        matrix = setCell(matrix, row, col);
      }
    }
    // Play until we get some line clears
    for (let frame = 0; frame < 100; frame++) {
      const state = engine.getState();
      if (state.currentPiece && !state.gameOver) {
        // Try to fill the gaps
        if (frame % 5 === 0) {
          engine.moveRight();
        } else if (frame % 5 === 1) {
          engine.rotate();
        } else {
          engine.tick();
        }
        if (frame % 10 === 9) {
          engine.hardDrop();
        }
      }
      if (state.gameOver || lineClears.length > 5) break;
    }
    expect(lineClears).toMatchSnapshot("line-clears-seed-77777.snap");
  });
});
//# sourceMappingURL=engine.test.js.map
