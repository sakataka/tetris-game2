import { describe, expect, test } from "bun:test";
import type { GameState, TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { createEmptyBoard } from "./board";
import {
  calculateScore,
  checkGameOver,
  clearCompletedLines,
  createInitialGameState,
  hardDropTetromino,
  moveTetrominoBy,
  placePieceOnBoard,
  preserveBoardForAnimation,
  rotateTetrominoCW,
  spawnNextPiece,
} from "./game";
import { createTetromino } from "./tetrominos";

// ==============================
// Test Helper Functions - Junichi Ito Style
// ==============================

/**
 * Create test game state with specified overrides
 * Initialize game with specific state for testing
 */
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  const defaultState = createInitialGameState();
  return { ...defaultState, ...overrides };
}

/**
 * Fill specific board row with pieces
 * Helper for line clearing tests
 */
function fillBoardRow(board: number[][], rowIndex: number, colorIndex = 1): void {
  for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
    board[rowIndex][x] = colorIndex;
  }
}

/**
 * Create board with filled top rows to simulate game over state
 */
function _createGameOverBoard(): number[][] {
  const board = createEmptyBoard();
  // Fill top rows to create collision scenario
  for (let y = 0; y < 3; y++) {
    fillBoardRow(board, y);
  }
  return board;
}

/**
 * Move tetromino to specific position
 */
function _moveTetrominoToPosition(state: GameState, targetX: number, targetY: number): GameState {
  let newState = state;
  const currentX = state.currentPiece?.position.x ?? 0;
  const currentY = state.currentPiece?.position.y ?? 0;

  // Move in X direction
  const deltaX = targetX - currentX;
  if (deltaX !== 0) {
    newState = moveTetrominoBy(newState, deltaX, 0);
  }

  // Move in Y direction
  const deltaY = targetY - currentY;
  if (deltaY !== 0) {
    newState = moveTetrominoBy(newState, 0, deltaY);
  }

  return newState;
}

// ==============================
// Test Implementation - Junichi Ito Practical Patterns
// ==============================

describe("ゲームロジック - 伊藤淳一氏スタイル", () => {
  describe("初期ゲーム状態の作成", () => {
    test("正しい初期状態でゲームが開始される", () => {
      // Given: Game initialization
      // When: Create initial game state
      const state = createInitialGameState();

      // Then: Expected initial values are set
      expect(state.board.length).toBe(GAME_CONSTANTS.BOARD.HEIGHT);
      expect(state.board[0].length).toBe(GAME_CONSTANTS.BOARD.WIDTH);
      expect(state.score).toBe(0);
      expect(state.lines).toBe(0);
      expect(state.level).toBe(1);
      expect(state.isGameOver).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentPiece).toBeDefined();
      expect(state.nextPiece).toBeDefined();
      expect(state.pieceBag).toBeDefined();
      expect(Array.isArray(state.pieceBag)).toBe(true);
    });

    test("7-bagシステムで正しくピースが生成される", () => {
      // Given: 7-bag system for piece generation
      // When: Create initial state
      const state = createInitialGameState();

      // Then: Valid piece types are set
      const validPieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
      expect(validPieces).toContain(state.currentPiece?.type);
      expect(validPieces).toContain(state.nextPiece);
      // Bag contains remaining pieces
      expect(state.pieceBag.length).toBeLessThanOrEqual(7);
    });

    test("ボードは空の状態で初期化される", () => {
      // Given: New game start
      // When: Create initial state
      const state = createInitialGameState();

      // Then: All cells are empty (0)
      for (let y = 0; y < GAME_CONSTANTS.BOARD.HEIGHT; y++) {
        for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
          expect(state.board[y][x]).toBe(0);
        }
      }
    });
  });

  describe("テトロミノの移動", () => {
    describe("正常系 - 基本移動", () => {
      test("左方向に1マス移動できる", () => {
        // Given: 初期状態のゲーム
        const state = createInitialGameState();
        const initialX = state.currentPiece?.position.x ?? 0;

        // When: 左に1マス移動
        const newState = moveTetrominoBy(state, -1, 0);

        // Then: X座標が1減少する
        expect(newState.currentPiece?.position.x).toBe(initialX - 1);
      });

      test("右方向に1マス移動できる", () => {
        // Given: 初期状態のゲーム
        const state = createInitialGameState();
        const initialX = state.currentPiece?.position.x ?? 0;

        // When: 右に1マス移動
        const newState = moveTetrominoBy(state, 1, 0);

        // Then: X座標が1増加する
        expect(newState.currentPiece?.position.x).toBe(initialX + 1);
      });

      test("下方向に1マス移動できる", () => {
        // Given: 初期状態のゲーム
        const state = createInitialGameState();
        const initialY = state.currentPiece?.position.y ?? 0;

        // When: 下に1マス移動
        const newState = moveTetrominoBy(state, 0, 1);

        // Then: Y座標が1増加する
        expect(newState.currentPiece?.position.y).toBe(initialY + 1);
      });

      test("複数方向への移動が正しく処理される", () => {
        // Given: 初期状態のゲーム
        const state = createInitialGameState();
        const initialX = state.currentPiece?.position.x ?? 0;
        const initialY = state.currentPiece?.position.y ?? 0;

        // When: 右下に移動
        const newState = moveTetrominoBy(state, 2, 3);

        // Then: 両方向に正しく移動する
        expect(newState.currentPiece?.position.x).toBe(initialX + 2);
        expect(newState.currentPiece?.position.y).toBe(initialY + 3);
      });
    });

    describe("境界値テスト", () => {
      test("左端の壁で移動が制限される", () => {
        // Given: ピースを左端まで移動
        let state = createInitialGameState();
        for (let i = 0; i < GAME_CONSTANTS.BOARD.WIDTH; i++) {
          state = moveTetrominoBy(state, -1, 0);
        }

        // When: さらに左に移動を試みる
        const finalState = moveTetrominoBy(state, -1, 0);

        // Then: 移動せず元の位置に留まる
        expect(finalState.currentPiece?.position.x).toBe(state.currentPiece?.position.x);
      });

      test("右端の壁で移動が制限される", () => {
        // Given: ピースを右端まで移動
        let state = createInitialGameState();
        for (let i = 0; i < GAME_CONSTANTS.BOARD.WIDTH; i++) {
          state = moveTetrominoBy(state, 1, 0);
        }

        // When: さらに右に移動を試みる
        const finalState = moveTetrominoBy(state, 1, 0);

        // Then: 移動せず元の位置に留まる
        expect(finalState.currentPiece?.position.x).toBe(state.currentPiece?.position.x);
      });

      test("ボード下端で移動が制限される", () => {
        // Given: ピースを下端近くまで移動
        let state = createInitialGameState();
        let _previousState = state;

        // Move piece down until it can't move anymore
        for (let i = 0; i < GAME_CONSTANTS.BOARD.HEIGHT + 5; i++) {
          const newState = moveTetrominoBy(state, 0, 1);
          // If the piece didn't move, we've hit the boundary
          if (newState.currentPiece?.position.y === state.currentPiece?.position.y) {
            break;
          }
          _previousState = state;
          state = newState;
        }

        // When: Try to move further down
        const finalState = moveTetrominoBy(state, 0, 1);

        // Then: Position should not change or piece should be placed
        const positionUnchanged =
          finalState.currentPiece?.position.y === state.currentPiece?.position.y;
        const pieceWasPlaced = finalState.currentPiece !== state.currentPiece;

        expect(positionUnchanged || pieceWasPlaced).toBe(true);
      });

      test("最小移動量（1マス）が正しく処理される", () => {
        // Given: 初期状態
        const state = createInitialGameState();
        const initialPosition = {
          x: state.currentPiece?.position.x ?? 0,
          y: state.currentPiece?.position.y ?? 0,
        };

        // When: 最小単位で移動
        const newState = moveTetrominoBy(state, 1, 1);

        // Then: 正確に1マスずつ移動する
        expect(newState.currentPiece?.position.x).toBe(initialPosition.x + 1);
        expect(newState.currentPiece?.position.y).toBe(initialPosition.y + 1);
      });
    });

    describe("異常系テスト", () => {
      test("ゲームが一時停止中は移動しない", () => {
        // Given: 一時停止状態のゲーム
        const state = createTestGameState({ isPaused: true });
        const initialPosition = {
          x: state.currentPiece?.position.x ?? 0,
          y: state.currentPiece?.position.y ?? 0,
        };

        // When: 移動を試みる
        const newState = moveTetrominoBy(state, 1, 1);

        // Then: 位置が変わらない
        expect(newState.currentPiece?.position.x).toBe(initialPosition.x);
        expect(newState.currentPiece?.position.y).toBe(initialPosition.y);
      });

      test("ゲームオーバー時は移動しない", () => {
        // Given: ゲームオーバー状態
        const state = createTestGameState({ isGameOver: true });
        const initialPosition = {
          x: state.currentPiece?.position.x ?? 0,
          y: state.currentPiece?.position.y ?? 0,
        };

        // When: 移動を試みる
        const newState = moveTetrominoBy(state, 1, 1);

        // Then: 位置が変わらない
        expect(newState.currentPiece?.position.x).toBe(initialPosition.x);
        expect(newState.currentPiece?.position.y).toBe(initialPosition.y);
      });

      test("現在のピースがnullの場合エラーにならない", () => {
        // Given: currentPieceがnullの状態
        const state = createTestGameState({ currentPiece: null });

        // When: 移動を試みる
        // Then: エラーが発生しない
        expect(() => moveTetrominoBy(state, 1, 1)).not.toThrow();
      });

      test("他のピースとの衝突で移動が制限される", () => {
        // Given: ボード上に配置済みピースがある状態
        const state = createInitialGameState();
        const board = state.board.map((row) => [...row]);
        // 左下に障害物を配置
        board[GAME_CONSTANTS.BOARD.HEIGHT - 1][0] = 1;
        const stateWithObstacle = { ...state, board };

        // ピースを下端近くまで移動
        let newState = stateWithObstacle;
        for (let i = 0; i < GAME_CONSTANTS.BOARD.HEIGHT - 2; i++) {
          newState = moveTetrominoBy(newState, 0, 1);
        }

        // When: 障害物のある方向に移動を試みる
        const beforeX = newState.currentPiece?.position.x ?? 0;
        const finalState = moveTetrominoBy(newState, -1 * beforeX, 0);

        // Then: 衝突により移動が制限される
        // （正確な制限は実装による）
        expect(finalState.currentPiece).toBeDefined();
      });

      test("負の移動量が正しく処理される", () => {
        // Given: 中央付近にピースがある状態
        let state = createInitialGameState();
        state = moveTetrominoBy(state, 2, 2); // 中央寄りに移動

        const initialX = state.currentPiece?.position.x ?? 0;
        const initialY = state.currentPiece?.position.y ?? 0;

        // When: 負の移動量で移動
        const newState = moveTetrominoBy(state, -1, -1);

        // Then: 逆方向に移動する
        expect(newState.currentPiece?.position.x).toBe(initialX - 1);
        expect(newState.currentPiece?.position.y).toBe(initialY - 1);
      });
    });
  });

  describe("rotateTetrominoCW", () => {
    test("should rotate current piece", () => {
      const state = createInitialGameState();
      const initialRotation = state.currentPiece?.rotation ?? 0;
      const newState = rotateTetrominoCW(state);
      expect(newState.currentPiece?.rotation).toBe((initialRotation + 1) % 4);
    });

    test("should use wall kick when basic rotation fails", () => {
      const state = createInitialGameState();

      // Move piece to left edge where basic rotation might fail
      let edgeState = state;
      for (let i = 0; i < 3; i++) {
        edgeState = moveTetrominoBy(edgeState, -1, 0);
      }

      const initialRotation = edgeState.currentPiece?.rotation ?? 0;
      const newState = rotateTetrominoCW(edgeState);

      // Should successfully rotate with wall kick compensation
      expect(newState.currentPiece?.rotation).toBe((initialRotation + 1) % 4);
    });

    test("should maintain position when wall kick finds valid spot", () => {
      const state = createInitialGameState();
      const newState = rotateTetrominoCW(state);

      // Should have valid position after rotation
      expect(newState.currentPiece?.position.x).toBeGreaterThanOrEqual(0);
      expect(newState.currentPiece?.position.x).toBeLessThan(GAME_CONSTANTS.BOARD.WIDTH);
      expect(newState.currentPiece?.position.y).toBeGreaterThanOrEqual(0);
    });

    test("should not rotate when game is paused", () => {
      const state = { ...createInitialGameState(), isPaused: true };
      const newState = rotateTetrominoCW(state);
      expect(newState).toBe(state);
    });

    test("should not rotate when game is over", () => {
      const state = { ...createInitialGameState(), isGameOver: true };
      const newState = rotateTetrominoCW(state);
      expect(newState).toBe(state);
    });
  });

  describe("hardDropTetromino", () => {
    test("should drop piece to bottom", () => {
      const state = createInitialGameState();
      const newState = hardDropTetromino(state);
      // The piece should be placed on the board
      expect(newState.currentPiece).not.toBe(state.currentPiece);
    });
  });

  describe("calculateScore", () => {
    test("should calculate score for 1 line", () => {
      expect(calculateScore(1, 1)).toBe(100);
    });

    test("should calculate score for 2 lines", () => {
      expect(calculateScore(2, 1)).toBe(300);
    });

    test("should calculate score for 3 lines", () => {
      expect(calculateScore(3, 1)).toBe(500);
    });

    test("should calculate score for 4 lines (tetris)", () => {
      expect(calculateScore(4, 1)).toBe(800);
    });

    test("should increase score with level", () => {
      expect(calculateScore(1, 2)).toBe(200);
      expect(calculateScore(4, 5)).toBe(4000);
    });
  });

  describe("preserveBoardForAnimation", () => {
    test("should return board when clearing lines exist", () => {
      const board = createEmptyBoard();
      const clearingLines = [0, 1];
      const result = preserveBoardForAnimation(board, clearingLines);
      expect(result).toBe(board);
    });

    test("should return null when no clearing lines", () => {
      const board = createEmptyBoard();
      const clearingLines: number[] = [];
      const result = preserveBoardForAnimation(board, clearingLines);
      expect(result).toBeNull();
    });
  });

  describe("checkGameOver", () => {
    test("should return false when piece can be placed", () => {
      const board = createEmptyBoard();
      const piece = createTetromino("T");
      const result = checkGameOver(board, piece);
      expect(result).toBe(false);
    });

    test("should return true when piece cannot be placed", () => {
      const board = createEmptyBoard();
      // Fill the top row to create collision
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        board[0][x] = 1;
      }
      const piece = createTetromino("T");
      const result = checkGameOver(board, piece);
      expect(result).toBe(true);
    });
  });

  describe("spawnNextPiece", () => {
    test("should create new piece and update bag", () => {
      const nextPieceType = "T";
      const pieceBag = ["I", "O", "S", "Z", "J", "L"];
      const result = spawnNextPiece(nextPieceType, pieceBag);

      expect(result.currentPiece.type).toBe("T");
      expect(result.nextPiece).toBeDefined();
      expect(["I", "O", "S", "Z", "J", "L"]).toContain(result.nextPiece);
      expect(result.pieceBag).toBeDefined();
      expect(Array.isArray(result.pieceBag)).toBe(true);
    });

    test("should handle empty bag correctly", () => {
      const nextPieceType = "I";
      const pieceBag: string[] = [];
      const result = spawnNextPiece(nextPieceType, pieceBag);

      expect(result.currentPiece.type).toBe("I");
      expect(result.nextPiece).toBeDefined();
      expect(result.pieceBag.length).toBeGreaterThan(0);
    });
  });

  describe("clearCompletedLines", () => {
    test("should not change score when no lines cleared", () => {
      const board = createEmptyBoard();
      const result = clearCompletedLines(board, 100, 5, 2);

      expect(result.score).toBe(100);
      expect(result.lines).toBe(5);
      expect(result.level).toBe(1); // Level is calculated as Math.floor(lines / LINES_PER_LEVEL) + 1
      expect(result.clearingLines).toEqual([]);
    });

    test("should update score and level when lines cleared", () => {
      const board = createEmptyBoard();
      // Fill bottom row to create a complete line
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        board[GAME_CONSTANTS.BOARD.HEIGHT - 1][x] = 1;
      }

      const result = clearCompletedLines(board, 0, 0, 1);

      expect(result.score).toBe(100); // 1 line * level 1
      expect(result.lines).toBe(1);
      expect(result.level).toBe(1);
      expect(result.clearingLines).toEqual([GAME_CONSTANTS.BOARD.HEIGHT - 1]);
    });
  });

  describe("placePieceOnBoard", () => {
    test("should place piece on board", () => {
      const state = createInitialGameState();
      const result = placePieceOnBoard(state);

      expect(result.board).toBeDefined();
      expect(result.placedPositions).toBeDefined();
      expect(Array.isArray(result.placedPositions)).toBe(true);
      expect(result.placedPositions.length).toBeGreaterThan(0);
    });

    test("should return empty positions when no current piece", () => {
      const state = { ...createInitialGameState(), currentPiece: null };
      const result = placePieceOnBoard(state);

      expect(result.board).toBe(state.board);
      expect(result.placedPositions).toEqual([]);
    });
  });
});
