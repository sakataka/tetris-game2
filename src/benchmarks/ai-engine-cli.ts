import { AIEngine, DEFAULT_AI_CONFIG } from "@/game/ai/core/ai-engine";
import { createTetromino } from "@/game/tetrominos";
import type { CellValue, GameBoard, GameState, TetrominoTypeName } from "@/types/game";

/**
 * Generate test boards with varying complexity for AI benchmarking
 */
function generateTestBoards(count: number): GameBoard[] {
  const boards: GameBoard[] = [];

  for (let i = 0; i < count; i++) {
    const board: GameBoard = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0 as CellValue));

    // Create boards with varying complexity (0-80% fill rate)
    const fillRate = (i / count) * 0.8;

    for (let y = 15; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        if (Math.random() < fillRate) {
          board[y][x] = (Math.floor(Math.random() * 7) + 1) as CellValue;
        }
      }
    }

    boards.push(board);
  }

  return boards;
}

/**
 * Create test game state for benchmarking
 */
function createTestGameState(board: GameBoard, pieceType: TetrominoTypeName = "T"): GameState {
  return {
    board,
    boardBeforeClear: null,
    currentPiece: createTetromino(pieceType),
    nextPiece: "T",
    heldPiece: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    isGameOver: false,
    isPaused: false,
    placedPositions: [],
    clearingLines: [],
    animationTriggerKey: 0,
    ghostPosition: null,
    pieceBag: ["O", "T", "S", "Z", "J", "L"],
    tSpinState: {
      type: "none",
      show: false,
      linesCleared: 0,
      rotationResult: null,
    },
    comboState: {
      count: 0,
      isActive: false,
      lastClearType: null,
    },
    scoreAnimationState: {
      previousScore: 0,
      scoreIncrease: 0,
      lineCount: 0,
      clearType: null,
      isTetris: false,
      animationTriggerTime: 0,
    },
    floatingScoreEvents: [],
  };
}

/**
 * Benchmark a specific AI evaluator configuration
 */
async function benchmarkEvaluator(
  name: string,
  config: typeof DEFAULT_AI_CONFIG,
  testBoards: GameBoard[],
): Promise<{
  name: string;
  avgThinkTime: number;
  maxThinkTime: number;
  avgEvaluations: number;
  timeoutRate: number;
  totalTests: number;
}> {
  const ai = new AIEngine({ ...config, enableLogging: false });
  const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

  const results = {
    thinkTimes: [] as number[],
    evaluations: [] as number[],
    timeouts: 0,
  };

  console.log(`🔄 Testing ${name} evaluator...`);

  for (let i = 0; i < testBoards.length; i++) {
    const board = testBoards[i];
    const piece = pieces[i % pieces.length];
    const gameState = createTestGameState(board, piece);

    const decision = await ai.findBestMove(gameState);

    results.thinkTimes.push(decision.thinkingTime);
    results.evaluations.push(decision.evaluationCount);
    if (decision.timedOut) results.timeouts++;

    // Progress indicator
    if ((i + 1) % Math.floor(testBoards.length / 10) === 0) {
      const progress = Math.round(((i + 1) / testBoards.length) * 100);
      process.stdout.write(`\r  Progress: ${progress}%`);
    }
  }

  console.log(); // New line after progress

  return {
    name,
    avgThinkTime: results.thinkTimes.reduce((a, b) => a + b, 0) / results.thinkTimes.length,
    maxThinkTime: Math.max(...results.thinkTimes),
    avgEvaluations: results.evaluations.reduce((a, b) => a + b, 0) / results.evaluations.length,
    timeoutRate: (results.timeouts / testBoards.length) * 100,
    totalTests: testBoards.length,
  };
}

/**
 * AI Performance Benchmark as specified in Issue #115
 */
export const benchmarkAIPerformance = async () => {
  console.log("🚀 AI Performance Benchmark - Issue #115");
  console.log("==========================================");

  // Generate test boards
  const testBoards = generateTestBoards(1000);
  console.log(`📊 Generated ${testBoards.length} test boards`);

  // CPU info for consistent benchmarking
  console.log(`💻 Runtime: ${process.platform} ${process.arch}`);
  console.log(`🧠 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log();

  // Test different AI configurations
  const evaluators = [
    {
      name: "Dellacherie",
      config: {
        ...DEFAULT_AI_CONFIG,
        thinkingTimeLimit: 200,
        useDynamicWeights: false,
        // Dellacherie-focused configuration
      },
    },
    {
      name: "Stacking",
      config: {
        ...DEFAULT_AI_CONFIG,
        thinkingTimeLimit: 200,
        useDynamicWeights: true,
        // Stacking-focused configuration
      },
    },
    {
      name: "Pattern",
      config: {
        ...DEFAULT_AI_CONFIG,
        thinkingTimeLimit: 200,
        useDynamicWeights: true,
        // Pattern recognition focused configuration
      },
    },
  ];

  const results = await Promise.all(
    evaluators.map((evaluator) => benchmarkEvaluator(evaluator.name, evaluator.config, testBoards)),
  );

  // Display results
  console.log("\n📈 Benchmark Results");
  console.log("====================");

  results.forEach((result) => {
    console.log(`\n🎯 ${result.name} Evaluator:`);
    console.log(`  • Average think time: ${result.avgThinkTime.toFixed(1)}ms`);
    console.log(`  • Max think time: ${result.maxThinkTime.toFixed(1)}ms`);
    console.log(`  • Average evaluations: ${result.avgEvaluations.toFixed(0)}`);
    console.log(`  • Timeout rate: ${result.timeoutRate.toFixed(1)}%`);
    console.log(`  • Total tests: ${result.totalTests}`);

    // Performance assessment
    const isGood = result.avgThinkTime < 200 && result.timeoutRate < 10;
    console.log(`  • Assessment: ${isGood ? "✅ PASS" : "❌ NEEDS OPTIMIZATION"}`);
  });

  // Overall summary
  const avgThinkTime = results.reduce((sum, r) => sum + r.avgThinkTime, 0) / results.length;
  const maxTimeoutRate = Math.max(...results.map((r) => r.timeoutRate));

  console.log("\n🏆 Overall Assessment:");
  console.log(`  • Average think time across evaluators: ${avgThinkTime.toFixed(1)}ms`);
  console.log(`  • Highest timeout rate: ${maxTimeoutRate.toFixed(1)}%`);
  console.log(
    `  • Target compliance: ${avgThinkTime < 200 && maxTimeoutRate < 10 ? "✅ PASS" : "❌ FAIL"}`,
  );

  return results;
};

/**
 * CLI interface for AI Engine benchmarks
 */
export async function runAIEngineBenchmarkCLI(): Promise<void> {
  try {
    await benchmarkAIPerformance();
    console.log("\n✅ AI Engine benchmark completed successfully");
  } catch (error) {
    console.error("❌ AI Engine benchmark failed:", error);
    throw error;
  }
}
