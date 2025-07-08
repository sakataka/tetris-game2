import type { TetrominoTypeName } from "@/types/game";
import { BitBoard } from "../core/bitboard";
import { type AIConfig, type BattleResult, BattleSimulator } from "./battle-simulator";

// Metric definition for A/B testing
export interface MetricDefinition {
  name: string;
  description: string;
  extractor: (result: GameTestResult) => number;
  alpha: number; // Significance level (e.g., 0.05)
  direction: "higher" | "lower"; // Whether higher or lower values are better
  minimumSampleSize?: number;
}

// Game test result
export interface GameTestResult {
  score: number;
  lines: number;
  time: number;
  moves: number;
  efficiency: number;
  survival: number; // How long the AI survived
  piecesPerSecond: number;
  avgDecisionTime: number;
  errors: number;
}

// A/B test configuration
export interface ABTestConfig {
  baselineConfig: AIConfig;
  experimentalConfig: AIConfig;
  metrics: MetricDefinition[];
  minSampleSize: number;
  maxSampleSize: number;
  confidenceLevel: number; // e.g., 0.95
  minimumDetectableEffect: number; // Minimum effect size to detect
}

// Statistical analysis result
export interface StatisticalAnalysis {
  baselineMean: number;
  experimentalMean: number;
  improvement: number; // Percentage improvement
  improvementAbs: number; // Absolute improvement
  pValue: number;
  isSignificant: boolean;
  confidenceInterval: [number, number];
  sampleSize: number;
  effectSize: number; // Cohen's d
}

// A/B test result
export interface ABTestResult {
  testName: string;
  baseline: GameTestResult[];
  experimental: GameTestResult[];
  analysis: Record<string, StatisticalAnalysis>;
  recommendation: "deploy" | "reject" | "inconclusive";
  summary: string;
  duration: number;
  timestamp: number;
}

export class ABTestFramework {
  private battleSimulator: BattleSimulator;

  constructor() {
    this.battleSimulator = new BattleSimulator();
  }

  async compareStrategies(config: ABTestConfig): Promise<ABTestResult> {
    console.log(
      `🧪 Starting A/B Test: ${config.baselineConfig.name} vs ${config.experimentalConfig.name}`,
    );
    console.log(`Metrics: ${config.metrics.map((m) => m.name).join(", ")}`);

    const startTime = Date.now();

    // Calculate required sample size
    const sampleSize = this.calculateSampleSize(config);
    console.log(`Required sample size: ${sampleSize} games per variant`);

    // Collect data
    const [baselineResults, experimentalResults] = await Promise.all([
      this.collectData(config.baselineConfig, sampleSize),
      this.collectData(config.experimentalConfig, sampleSize),
    ]);

    // Perform statistical analysis
    const analysis: Record<string, StatisticalAnalysis> = {};
    for (const metric of config.metrics) {
      const baselineValues = baselineResults.map(metric.extractor);
      const experimentalValues = experimentalResults.map(metric.extractor);

      analysis[metric.name] = this.performStatisticalAnalysis(
        baselineValues,
        experimentalValues,
        metric,
        config.confidenceLevel,
      );
    }

    // Generate recommendation
    const recommendation = this.generateRecommendation(analysis, config.metrics);
    const summary = this.generateSummary(analysis, config);

    const result: ABTestResult = {
      testName: `${config.baselineConfig.name} vs ${config.experimentalConfig.name}`,
      baseline: baselineResults,
      experimental: experimentalResults,
      analysis,
      recommendation,
      summary,
      duration: Date.now() - startTime,
      timestamp: startTime,
    };

    this.logResults(result);
    return result;
  }

  private calculateSampleSize(config: ABTestConfig): number {
    // Power analysis for sample size calculation
    // Using approximation for two-sample t-test
    const alpha = 1 - config.confidenceLevel;
    const beta = 0.2; // 80% power
    const delta = config.minimumDetectableEffect;

    // Approximation: n ≈ 16 / (effect_size^2) for 80% power and 5% significance
    const estimatedSampleSize = Math.ceil(16 / (delta * delta));

    return Math.max(config.minSampleSize, Math.min(config.maxSampleSize, estimatedSampleSize));
  }

  private async collectData(aiConfig: AIConfig, sampleSize: number): Promise<GameTestResult[]> {
    console.log(`Collecting data for ${aiConfig.name} (${sampleSize} games)`);

    const results: GameTestResult[] = [];
    const batchSize = 20;
    const batches = Math.ceil(sampleSize / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, sampleSize);
      const batchGames = batchEnd - batchStart;

      // Run batch games in parallel
      const batchResults = await Promise.all(
        Array.from({ length: batchGames }, (_, i) =>
          this.runSingleTest(aiConfig, batch * batchSize + i),
        ),
      );

      results.push(...batchResults);

      // Progress update
      const progress = (((batch + 1) / batches) * 100).toFixed(1);
      process.stdout.write(`\r  ${aiConfig.name}: ${progress}%`);
    }

    console.log(); // New line
    return results;
  }

  private async runSingleTest(aiConfig: AIConfig, seed: number): Promise<GameTestResult> {
    // Create a standardized test scenario
    const testBoard = this.createTestBoard();
    const pieceSequence = this.generateTestPieceSequence(seed, 500);

    try {
      const startTime = Date.now();
      const gameResult = await this.simulateTestGame(aiConfig, testBoard, pieceSequence);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const piecesPerSecond = gameResult.moves > 0 ? gameResult.moves / (totalTime / 1000) : 0;
      const avgDecisionTime = gameResult.moves > 0 ? totalTime / gameResult.moves : 0;
      const efficiency = gameResult.moves > 0 ? gameResult.score / gameResult.moves : 0;
      const survival = gameResult.moves; // Use moves as survival metric

      return {
        score: gameResult.score,
        lines: gameResult.lines,
        time: totalTime,
        moves: gameResult.moves,
        efficiency,
        survival,
        piecesPerSecond,
        avgDecisionTime,
        errors: 0, // Would track AI errors in full implementation
      };
    } catch (error) {
      // Return poor performance on error
      return {
        score: 0,
        lines: 0,
        time: 60000, // 1 minute penalty
        moves: 0,
        efficiency: 0,
        survival: 0,
        piecesPerSecond: 0,
        avgDecisionTime: 1000,
        errors: 1,
      };
    }
  }

  private createTestBoard(): BitBoard {
    // Create a standardized test board with moderate difficulty
    const board = new BitBoard();

    // Add some initial blocks to create a challenging but fair scenario
    const patterns = [
      0b1111111100, // Row 19: Small gap
      0b1111110111, // Row 18: Single hole
      0b1111101111, // Row 17: Single hole
      0b1111011111, // Row 16: Single hole
    ];

    for (let i = 0; i < patterns.length; i++) {
      board.setRowBits(19 - i, patterns[i]);
    }

    return board;
  }

  private generateTestPieceSequence(seed: number, length: number): TetrominoTypeName[] {
    // Generate a seeded, balanced piece sequence
    let rng = seed;
    const sequence: TetrominoTypeName[] = [];
    const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "L", "J"];

    // Generate sequence with balanced distribution
    const bags = Math.ceil(length / 7);
    for (let bag = 0; bag < bags; bag++) {
      const shuffledBag = [...pieces];

      // Fisher-Yates shuffle with seeded RNG
      for (let i = shuffledBag.length - 1; i > 0; i--) {
        rng = (rng * 1103515245 + 12345) & 0x7fffffff;
        const j = rng % (i + 1);
        [shuffledBag[i], shuffledBag[j]] = [shuffledBag[j], shuffledBag[i]];
      }

      sequence.push(...shuffledBag);
    }

    return sequence.slice(0, length);
  }

  private async simulateTestGame(
    aiConfig: AIConfig,
    board: BitBoard,
    pieces: TetrominoTypeName[],
  ): Promise<{ score: number; lines: number; moves: number }> {
    // Simplified game simulation for testing
    // In full implementation, this would use complete game logic
    let score = 0;
    let lines = 0;
    let moves = 0;

    for (let i = 0; i < Math.min(pieces.length - 5, 100); i++) {
      const currentPiece = pieces[i];
      const nextPieces = pieces.slice(i + 1, i + 6);

      // Simulate AI decision (simplified)
      const moveScore = Math.random() * 100; // Simplified scoring
      const linesCleared = Math.random() < 0.1 ? Math.floor(Math.random() * 4) + 1 : 0;

      score += moveScore + linesCleared * 100;
      lines += linesCleared;
      moves++;

      // Random chance of game over
      if (Math.random() < 0.01) break;
    }

    return { score, lines, moves };
  }

  private performStatisticalAnalysis(
    baseline: number[],
    experimental: number[],
    metric: MetricDefinition,
    confidenceLevel: number,
  ): StatisticalAnalysis {
    const baselineMean = this.mean(baseline);
    const experimentalMean = this.mean(experimental);

    const improvement =
      baselineMean !== 0 ? ((experimentalMean - baselineMean) / baselineMean) * 100 : 0;
    const improvementAbs = experimentalMean - baselineMean;

    // Perform t-test
    const tTestResult = this.tTest(baseline, experimental);
    const pValue = tTestResult.pValue;
    const isSignificant = pValue < 1 - confidenceLevel;

    // Calculate confidence interval for the difference
    const confidenceInterval = this.calculateConfidenceInterval(
      baseline,
      experimental,
      confidenceLevel,
    );

    // Calculate effect size (Cohen's d)
    const pooledStd = this.pooledStandardDeviation(baseline, experimental);
    const effectSize = pooledStd !== 0 ? (experimentalMean - baselineMean) / pooledStd : 0;

    return {
      baselineMean,
      experimentalMean,
      improvement,
      improvementAbs,
      pValue,
      isSignificant,
      confidenceInterval,
      sampleSize: baseline.length,
      effectSize,
    };
  }

  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private standardDeviation(values: number[]): number {
    const mean = this.mean(values);
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private pooledStandardDeviation(group1: number[], group2: number[]): number {
    const n1 = group1.length;
    const n2 = group2.length;
    const s1 = this.standardDeviation(group1);
    const s2 = this.standardDeviation(group2);

    return Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2));
  }

  private tTest(
    group1: number[],
    group2: number[],
  ): { tStatistic: number; pValue: number; degreesOfFreedom: number } {
    const n1 = group1.length;
    const n2 = group2.length;
    const mean1 = this.mean(group1);
    const mean2 = this.mean(group2);
    const pooledStd = this.pooledStandardDeviation(group1, group2);

    const standardError = pooledStd * Math.sqrt(1 / n1 + 1 / n2);
    const tStatistic = (mean1 - mean2) / standardError;
    const degreesOfFreedom = n1 + n2 - 2;

    // Approximate p-value calculation (simplified)
    const pValue = 2 * (1 - this.studentTCDF(Math.abs(tStatistic), degreesOfFreedom));

    return { tStatistic, pValue, degreesOfFreedom };
  }

  private studentTCDF(t: number, df: number): number {
    // Simplified approximation of Student's t-distribution CDF
    // For more accuracy, would use a proper statistical library
    if (df > 30) {
      // Approximate with normal distribution for large df
      return this.normalCDF(t);
    }

    // Rough approximation for small df
    const x = t / Math.sqrt(df);
    return 0.5 + 0.5 * Math.sign(t) * Math.min(0.5, Math.abs(x) / (1 + Math.abs(x)));
  }

  private normalCDF(x: number): number {
    // Approximation of standard normal CDF
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private calculateConfidenceInterval(
    group1: number[],
    group2: number[],
    confidenceLevel: number,
  ): [number, number] {
    const mean1 = this.mean(group1);
    const mean2 = this.mean(group2);
    const pooledStd = this.pooledStandardDeviation(group1, group2);
    const standardError = pooledStd * Math.sqrt(1 / group1.length + 1 / group2.length);

    const alpha = 1 - confidenceLevel;
    const degreesOfFreedom = group1.length + group2.length - 2;

    // Critical t-value (approximation)
    const tCritical = this.getApproximateTCritical(alpha / 2, degreesOfFreedom);

    const difference = mean2 - mean1;
    const marginOfError = tCritical * standardError;

    return [difference - marginOfError, difference + marginOfError];
  }

  private getApproximateTCritical(alpha: number, df: number): number {
    // Simplified approximation - in practice, use statistical tables
    if (df > 30) return 1.96; // Normal approximation
    if (df > 20) return 2.09;
    if (df > 10) return 2.23;
    return 2.78; // Conservative estimate for small df
  }

  private generateRecommendation(
    analysis: Record<string, StatisticalAnalysis>,
    metrics: MetricDefinition[],
  ): "deploy" | "reject" | "inconclusive" {
    let significantImprovements = 0;
    let significantRegressions = 0;
    let totalSignificantResults = 0;

    for (const metric of metrics) {
      const result = analysis[metric.name];

      if (result.isSignificant) {
        totalSignificantResults++;

        const isImprovement =
          (metric.direction === "higher" && result.improvement > 0) ||
          (metric.direction === "lower" && result.improvement < 0);

        if (isImprovement) {
          significantImprovements++;
        } else {
          significantRegressions++;
        }
      }
    }

    // Decision logic
    if (significantRegressions > 0) {
      return "reject"; // Any significant regression is concerning
    }

    if (significantImprovements >= Math.ceil(metrics.length / 2)) {
      return "deploy"; // Majority of metrics show significant improvement
    }

    if (totalSignificantResults === 0) {
      return "inconclusive"; // No significant results
    }

    return "inconclusive";
  }

  private generateSummary(
    analysis: Record<string, StatisticalAnalysis>,
    config: ABTestConfig,
  ): string {
    const significantMetrics = Object.entries(analysis)
      .filter(([_, result]) => result.isSignificant)
      .map(([name, result]) => `${name}: ${result.improvement.toFixed(1)}%`);

    if (significantMetrics.length === 0) {
      return "No statistically significant differences detected between the strategies.";
    }

    return (
      `Significant improvements detected in: ${significantMetrics.join(", ")}. ` +
      `Based on ${analysis[Object.keys(analysis)[0]].sampleSize} games per variant.`
    );
  }

  private logResults(result: ABTestResult): void {
    console.log(`\n📊 A/B Test Results: ${result.testName}`);
    console.log("=".repeat(50));
    console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
    console.log(`Recommendation: ${result.recommendation.toUpperCase()}`);
    console.log(`Summary: ${result.summary}`);
    console.log("\nDetailed Analysis:");

    Object.entries(result.analysis).forEach(([metric, analysis]) => {
      const significanceMarker = analysis.isSignificant ? "✓" : "○";
      const direction = analysis.improvement > 0 ? "↗" : "↘";

      console.log(`  ${significanceMarker} ${metric}:`);
      console.log(`    Baseline: ${analysis.baselineMean.toFixed(2)}`);
      console.log(`    Experimental: ${analysis.experimentalMean.toFixed(2)}`);
      console.log(`    Improvement: ${direction} ${analysis.improvement.toFixed(1)}%`);
      console.log(`    P-value: ${analysis.pValue.toFixed(4)}`);
      console.log(`    Effect size: ${analysis.effectSize.toFixed(3)}`);
    });
  }
}

// Predefined metrics for Tetris AI testing
export const TETRIS_METRICS: MetricDefinition[] = [
  {
    name: "Score",
    description: "Total game score achieved",
    extractor: (result) => result.score,
    alpha: 0.05,
    direction: "higher",
  },
  {
    name: "Lines Cleared",
    description: "Total lines cleared during the game",
    extractor: (result) => result.lines,
    alpha: 0.05,
    direction: "higher",
  },
  {
    name: "Efficiency",
    description: "Score per piece placed",
    extractor: (result) => result.efficiency,
    alpha: 0.05,
    direction: "higher",
  },
  {
    name: "Survival",
    description: "Number of pieces placed before game over",
    extractor: (result) => result.survival,
    alpha: 0.05,
    direction: "higher",
  },
  {
    name: "Decision Speed",
    description: "Average decision time per move",
    extractor: (result) => result.avgDecisionTime,
    alpha: 0.05,
    direction: "lower",
  },
  {
    name: "Pieces Per Second",
    description: "Game speed in pieces per second",
    extractor: (result) => result.piecesPerSecond,
    alpha: 0.05,
    direction: "higher",
  },
];
