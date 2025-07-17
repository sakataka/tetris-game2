/**
 * 超シンプルなTetris AI実装（約100行）
 * 複雑なAIと比較するためのベースライン
 *
 * 戦略：
 * 1. 可能な全配置を試す
 * 2. 4つの基本特徴で評価：高さ、ライン、穴、凹凸
 * 3. 最高スコアの配置を選ぶ
 */

import { getTetrominoShape } from "@/game/tetrominos";
import type { GameState } from "@/types/game";

interface SimpleMove {
  x: number;
  y: number;
  rotation: number;
  score: number;
}

export interface SimpleAI {
  findBestMove(gameState: GameState): { x: number; y: number; rotation: number } | null;
}

/**
 * シンプルなAI評価器
 * 証明済みの4特徴のみ使用
 */
export function createSimpleAI(): SimpleAI {
  // 実証済みの重み（論文・実装例から）
  const weights = {
    aggregateHeight: -0.51, // 高さペナルティ
    linesCleared: 0.76, // ライン消去報酬
    holes: -0.36, // 穴ペナルティ
    bumpiness: -0.18, // 凹凸ペナルティ
  };

  const findDropY = (board: number[][], shape: number[][], x: number): number => {
    for (let y = 0; y <= board.length - shape.length; y++) {
      if (wouldCollide(board, shape, x, y)) {
        return y - 1;
      }
    }
    return board.length - shape.length;
  };

  const wouldCollide = (board: number[][], shape: number[][], x: number, y: number): boolean => {
    for (let sy = 0; sy < shape.length; sy++) {
      for (let sx = 0; sx < shape[sy].length; sx++) {
        if (shape[sy][sx] !== 0) {
          const boardY = y + sy;
          const boardX = x + sx;

          if (boardY >= board.length || boardX < 0 || boardX >= board[0].length) {
            return true;
          }
          if (board[boardY][boardX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const placePiece = (board: number[][], shape: number[][], x: number, y: number): void => {
    for (let sy = 0; sy < shape.length; sy++) {
      for (let sx = 0; sx < shape[sy].length; sx++) {
        if (shape[sy][sx] !== 0) {
          board[y + sy][x + sx] = shape[sy][sx];
        }
      }
    }
  };

  const clearLines = (board: number[][]): number => {
    let linesCleared = 0;
    for (let y = board.length - 1; y >= 0; y--) {
      if (board[y].every((cell) => cell !== 0)) {
        board.splice(y, 1);
        board.unshift(new Array(10).fill(0));
        linesCleared++;
        y++; // 再チェック
      }
    }
    return linesCleared;
  };

  const calculateAggregateHeight = (board: number[][]): number => {
    let totalHeight = 0;
    for (let x = 0; x < board[0].length; x++) {
      for (let y = 0; y < board.length; y++) {
        if (board[y][x] !== 0) {
          totalHeight += board.length - y;
          break;
        }
      }
    }
    return totalHeight;
  };

  const calculateHoles = (board: number[][]): number => {
    let holes = 0;
    for (let x = 0; x < board[0].length; x++) {
      let foundBlock = false;
      for (let y = 0; y < board.length; y++) {
        if (board[y][x] !== 0) {
          foundBlock = true;
        } else if (foundBlock) {
          holes++;
        }
      }
    }
    return holes;
  };

  const calculateBumpiness = (board: number[][]): number => {
    const heights: number[] = [];
    for (let x = 0; x < board[0].length; x++) {
      let height = 0;
      for (let y = 0; y < board.length; y++) {
        if (board[y][x] !== 0) {
          height = board.length - y;
          break;
        }
      }
      heights.push(height);
    }

    let bumpiness = 0;
    for (let i = 0; i < heights.length - 1; i++) {
      bumpiness += Math.abs(heights[i] - heights[i + 1]);
    }
    return bumpiness;
  };

  const rotateOnce = (shape: number[][]): number[][] => {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated: number[][] = [];

    for (let x = 0; x < cols; x++) {
      rotated[x] = [];
      for (let y = 0; y < rows; y++) {
        rotated[x][y] = shape[rows - 1 - y][x];
      }
    }
    return rotated;
  };

  const rotateShape = (shape: number[][], times: number): number[][] => {
    let result = shape;
    for (let i = 0; i < times; i++) {
      result = rotateOnce(result);
    }
    return result;
  };

  const evaluatePosition = (board: number[][], shape: number[][], x: number, y: number): number => {
    // ボードをコピーしてピースを配置
    const testBoard = board.map((row) => [...row]);
    placePiece(testBoard, shape, x, y);

    // ライン消去をシミュレート
    const linesCleared = clearLines(testBoard);

    // 4つの特徴を計算
    const aggregateHeight = calculateAggregateHeight(testBoard);
    const holes = calculateHoles(testBoard);
    const bumpiness = calculateBumpiness(testBoard);

    // 線形結合でスコア計算
    return (
      weights.aggregateHeight * aggregateHeight +
      weights.linesCleared * linesCleared +
      weights.holes * holes +
      weights.bumpiness * bumpiness
    );
  };

  return {
    /**
     * 最適な手を決定
     */
    findBestMove(gameState: GameState): { x: number; y: number; rotation: number } | null {
      if (!gameState.currentPiece) return null;

      const piece = gameState.currentPiece.type;
      const board = gameState.board;
      let bestMove: SimpleMove | null = null;

      // 全ての回転・位置を試す
      for (let rotation = 0; rotation < 4; rotation++) {
        const shape = rotateShape(getTetrominoShape(piece), rotation);

        for (let x = 0; x < 10 - shape[0].length + 1; x++) {
          const y = findDropY(board, shape, x);
          if (y === -1) continue; // 配置不可能

          const score = evaluatePosition(board, shape, x, y);

          if (!bestMove || score > bestMove.score) {
            bestMove = { x, y, rotation, score };
          }
        }
      }

      return bestMove ? { x: bestMove.x, y: bestMove.y, rotation: bestMove.rotation } : null;
    },
  };
}
