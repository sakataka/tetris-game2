#!/usr/bin/env bun

import { runCollisionBenchmarkCLI } from "./collision-benchmark";

/**
 * CLI entry point for running benchmarks
 * Usage: bun run benchmark [options]
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
🔧 Tetris Game Benchmark CLI

Usage: bun run benchmark [options]

Options:
  --help, -h    Show this help message
  --collision   Run collision detection benchmark (default)
  --ci          Run in CI mode (exit with non-zero code if NO-GO)

Examples:
  bun run benchmark              # Run collision benchmark
  bun run benchmark --collision  # Run collision benchmark explicitly
  bun run benchmark --ci         # Run in CI mode
`);
    process.exit(0);
  }

  // Default to collision benchmark
  const benchmarkType = args.includes("--collision") ? "collision" : "collision";
  const isCIMode = args.includes("--ci");

  console.log(`🚀 Running ${benchmarkType} benchmark...`);

  if (isCIMode) {
    console.log("📊 Running in CI mode - will exit with non-zero code if NO-GO");
  }

  try {
    switch (benchmarkType) {
      case "collision":
        await runCollisionBenchmarkCLI();
        break;
      default:
        console.error(`❌ Unknown benchmark type: ${benchmarkType}`);
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Benchmark execution failed:", error);
    process.exit(1);
  }
}

// Run the CLI if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
