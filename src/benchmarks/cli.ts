#!/usr/bin/env bun

import { runAIEngineBenchmarkCLI } from "./ai-engine-cli";
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
  --collision   Run collision detection benchmark
  --ai          Run AI engine performance benchmark
  --all         Run all benchmarks
  --ci          Run in CI mode (exit with non-zero code if NO-GO)

Examples:
  bun run benchmark              # Run AI benchmark (default)
  bun run benchmark --collision  # Run collision benchmark
  bun run benchmark --ai         # Run AI benchmark
  bun run benchmark --all        # Run all benchmarks
  bun run benchmark --ci         # Run in CI mode
`);
    process.exit(0);
  }

  // Determine benchmark type - default to AI benchmark
  let benchmarkType = "ai"; // Default changed to AI as per Issue #115

  if (args.includes("--collision")) {
    benchmarkType = "collision";
  } else if (args.includes("--ai")) {
    benchmarkType = "ai";
  } else if (args.includes("--all")) {
    benchmarkType = "all";
  }

  const isCIMode = args.includes("--ci");

  if (isCIMode) {
    console.log("📊 Running in CI mode - will exit with non-zero code if NO-GO");
  }

  try {
    switch (benchmarkType) {
      case "collision":
        console.log("🚀 Running collision detection benchmark...");
        await runCollisionBenchmarkCLI();
        break;
      case "ai":
        console.log("🚀 Running AI engine performance benchmark...");
        await runAIEngineBenchmarkCLI();
        break;
      case "all":
        console.log("🚀 Running all benchmarks...");
        console.log("\n1️⃣ Starting collision detection benchmark:");
        await runCollisionBenchmarkCLI();
        console.log("\n2️⃣ Starting AI engine performance benchmark:");
        await runAIEngineBenchmarkCLI();
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
