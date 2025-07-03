import { expect, test } from "@playwright/test";

// Configure for visual demonstration
test.use({
  headless: false,
  video: "retain-on-failure",
  trace: "retain-on-failure",
});

test.describe("Tetris Visual Demo", () => {
  test.beforeEach(async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // Extra wait to see loading
  });

  test("Visual Demo: Watch Tetris Gameplay", async ({ page }) => {
    console.log("🎮 Starting Tetris Visual Demo...");

    // Wait for desktop layout
    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    console.log("✅ Game loaded - you should see the Tetris game now!");
    await page.waitForTimeout(2000);

    console.log("⬅️ Testing LEFT movement...");
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(800); // Slow motion
    }

    console.log("⬆️ Testing ROTATION...");
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(1000);

    console.log("➡️ Testing RIGHT movement...");
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(800);
    }

    console.log("⬇️ Testing SOFT DROP...");
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(500);
    }

    console.log("🎯 Testing HOLD PIECE...");
    await page.keyboard.press("KeyC");
    await page.waitForTimeout(1500);

    console.log("💥 Testing HARD DROP...");
    await page.keyboard.press("Space");
    await page.waitForTimeout(1500);

    console.log("🚀 Starting automated gameplay sequence...");

    // Automated gameplay with visual pauses
    for (let round = 0; round < 8; round++) {
      console.log(`Round ${round + 1}/8: Placing piece...`);

      // Move to position based on round
      const moves = round % 4;
      for (let m = 0; m < moves; m++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(300);
      }

      // Sometimes rotate
      if (round % 3 === 0) {
        console.log("   🔄 Rotating piece...");
        await page.keyboard.press("ArrowUp");
        await page.waitForTimeout(500);
      }

      // Drop piece
      console.log("   ⬇️ Dropping piece...");
      await page.keyboard.press("Space");
      await page.waitForTimeout(1000);

      // Check for game over
      try {
        const gameOverDialog = page.locator('[role="dialog"]').first();
        if (await gameOverDialog.isVisible()) {
          console.log("🎬 GAME OVER! Demo completed successfully.");
          await page.waitForTimeout(3000); // Show game over screen
          return;
        }
      } catch (_e) {
        // Continue if check fails
      }
    }

    console.log("✨ Demo completed - 8 pieces placed successfully!");
    await page.waitForTimeout(3000); // Final pause to see result
  });

  test("Quick Demo: Basic Controls", async ({ page }) => {
    console.log("🎮 Quick Controls Demo...");

    // Wait for desktop layout
    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    await page.waitForTimeout(1000);

    console.log("Testing all controls in sequence...");

    // Left
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(1000);

    // Right
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(1000);

    // Rotate
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(1000);

    // Hold
    await page.keyboard.press("KeyC");
    await page.waitForTimeout(1500);

    // Hard drop
    await page.keyboard.press("Space");
    await page.waitForTimeout(2000);

    console.log("✅ Controls demo complete!");
  });
});
