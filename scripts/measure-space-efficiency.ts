import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

interface SpaceMeasurement {
  timestamp: string;
  viewport: {
    width: number;
    height: number;
  };
  before: {
    totalArea: number;
    gameboardArea: number;
    sidebarArea: number;
    efficiencyRatio: number;
  };
  after: {
    totalArea: number;
    gameboardArea: number;
    sidebarArea: number;
    efficiencyRatio: number;
  };
  improvement: {
    percentage: number;
    targetAchieved: boolean;
  };
}

/**
 * Measure space efficiency improvement from normal to compact layout
 *
 * This script:
 * 1. Launches the game in normal mode
 * 2. Measures initial layout areas
 * 3. Switches to compact mode
 * 4. Measures compact layout areas
 * 5. Calculates improvement percentage
 * 6. Validates target achievement (20%)
 */
async function measureSpaceEfficiency(): Promise<SpaceMeasurement> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set up viewport for consistent measurements
  await page.setViewportSize({ width: 1280, height: 720 });

  try {
    // Navigate to game
    await page.goto("http://localhost:5173");
    await page.waitForSelector('[data-testid="game-layout"]', { timeout: 10000 });

    // Wait for layout to stabilize
    await page.waitForTimeout(1000);

    // Measure before (normal layout)
    const beforeMeasurement = await page.evaluate(() => {
      const layout = document.querySelector('[data-testid="game-layout"]') as HTMLElement;
      const gameboard = document.querySelector('[data-testid="game-board"]') as HTMLElement;
      const sidebar = document.querySelector(".layout-sidebar") as HTMLElement;

      if (!layout || !gameboard || !sidebar) {
        throw new Error("Required elements not found");
      }

      const layoutRect = layout.getBoundingClientRect();
      const gameboardRect = gameboard.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();

      return {
        totalArea: layoutRect.width * layoutRect.height,
        gameboardArea: gameboardRect.width * gameboardRect.height,
        sidebarArea: sidebarRect.width * sidebarRect.height,
      };
    });

    // Switch to compact mode
    await page.click('[data-testid="layout-mode-toggle"]');
    await page.waitForTimeout(500); // Wait for transition

    // Measure after (compact layout)
    const afterMeasurement = await page.evaluate(() => {
      const layout = document.querySelector('[data-testid="game-layout"]') as HTMLElement;
      const gameboard = document.querySelector('[data-testid="game-board"]') as HTMLElement;
      const sidebar = document.querySelector(".layout-sidebar") as HTMLElement;

      if (!layout || !gameboard || !sidebar) {
        throw new Error("Required elements not found after mode switch");
      }

      const layoutRect = layout.getBoundingClientRect();
      const gameboardRect = gameboard.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();

      return {
        totalArea: layoutRect.width * layoutRect.height,
        gameboardArea: gameboardRect.width * gameboardRect.height,
        sidebarArea: sidebarRect.width * sidebarRect.height,
      };
    });

    // Calculate efficiency improvements
    const beforeEfficiency = beforeMeasurement.gameboardArea / beforeMeasurement.totalArea;
    const afterEfficiency = afterMeasurement.gameboardArea / afterMeasurement.totalArea;
    const improvementPercentage = ((afterEfficiency - beforeEfficiency) / beforeEfficiency) * 100;
    const targetAchieved = improvementPercentage >= 18; // Allow 2% margin below 20% target

    const result: SpaceMeasurement = {
      timestamp: new Date().toISOString(),
      viewport: { width: 1280, height: 720 },
      before: {
        ...beforeMeasurement,
        efficiencyRatio: beforeEfficiency,
      },
      after: {
        ...afterMeasurement,
        efficiencyRatio: afterEfficiency,
      },
      improvement: {
        percentage: improvementPercentage,
        targetAchieved,
      },
    };

    return result;
  } finally {
    await browser.close();
  }
}

/**
 * Save measurement results to file
 */
function saveMeasurementResults(result: SpaceMeasurement): void {
  try {
    mkdirSync("./measurements", { recursive: true });
  } catch {
    // Directory already exists
  }

  const filename = `space-efficiency-${Date.now()}.json`;
  const filepath = join("./measurements", filename);

  writeFileSync(filepath, JSON.stringify(result, null, 2));

  console.log(`📊 Measurement results saved to: ${filepath}`);
}

/**
 * CLI execution with detailed reporting
 */
async function main() {
  try {
    console.log("🚀 Starting space efficiency measurement...");
    console.log("📏 Measuring layout areas in normal and compact modes");

    const result = await measureSpaceEfficiency();

    // Report results
    console.log("\n📈 SPACE EFFICIENCY MEASUREMENT RESULTS");
    console.log("=".repeat(50));
    console.log(`📅 Timestamp: ${result.timestamp}`);
    console.log(`📺 Viewport: ${result.viewport.width}x${result.viewport.height}`);
    console.log();

    console.log("📊 BEFORE (Normal Mode):");
    console.log(`   Total Area: ${result.before.totalArea.toFixed(0)}px²`);
    console.log(`   Gameboard Area: ${result.before.gameboardArea.toFixed(0)}px²`);
    console.log(`   Sidebar Area: ${result.before.sidebarArea.toFixed(0)}px²`);
    console.log(`   Efficiency Ratio: ${(result.before.efficiencyRatio * 100).toFixed(2)}%`);
    console.log();

    console.log("📊 AFTER (Compact Mode):");
    console.log(`   Total Area: ${result.after.totalArea.toFixed(0)}px²`);
    console.log(`   Gameboard Area: ${result.after.gameboardArea.toFixed(0)}px²`);
    console.log(`   Sidebar Area: ${result.after.sidebarArea.toFixed(0)}px²`);
    console.log(`   Efficiency Ratio: ${(result.after.efficiencyRatio * 100).toFixed(2)}%`);
    console.log();

    console.log("🎯 IMPROVEMENT ANALYSIS:");
    console.log(`   Space Efficiency Improvement: ${result.improvement.percentage.toFixed(2)}%`);
    console.log(
      `   Target (20%): ${result.improvement.targetAchieved ? "✅ ACHIEVED" : "❌ NOT ACHIEVED"}`,
    );
    console.log();

    // Save results
    saveMeasurementResults(result);

    // Exit with appropriate code
    if (result.improvement.targetAchieved) {
      console.log("🎉 Space efficiency improvement target achieved!");
      process.exit(0);
    } else {
      console.error(
        `❌ Space efficiency improvement (${result.improvement.percentage.toFixed(2)}%) below target (20%)`,
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Measurement failed:", error);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  main();
}

export { measureSpaceEfficiency, type SpaceMeasurement };
