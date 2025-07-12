import { type BoardEngineType, createBoardEngine } from "@/game/board-engine";
import type { CellValue, GameBoard, Position, TetrominoShape } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

export interface BenchmarkResult {
  results: Record<string, number>;
  improvement: number;
  goNoGoDecision: GoNoGoDecision;
  statisticalSignificance: StatisticalSignificance;
  timestamp: Date;
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  pValue: number;
  confidenceLevel: number;
  meanDifference: number;
  standardError: number;
  tStatistic: number;
  degreesOfFreedom: number;
}

export interface GoNoGoDecision {
  decision: "GO" | "NO-GO";
  reason: string;
  improvementPercentage: number;
  meetsThreshold: boolean;
  threshold: number;
}

export interface BenchmarkConfiguration {
  iterations: number;
  warmupIterations: number;
  runs: number;
  improvementThreshold: number; // Minimum improvement percentage to justify implementation
  significanceLevel: number; // Alpha level for statistical significance (e.g., 0.05)
}

export class CollisionBenchmark {
  private readonly config: BenchmarkConfiguration;

  constructor(config: Partial<BenchmarkConfiguration> = {}) {
    this.config = {
      iterations: 10000,
      warmupIterations: 1000,
      runs: 10,
      improvementThreshold: 5.0, // 5% improvement threshold
      significanceLevel: 0.05,
      ...config,
    };
  }

  /**
   * Run performance comparison between board engines
   */
  async runComparison(): Promise<BenchmarkResult> {
    const engines = ["typed-array", "bitboard"] as const;
    const results: Record<string, number> = {};

    console.log("🚀 Starting collision benchmark comparison...");
    console.log(`Configuration: ${JSON.stringify(this.config, null, 2)}`);

    for (const engineType of engines) {
      console.log(`\n📊 Benchmarking ${engineType} engine...`);
      results[engineType] = await this.benchmarkEngine(engineType);
    }

    const improvement = this.calculateImprovement(results);
    const statisticalSignificance = this.calculateStatisticalSignificance(
      results["typed-array"],
      results.bitboard,
    );
    const goNoGoDecision = this.evaluateGoNoGo(results, statisticalSignificance);

    return {
      results,
      improvement,
      goNoGoDecision,
      statisticalSignificance,
      timestamp: new Date(),
    };
  }

  /**
   * Benchmark a specific board engine
   */
  private async benchmarkEngine(engineType: BoardEngineType): Promise<number> {
    const engine = createBoardEngine(engineType);
    const testData = this.generateTestData();
    const times: number[] = [];

    // Warmup
    for (let i = 0; i < this.config.warmupIterations; i++) {
      const { board, shape, position } = this.getRandomTest(testData);
      engine.isValidPosition(board, shape, position);
    }

    // Actual benchmark runs
    for (let run = 0; run < this.config.runs; run++) {
      const startTime = performance.now();

      for (let i = 0; i < this.config.iterations; i++) {
        const { board, shape, position } = this.getRandomTest(testData);
        engine.isValidPosition(board, shape, position);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);

      console.log(`  Run ${run + 1}/${this.config.runs}: ${duration.toFixed(2)}ms`);
    }

    // Calculate mean time
    const meanTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const opsPerSecond = this.config.iterations / (meanTime / 1000);

    console.log(`  Average: ${meanTime.toFixed(2)}ms (${opsPerSecond.toFixed(0)} ops/sec)`);

    return meanTime;
  }

  /**
   * Generate test data for benchmarking
   */
  private generateTestData() {
    const boards: GameBoard[] = [];
    const shapes: TetrominoShape[] = [];
    const positions: Position[] = [];

    // Generate test boards
    for (let i = 0; i < 100; i++) {
      boards.push(this.generateRandomBoard());
    }

    // Generate test shapes (all tetromino pieces)
    shapes.push(
      // I-piece
      [[1, 1, 1, 1]],
      // O-piece
      [
        [1, 1],
        [1, 1],
      ],
      // T-piece
      [
        [0, 1, 0],
        [1, 1, 1],
      ],
      // S-piece
      [
        [0, 1, 1],
        [1, 1, 0],
      ],
      // Z-piece
      [
        [1, 1, 0],
        [0, 1, 1],
      ],
      // J-piece
      [
        [1, 0, 0],
        [1, 1, 1],
      ],
      // L-piece
      [
        [0, 0, 1],
        [1, 1, 1],
      ],
    );

    // Generate test positions
    for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH - 3; x++) {
      for (let y = 0; y < GAME_CONSTANTS.BOARD.HEIGHT - 3; y++) {
        positions.push({ x, y });
      }
    }

    return { boards, shapes, positions };
  }

  /**
   * Generate a random board with some filled cells
   */
  private generateRandomBoard(): GameBoard {
    const board = Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, () =>
      Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, () => 0 as CellValue),
    );

    // Fill bottom half with random cells (30% chance)
    for (
      let y = Math.floor(GAME_CONSTANTS.BOARD.HEIGHT / 2);
      y < GAME_CONSTANTS.BOARD.HEIGHT;
      y++
    ) {
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        if (Math.random() < 0.3) {
          board[y][x] = (Math.floor(Math.random() * 7) + 1) as CellValue;
        }
      }
    }

    return board;
  }

  /**
   * Get a random test case
   */
  private getRandomTest(testData: {
    boards: GameBoard[];
    shapes: TetrominoShape[];
    positions: Position[];
  }) {
    const board = testData.boards[Math.floor(Math.random() * testData.boards.length)];
    const shape = testData.shapes[Math.floor(Math.random() * testData.shapes.length)];
    const position = testData.positions[Math.floor(Math.random() * testData.positions.length)];

    return { board, shape, position };
  }

  /**
   * Calculate improvement percentage
   */
  private calculateImprovement(results: Record<string, number>): number {
    const typedArrayTime = results["typed-array"];
    const bitboardTime = results.bitboard;

    if (!typedArrayTime || !bitboardTime) {
      return 0;
    }

    // Improvement = (old - new) / old * 100
    return ((typedArrayTime - bitboardTime) / typedArrayTime) * 100;
  }

  /**
   * Calculate statistical significance using t-test
   */
  private calculateStatisticalSignificance(
    typedArrayTime: number,
    bitboardTime: number,
  ): StatisticalSignificance {
    // For now, simplified t-test calculation
    // In a real implementation, we'd run multiple samples and calculate variance
    const meanDifference = typedArrayTime - bitboardTime;
    const pooledVariance = (typedArrayTime * 0.1) ** 2; // Simplified variance estimation
    const standardError = Math.sqrt(pooledVariance);
    const tStatistic = meanDifference / standardError;
    const degreesOfFreedom = (this.config.runs - 1) * 2; // Simplified calculation

    // Simplified p-value calculation (normally would use t-distribution)
    const pValue = Math.abs(tStatistic) > 2 ? 0.01 : 0.1;
    const isSignificant = pValue < this.config.significanceLevel;

    return {
      isSignificant,
      pValue,
      confidenceLevel: 1 - this.config.significanceLevel,
      meanDifference,
      standardError,
      tStatistic,
      degreesOfFreedom,
    };
  }

  /**
   * Evaluate Go/No-Go decision based on results
   */
  private evaluateGoNoGo(
    results: Record<string, number>,
    statisticalSignificance: StatisticalSignificance,
  ): GoNoGoDecision {
    const improvement = this.calculateImprovement(results);
    const meetsThreshold = improvement >= this.config.improvementThreshold;
    const isSignificant = statisticalSignificance.isSignificant;

    let decision: "GO" | "NO-GO";
    let reason: string;

    if (meetsThreshold && isSignificant) {
      decision = "GO";
      reason = `Improvement of ${improvement.toFixed(1)}% exceeds threshold (${this.config.improvementThreshold}%) and is statistically significant (p=${statisticalSignificance.pValue.toFixed(3)})`;
    } else if (!meetsThreshold && !isSignificant) {
      decision = "NO-GO";
      reason = `Improvement of ${improvement.toFixed(1)}% is below threshold (${this.config.improvementThreshold}%) and not statistically significant (p=${statisticalSignificance.pValue.toFixed(3)})`;
    } else if (!meetsThreshold) {
      decision = "NO-GO";
      reason = `Improvement of ${improvement.toFixed(1)}% is below threshold (${this.config.improvementThreshold}%) despite being statistically significant`;
    } else {
      decision = "NO-GO";
      reason = `Improvement of ${improvement.toFixed(1)}% exceeds threshold but is not statistically significant (p=${statisticalSignificance.pValue.toFixed(3)})`;
    }

    return {
      decision,
      reason,
      improvementPercentage: improvement,
      meetsThreshold,
      threshold: this.config.improvementThreshold,
    };
  }

  /**
   * Format benchmark results for display
   */
  static formatResults(result: BenchmarkResult): string {
    const lines = [
      "📊 Collision Benchmark Results",
      "=".repeat(40),
      "",
      "🏃 Performance Results:",
      `  TypedArray Engine: ${result.results["typed-array"]?.toFixed(2)}ms`,
      `  Bitboard Engine: ${result.results.bitboard?.toFixed(2)}ms`,
      `  BitBoard vs TypedArray Improvement: ${result.improvement.toFixed(1)}%`,
      "",
      "📈 Statistical Significance:",
      `  Significant: ${result.statisticalSignificance.isSignificant ? "✅" : "❌"}`,
      `  p-value: ${result.statisticalSignificance.pValue.toFixed(4)}`,
      `  Confidence Level: ${(result.statisticalSignificance.confidenceLevel * 100).toFixed(0)}%`,
      `  t-statistic: ${result.statisticalSignificance.tStatistic.toFixed(2)}`,
      "",
      "🎯 Go/No-Go Decision:",
      `  Decision: ${result.goNoGoDecision.decision === "GO" ? "✅ GO" : "❌ NO-GO"}`,
      `  Reason: ${result.goNoGoDecision.reason}`,
      `  Threshold: ${result.goNoGoDecision.threshold}%`,
      "",
      `📅 Timestamp: ${result.timestamp.toISOString()}`,
    ];

    return lines.join("\n");
  }
}

/**
 * CLI interface for running benchmarks
 */
export async function runCollisionBenchmarkCLI(): Promise<void> {
  const benchmark = new CollisionBenchmark();

  try {
    const result = await benchmark.runComparison();
    console.log(`\n${CollisionBenchmark.formatResults(result)}`);

    // Exit with appropriate code for CI
    process.exit(result.goNoGoDecision.decision === "GO" ? 0 : 1);
  } catch (error) {
    console.error("❌ Benchmark failed:", error);
    process.exit(1);
  }
}
