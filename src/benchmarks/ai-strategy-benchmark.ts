import { Bench } from "tinybench";
import { AdvancedAIEngine } from "@/game/ai/core/advanced-ai-engine";
import { AIEngine } from "@/game/ai/core/ai-engine";
import { BitBoard } from "@/game/ai/core/bitboard";
import { AdvancedFeatures } from "@/game/ai/evaluators/advanced-features";
import { DellacherieEvaluator } from "@/game/ai/evaluators/dellacherie";
import { PatternEvaluator } from "@/game/ai/evaluators/pattern-evaluator";
import { DEFAULT_PATTERN_WEIGHTS } from "@/game/ai/evaluators/patterns";
import { BeamSearch } from "@/game/ai/search/beam-search";
import { calculateSurfaceProfile } from "@/game/ai/search/diversity-beam-search";
import type { Position, TetrominoTypeName } from "@/types/game";

// Test data setup
function createTestBoard(complexity: "simple" | "medium" | "complex"): BitBoard {
  const board = new BitBoard();

  switch (complexity) {
    case "simple":
      // Simple board with few holes
      for (let y = 17; y < 20; y++) {
        board.setRowBits(y, 0b1111111100); // Leave rightmost 2 empty
      }
      break;

    case "medium": {
      // Medium complexity with scattered holes
      const mediumPatterns = [
        0b1111110111, // Row 19: One hole
        0b1111101111, // Row 18: One hole
        0b1111011111, // Row 17: One hole
        0b1110111111, // Row 16: One hole
        0b1101111111, // Row 15: One hole
      ];
      for (let i = 0; i < mediumPatterns.length; i++) {
        board.setRowBits(19 - i, mediumPatterns[i]);
      }
      break;
    }

    case "complex": {
      // Complex board with many holes and wells
      const complexPatterns = [
        0b1110111011, // Row 19: Multiple holes
        0b1101110111, // Row 18: Multiple holes
        0b1011101110, // Row 17: Multiple holes
        0b0111011101, // Row 16: Multiple holes
        0b1110111011, // Row 15: Multiple holes
        0b1101110111, // Row 14: Multiple holes
        0b1011101110, // Row 13: Multiple holes
      ];
      for (let i = 0; i < complexPatterns.length; i++) {
        board.setRowBits(19 - i, complexPatterns[i]);
      }
      break;
    }
  }

  return board;
}

function createTestPieceQueue(length: number): TetrominoTypeName[] {
  const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "L", "J"];
  const queue: TetrominoTypeName[] = [];

  for (let i = 0; i < length; i++) {
    queue.push(pieces[i % pieces.length]);
  }

  return queue;
}

// Benchmark configuration
const BENCHMARK_CONFIG = {
  time: 1000, // Run each benchmark for 1 second
  iterations: 10,
  warmupTime: 100,
};

// Test scenarios
const TEST_SCENARIOS = {
  simple: {
    board: createTestBoard("simple"),
    pieces: createTestPieceQueue(3),
    description: "Simple board evaluation",
  },
  medium: {
    board: createTestBoard("medium"),
    pieces: createTestPieceQueue(4),
    description: "Medium complexity board",
  },
  complex: {
    board: createTestBoard("complex"),
    pieces: createTestPieceQueue(5),
    description: "Complex board with holes",
  },
};

export async function runAIStrategyBenchmarks(): Promise<BenchmarkResults> {
  console.log("🚀 Starting AI Strategy Benchmarks");
  console.log("==================================");

  const results: BenchmarkResults = {
    evaluationBenchmarks: {
      basicDellacherie: null as any,
      advancedFeatures: null as any,
      patternRecognition: null as any,
      combinedEvaluation: null as any,
    },
    searchBenchmarks: {
      standardBeam: null as any,
      wideBeam: null as any,
      deepBeam: null as any,
      diversityBeam: null as any,
    },
    integrationBenchmarks: {
      basicAI: null as any,
      advancedAI: null as any,
      fullFeaturedAI: null as any,
    },
    summary: {
      totalTime: 0,
      overheadAnalysis: {
        evaluation: {} as any,
        search: {} as any,
        integration: {} as any,
      },
      recommendations: [],
    },
  };

  // 1. Evaluation Benchmarks
  await runEvaluationBenchmarks(results);

  // 2. Search Algorithm Benchmarks
  await runSearchBenchmarks(results);

  // 3. Integration Benchmarks
  await runIntegrationBenchmarks(results);

  // 4. Generate Performance Analysis
  generatePerformanceAnalysis(results);

  return results;
}

async function runEvaluationBenchmarks(results: BenchmarkResults): Promise<void> {
  console.log("\n📊 Evaluation Benchmarks");
  console.log("------------------------");

  const bench = new Bench(BENCHMARK_CONFIG);

  const testPosition: Position = { x: 4, y: 0 };
  const testPiece: TetrominoTypeName = "T";

  // Basic Dellacherie evaluation
  bench.add("Basic Dellacherie", () => {
    const evaluator = new DellacherieEvaluator();
    evaluator.evaluate(TEST_SCENARIOS.medium.board, { piece: testPiece, position: testPosition });
  });

  // Advanced features evaluation
  bench.add("Advanced Features", () => {
    const advancedFeatures = new AdvancedFeatures();
    advancedFeatures.evaluateTerrain(TEST_SCENARIOS.medium.board);
  });

  // Pattern recognition evaluation
  const patternEvaluator = new PatternEvaluator({
    enablePatterns: true,
    patternWeights: DEFAULT_PATTERN_WEIGHTS,
    useDynamicWeights: true,
    queueLookahead: 7,
    enableMidGamePatterns: true,
  });

  bench.add("Pattern Recognition", () => {
    patternEvaluator.setPieceQueue(TEST_SCENARIOS.medium.pieces, 0, 1);
    patternEvaluator.getAvailablePatterns(TEST_SCENARIOS.medium.board);
  });

  // Combined evaluation (realistic scenario)
  bench.add("Combined Evaluation", () => {
    const dellacherie = new DellacherieEvaluator();
    const advancedFeatures = new AdvancedFeatures();
    const basicScore = dellacherie.evaluate(TEST_SCENARIOS.medium.board, {
      piece: testPiece,
      position: testPosition,
    });
    const advancedScore = advancedFeatures.evaluateTerrain(TEST_SCENARIOS.medium.board);
    patternEvaluator.setPieceQueue(TEST_SCENARIOS.medium.pieces, 0, 1);
    const patterns = patternEvaluator.getAvailablePatterns(TEST_SCENARIOS.medium.board);

    return {
      basic: basicScore,
      advanced: advancedScore.smoothness,
      patterns: patterns.length,
    };
  });

  await bench.run();

  results.evaluationBenchmarks = {
    basicDellacherie: bench.tasks[0].result!,
    advancedFeatures: bench.tasks[1].result!,
    patternRecognition: bench.tasks[2].result!,
    combinedEvaluation: bench.tasks[3].result!,
  };

  console.log("Basic Dellacherie:", formatBenchmarkResult(bench.tasks[0].result!));
  console.log("Advanced Features:", formatBenchmarkResult(bench.tasks[1].result!));
  console.log("Pattern Recognition:", formatBenchmarkResult(bench.tasks[2].result!));
  console.log("Combined Evaluation:", formatBenchmarkResult(bench.tasks[3].result!));
}

async function runSearchBenchmarks(results: BenchmarkResults): Promise<void> {
  console.log("\n🔍 Search Algorithm Benchmarks");
  console.log("------------------------------");

  const bench = new Bench({ ...BENCHMARK_CONFIG, time: 2000 }); // Longer time for search

  // Standard beam search
  const beamSearch = new BeamSearch({
    beamWidth: 30,
    maxDepth: 3,
    timeLimit: 150,
  });

  bench.add("Beam Search (w=30, d=3)", () => {
    beamSearch.search(
      TEST_SCENARIOS.medium.board,
      TEST_SCENARIOS.medium.pieces[0],
      TEST_SCENARIOS.medium.pieces.slice(1),
    );
  });

  // Wide beam search
  const wideBeamSearch = new BeamSearch({
    beamWidth: 50,
    maxDepth: 3,
    timeLimit: 150,
  });

  bench.add("Wide Beam Search (w=50, d=3)", () => {
    wideBeamSearch.search(
      TEST_SCENARIOS.medium.board,
      TEST_SCENARIOS.medium.pieces[0],
      TEST_SCENARIOS.medium.pieces.slice(1),
    );
  });

  // Deep beam search
  const deepBeamSearch = new BeamSearch({
    beamWidth: 30,
    maxDepth: 4,
    timeLimit: 200,
  });

  bench.add("Deep Beam Search (w=30, d=4)", () => {
    deepBeamSearch.search(
      TEST_SCENARIOS.medium.board,
      TEST_SCENARIOS.medium.pieces[0],
      TEST_SCENARIOS.medium.pieces.slice(1),
    );
  });

  // Diversity beam search (using utility function)
  bench.add("Diversity Beam Search", () => {
    calculateSurfaceProfile(TEST_SCENARIOS.medium.board);
  });

  await bench.run();

  results.searchBenchmarks = {
    standardBeam: bench.tasks[0].result!,
    wideBeam: bench.tasks[1].result!,
    deepBeam: bench.tasks[2].result!,
    diversityBeam: bench.tasks[3].result!,
  };

  console.log("Standard Beam (w=30, d=3):", formatBenchmarkResult(bench.tasks[0].result!));
  console.log("Wide Beam (w=50, d=3):", formatBenchmarkResult(bench.tasks[1].result!));
  console.log("Deep Beam (w=30, d=4):", formatBenchmarkResult(bench.tasks[2].result!));
  console.log("Diversity Beam:", formatBenchmarkResult(bench.tasks[3].result!));
}

async function runIntegrationBenchmarks(results: BenchmarkResults): Promise<void> {
  console.log("\n🔗 Integration Benchmarks");
  console.log("-------------------------");

  const bench = new Bench({ ...BENCHMARK_CONFIG, time: 3000 }); // Longest time for integration

  // Basic AI Engine (Dellacherie only)
  const basicAI = new AIEngine({
    thinkingTimeLimit: 150,
    evaluator: "dellacherie",
    enableLogging: false,
    fallbackOnTimeout: true,
    useDynamicWeights: false,
  });

  bench.add("Basic AI Engine", async () => {
    await basicAI.findBestMove(
      TEST_SCENARIOS.medium.board,
      TEST_SCENARIOS.medium.pieces[0],
      TEST_SCENARIOS.medium.pieces.slice(1),
    );
  });

  // Advanced AI Engine (with beam search)
  const advancedAI = new AdvancedAIEngine({
    thinkingTimeLimit: 150,
    evaluator: "dellacherie",
    enableLogging: false,
    fallbackOnTimeout: true,
    useDynamicWeights: true,
    beamSearchConfig: {
      beamWidth: 30,
      maxDepth: 3,
      timeLimit: 150,
    },
    enableAdvancedFeatures: true,
    enablePatternDetection: true,
  });

  bench.add("Advanced AI Engine", async () => {
    await advancedAI.findBestMove(
      TEST_SCENARIOS.medium.board,
      TEST_SCENARIOS.medium.pieces[0],
      TEST_SCENARIOS.medium.pieces.slice(1),
    );
  });

  // Full-featured AI (all optimizations enabled)
  const fullAI = new AdvancedAIEngine({
    thinkingTimeLimit: 150,
    evaluator: "dellacherie",
    enableLogging: false,
    fallbackOnTimeout: true,
    useDynamicWeights: true,
    beamSearchConfig: {
      beamWidth: 40,
      maxDepth: 3,
      enableHold: true,
      timeLimit: 150,
    },
    enableAdvancedFeatures: true,
    enablePatternDetection: true,
  });

  bench.add("Full-Featured AI", async () => {
    await fullAI.findBestMove(
      TEST_SCENARIOS.medium.board,
      TEST_SCENARIOS.medium.pieces[0],
      TEST_SCENARIOS.medium.pieces.slice(1),
    );
  });

  await bench.run();

  results.integrationBenchmarks = {
    basicAI: bench.tasks[0].result!,
    advancedAI: bench.tasks[1].result!,
    fullFeaturedAI: bench.tasks[2].result!,
  };

  console.log("Basic AI Engine:", formatBenchmarkResult(bench.tasks[0].result!));
  console.log("Advanced AI Engine:", formatBenchmarkResult(bench.tasks[1].result!));
  console.log("Full-Featured AI:", formatBenchmarkResult(bench.tasks[2].result!));
}

function generatePerformanceAnalysis(results: BenchmarkResults): void {
  console.log("\n📈 Performance Analysis");
  console.log("-----------------------");

  // Calculate overhead for each category
  const evalBaseline = results.evaluationBenchmarks.basicDellacherie.mean;
  const searchBaseline = results.searchBenchmarks.standardBeam.mean;
  const integrationBaseline = results.integrationBenchmarks.basicAI.mean;

  results.summary.overheadAnalysis = {
    evaluation: {
      advancedFeatures: calculateOverhead(
        results.evaluationBenchmarks.advancedFeatures.mean,
        evalBaseline,
      ),
      patternRecognition: calculateOverhead(
        results.evaluationBenchmarks.patternRecognition.mean,
        evalBaseline,
      ),
      combinedEvaluation: calculateOverhead(
        results.evaluationBenchmarks.combinedEvaluation.mean,
        evalBaseline,
      ),
    },
    search: {
      wideBeam: calculateOverhead(results.searchBenchmarks.wideBeam.mean, searchBaseline),
      deepBeam: calculateOverhead(results.searchBenchmarks.deepBeam.mean, searchBaseline),
      diversityBeam: calculateOverhead(results.searchBenchmarks.diversityBeam.mean, searchBaseline),
    },
    integration: {
      advancedAI: calculateOverhead(
        results.integrationBenchmarks.advancedAI.mean,
        integrationBaseline,
      ),
      fullFeaturedAI: calculateOverhead(
        results.integrationBenchmarks.fullFeaturedAI.mean,
        integrationBaseline,
      ),
    },
  };

  // Generate recommendations
  results.summary.recommendations = generateRecommendations(results);

  // Display analysis
  console.log("\nOverhead Analysis:");
  console.log("Evaluation Features:");
  Object.entries(results.summary.overheadAnalysis.evaluation).forEach(([feature, overhead]) => {
    console.log(`  ${feature}: +${overhead.toFixed(1)}%`);
  });

  console.log("Search Algorithms:");
  Object.entries(results.summary.overheadAnalysis.search).forEach(([algorithm, overhead]) => {
    console.log(`  ${algorithm}: +${overhead.toFixed(1)}%`);
  });

  console.log("Integration:");
  Object.entries(results.summary.overheadAnalysis.integration).forEach(
    ([integration, overhead]) => {
      console.log(`  ${integration}: +${overhead.toFixed(1)}%`);
    },
  );

  console.log("\nRecommendations:");
  results.summary.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
}

function calculateOverhead(value: number, baseline: number): number {
  return ((value - baseline) / baseline) * 100;
}

function generateRecommendations(results: BenchmarkResults): string[] {
  const recommendations: string[] = [];
  const overheads = results.summary.overheadAnalysis;

  // Evaluation recommendations
  if (overheads.evaluation.advancedFeatures < 50) {
    recommendations.push("Advanced features add minimal overhead - recommended for production");
  } else {
    recommendations.push(
      "Advanced features add significant overhead - consider selective enabling",
    );
  }

  if (overheads.evaluation.patternRecognition > 100) {
    recommendations.push("Pattern recognition is expensive - use only in strategic situations");
  }

  // Search recommendations
  if (overheads.search.diversityBeam < 30) {
    recommendations.push("Diversity beam search offers good exploration with minimal cost");
  }

  if (overheads.search.deepBeam > 200) {
    recommendations.push("Deep beam search (d=4) may be too expensive for real-time play");
  }

  // Integration recommendations
  if (overheads.integration.fullFeaturedAI < 150) {
    recommendations.push("Full-featured AI is viable for production use");
  } else {
    recommendations.push("Consider disabling some features for better performance");
  }

  return recommendations;
}

function formatBenchmarkResult(result: any): string {
  return `${result.mean.toFixed(3)}ms ±${result.rme.toFixed(1)}% (${result.samples} samples)`;
}

// Types
export interface BenchmarkResults {
  evaluationBenchmarks: {
    basicDellacherie: any;
    advancedFeatures: any;
    patternRecognition: any;
    combinedEvaluation: any;
  };
  searchBenchmarks: {
    standardBeam: any;
    wideBeam: any;
    deepBeam: any;
    diversityBeam: any;
  };
  integrationBenchmarks: {
    basicAI: any;
    advancedAI: any;
    fullFeaturedAI: any;
  };
  summary: {
    totalTime: number;
    overheadAnalysis: {
      evaluation: Record<string, number>;
      search: Record<string, number>;
      integration: Record<string, number>;
    };
    recommendations: string[];
  };
}

// CLI runner
if (import.meta.main) {
  runAIStrategyBenchmarks()
    .then((results) => {
      console.log("\n✅ Benchmarks completed successfully");
      console.log(`Total benchmark time: ${results.summary.totalTime.toFixed(2)}s`);
    })
    .catch((error) => {
      console.error("❌ Benchmark failed:", error);
      process.exit(1);
    });
}
