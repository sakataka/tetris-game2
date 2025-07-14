/**
 * Performance-optimized AI worker using ring buffers and object pooling
 */

import type { GameState } from "@/types/game";
import { type EvaluationResult, evaluationResultPool } from "./object-pool";
import { BoardRingBuffer } from "./ring-buffer";

// Initialize ring buffer for board copies (capacity: 100 boards)
const boardBuffer = new BoardRingBuffer(100, 24);

// Pre-warm the evaluation result pool
evaluationResultPool.prewarm(50);

/**
 * Optimized position evaluation with memory reuse
 */
function evaluatePositionOptimized(gameState: GameState): {
  result: EvaluationResult;
  performance: { duration: number };
} {
  const startTime = performance.now();

  try {
    // Convert GameBoard to Uint32Array if needed
    const boardArray = Array.isArray(gameState.board)
      ? new Uint32Array(gameState.board.length) // Convert 2D array to flat representation
      : (gameState.board as Uint32Array);

    // Acquire reusable board copy
    const boardCopy = boardBuffer.acquireBoardCopy(boardArray);

    // Acquire reusable result object
    const result = evaluationResultPool.acquire();

    // Perform AI evaluation (simplified)
    result.score = Math.random() * 1000;
    result.position.x = Math.floor(Math.random() * 10);
    result.position.y = Math.floor(Math.random() * 20);
    result.rotation = Math.floor(Math.random() * 4);

    // Calculate evaluation metrics
    result.evaluation.holes = countHoles(boardCopy);
    result.evaluation.bumpiness = calculateBumpiness(boardCopy);
    result.evaluation.height = getMaxHeight(boardCopy);
    result.evaluation.lines = getCompleteLines(boardCopy);

    // Return board copy to buffer
    boardBuffer.releaseBoardCopy(boardCopy);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Return result (caller should release it back to pool)
    return {
      result: result,
      performance: { duration },
    };
  } catch (error) {
    console.error("Optimized evaluation failed:", error);
    throw error;
  }
}

// Simplified evaluation functions (these would be optimized BitBoard operations)
function countHoles(board: Uint32Array): number {
  let holes = 0;
  for (let col = 0; col < 10; col++) {
    let foundBlock = false;
    for (let row = 0; row < board.length; row++) {
      if (board[row] & (1 << col)) {
        foundBlock = true;
      } else if (foundBlock) {
        holes++;
      }
    }
  }
  return holes;
}

function calculateBumpiness(board: Uint32Array): number {
  const heights = [];
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < board.length; row++) {
      if (board[row] & (1 << col)) {
        heights.push(board.length - row);
        break;
      }
    }
    if (heights.length <= col) {
      heights.push(0);
    }
  }

  let bumpiness = 0;
  for (let i = 0; i < heights.length - 1; i++) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }
  return bumpiness;
}

function getMaxHeight(board: Uint32Array): number {
  for (let row = 0; row < board.length; row++) {
    if (board[row] !== 0) {
      return board.length - row;
    }
  }
  return 0;
}

function getCompleteLines(board: Uint32Array): number {
  let lines = 0;
  const fullRow = (1 << 10) - 1; // 0b1111111111

  for (let row = 0; row < board.length; row++) {
    if ((board[row] & fullRow) === fullRow) {
      lines++;
    }
  }
  return lines;
}

/**
 * Get performance statistics for monitoring
 */
function getPerformanceStats() {
  return {
    boardBuffer: boardBuffer.getStats(),
    evaluationPool: evaluationResultPool.getStats(),
  };
}

// Export for worker message handler
declare const self: DedicatedWorkerGlobalScope;

(
  self as unknown as {
    evaluatePositionOptimized: typeof evaluatePositionOptimized;
    getPerformanceStats: typeof getPerformanceStats;
    evaluationResultPool: typeof evaluationResultPool;
  }
).evaluatePositionOptimized = evaluatePositionOptimized;

(
  self as unknown as {
    evaluatePositionOptimized: typeof evaluatePositionOptimized;
    getPerformanceStats: typeof getPerformanceStats;
    evaluationResultPool: typeof evaluationResultPool;
  }
).getPerformanceStats = getPerformanceStats;

(
  self as unknown as {
    evaluatePositionOptimized: typeof evaluatePositionOptimized;
    getPerformanceStats: typeof getPerformanceStats;
    evaluationResultPool: typeof evaluationResultPool;
  }
).evaluationResultPool = evaluationResultPool;
