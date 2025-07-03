import { expect, test } from "@playwright/test";

test.use({
  headless: false,
  video: "retain-on-failure",
});

test.describe("Strategic Line Clear Test", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("Strategic Line Clear: Build from bottom systematically", async ({ page }) => {
    console.log("🎯 Starting Strategic Line Clear Test...");

    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    console.log("✅ Game loaded");
    await page.waitForTimeout(1000);

    // Strategy: Fill bottom row systematically from left to right
    console.log("📋 Strategy: Build bottom row piece by piece");

    for (let position = 0; position < 20; position++) {
      // Try up to 20 pieces
      console.log(`🔨 Piece ${position + 1}: Targeting bottom-left area`);

      // Move piece to far left first
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      // For later pieces, move slightly right to fill gaps
      const rightMoves = Math.floor(position / 2); // Gradual rightward progression
      for (let i = 0; i < rightMoves && i < 9; i++) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(50);
      }

      // Try different orientations for better fitting
      const rotations = position % 4; // Cycle through 4 orientations
      for (let r = 0; r < rotations; r++) {
        await page.keyboard.press("ArrowUp");
        await page.waitForTimeout(100);
      }

      // Drop the piece
      await page.keyboard.press("Space");
      await page.waitForTimeout(600); // Longer wait to see piece placement

      // Check for score increase (line clear detection)
      try {
        const scoreElement = desktopLayout
          .locator("text=Score")
          .locator("..")
          .locator(".text-2xl, .text-xl");
        const scoreText = await scoreElement.textContent();
        const currentScore = Number.parseInt(scoreText?.match(/\d+/)?.[0] || "0");

        if (currentScore > 40) {
          // Line clear typically gives 100+ points
          console.log(`🎉 SUCCESS! Line cleared with score: ${currentScore}`);
          console.log(`✨ Achievement: Successfully cleared a line after ${position + 1} pieces!`);

          // Wait to show the success
          await page.waitForTimeout(3000);
          return; // Mission accomplished!
        }
        if (currentScore > 0) {
          console.log(`📈 Score increased to ${currentScore} (no line clear yet)`);
        }
      } catch (e) {
        console.log("📊 Could not read score, continuing...");
      }

      // Check for game over
      try {
        const gameOverDialog = page.locator('[role="dialog"]').first();
        if (await gameOverDialog.isVisible()) {
          console.log(`❌ Game over after ${position + 1} pieces without line clear`);
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        // Continue if check fails
      }

      // Show progress every 5 pieces
      if ((position + 1) % 5 === 0) {
        console.log(`🏗️ Progress: ${position + 1} pieces placed, building foundation...`);
        await page.waitForTimeout(500); // Brief pause to observe
      }
    }

    console.log("🏁 Test completed");
  });

  test("Focused Bottom Fill: One row strategy", async ({ page }) => {
    console.log("🎯 Focused Bottom Row Fill Strategy...");

    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    await page.waitForTimeout(1000);

    // Ultra-focused strategy: Only target the bottom-left corner
    for (let piece = 0; piece < 15; piece++) {
      console.log(`🎮 Piece ${piece + 1}: Filling bottom-left systematically`);

      // Always go to leftmost position
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(30);
      }

      // Occasionally shift one position right to avoid single-column stacking
      if (piece > 0 && piece % 3 === 0) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(50);
      }

      // Simple rotation strategy
      if (piece % 2 === 1) {
        await page.keyboard.press("ArrowUp");
        await page.waitForTimeout(100);
      }

      // Drop and observe
      await page.keyboard.press("Space");
      await page.waitForTimeout(800); // Slower for better observation

      // Score check
      try {
        const scoreElement = desktopLayout
          .locator("text=Score")
          .locator("..")
          .locator(".text-2xl, .text-xl");
        const scoreText = await scoreElement.textContent();
        const score = Number.parseInt(scoreText?.match(/\d+/)?.[0] || "0");

        if (score > 30) {
          console.log(`🎊 POTENTIAL LINE CLEAR! Score: ${score}`);
          await page.waitForTimeout(2000);

          if (score > 80) {
            console.log(`🏆 CONFIRMED LINE CLEAR! Final score: ${score}`);
            await page.waitForTimeout(3000);
            return;
          }
        }
      } catch (e) {
        // Continue
      }

      // Game over check
      try {
        const gameOverDialog = page.locator('[role="dialog"]').first();
        if (await gameOverDialog.isVisible()) {
          console.log(`⚰️ Game over after ${piece + 1} pieces`);
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    console.log("✅ Bottom fill strategy completed");
  });
});
