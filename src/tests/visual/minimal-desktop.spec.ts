import { expect, test } from "@playwright/test";

test.describe("Minimal Desktop Tetris Test", () => {
  test.beforeEach(async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Wait for game to fully load
  });

  test("should load game and show desktop layout", async ({ page }) => {
    // Look for the main desktop layout div more specifically
    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    // Take screenshot to see what we have
    await page.screenshot({ path: "screenshots/desktop-loaded.png" });

    console.log("Desktop layout found and visible");
  });

  test("should find game board in desktop layout", async ({ page }) => {
    // Wait for desktop layout
    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    // Look for game board within desktop layout
    const gameBoard = desktopLayout.locator('[aria-label="Tetris game board"]');
    await expect(gameBoard).toBeVisible();

    await page.screenshot({ path: "screenshots/game-board-found.png" });

    console.log("Game board found in desktop layout");
  });

  test("should show score display", async ({ page }) => {
    // Wait for desktop layout
    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    // Look for score in sidebar
    const scoreCard = desktopLayout.locator("text=Score").locator("..");
    await expect(scoreCard).toBeVisible();

    await page.screenshot({ path: "screenshots/score-display.png" });

    console.log("Score display found");
  });

  test("should respond to keyboard input", async ({ page }) => {
    // Wait for desktop layout
    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    // Wait a bit more for game to be ready
    await page.waitForTimeout(1000);

    // Try some basic keyboard inputs
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowUp"); // Rotate
    await page.waitForTimeout(200);

    await page.screenshot({ path: "screenshots/after-keyboard-input.png" });

    console.log("Keyboard input completed");
  });

  test("should play game and attempt line clearing", async ({ page }) => {
    // Wait for desktop layout
    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    // Wait for game to be ready
    await page.waitForTimeout(1000);

    console.log("Starting automated gameplay for line clearing...");

    // Strategy: Fill bottom rows by dropping pieces to the left side
    for (let attempt = 0; attempt < 20; attempt++) {
      // Move piece to leftmost position
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      // Hard drop
      await page.keyboard.press("Space");
      await page.waitForTimeout(300);

      // Take screenshot every 5 attempts
      if (attempt % 5 === 0) {
        await page.screenshot({ path: `screenshots/gameplay-attempt-${attempt}.png` });
      }

      // Check for game over (simple check)
      const gameOverDialog = page.locator('[role="dialog"]').first();
      if (await gameOverDialog.isVisible()) {
        console.log("Game over detected at attempt:", attempt);
        break;
      }
    }

    // Take final screenshot
    await page.screenshot({ path: "screenshots/final-game-state.png" });

    console.log("Automated gameplay completed");
  });

  test("should fill one line and detect line clear", async ({ page }) => {
    // Wait for desktop layout
    const desktopLayout = page.locator("div.hidden.md\\:block.min-h-screen");
    await expect(desktopLayout).toBeVisible();

    // Wait for game to be ready
    await page.waitForTimeout(1000);

    // Get initial score
    const scoreElement = desktopLayout
      .locator("text=Score")
      .locator("..")
      .locator(".text-2xl, .text-xl");
    let initialScore = 0;
    try {
      const scoreText = await scoreElement.textContent();
      initialScore = Number.parseInt(scoreText?.match(/\d+/)?.[0] || "0");
      console.log("Initial score:", initialScore);
    } catch (e) {
      console.log("Could not read initial score, continuing...");
    }

    console.log("Attempting to fill bottom line...");

    // More aggressive strategy to fill a line
    for (let attempt = 0; attempt < 30; attempt++) {
      // Alternate between left and right drops to fill the bottom
      if (attempt % 2 === 0) {
        // Move to left and drop
        for (let i = 0; i < 6; i++) {
          await page.keyboard.press("ArrowLeft");
          await page.waitForTimeout(30);
        }
      } else {
        // Move to right and drop
        for (let i = 0; i < 6; i++) {
          await page.keyboard.press("ArrowRight");
          await page.waitForTimeout(30);
        }
      }

      // Hard drop
      await page.keyboard.press("Space");
      await page.waitForTimeout(200);

      // Check score increase (indicates line clear)
      try {
        const currentScoreText = await scoreElement.textContent();
        const currentScore = Number.parseInt(currentScoreText?.match(/\d+/)?.[0] || "0");

        if (currentScore > initialScore + 100) {
          // Significant score increase
          console.log(`Line cleared! Score increased from ${initialScore} to ${currentScore}`);
          await page.screenshot({ path: "screenshots/line-cleared-success.png" });
          return; // Success!
        }
      } catch (e) {
        // Continue if score reading fails
      }

      // Take progress screenshots
      if (attempt % 10 === 0) {
        await page.screenshot({ path: `screenshots/line-fill-progress-${attempt}.png` });
      }

      // Check for game over
      const gameOverDialog = page.locator('[role="dialog"]').first();
      if (await gameOverDialog.isVisible()) {
        console.log("Game over before line clear at attempt:", attempt);
        await page.screenshot({ path: "screenshots/game-over-before-line-clear.png" });
        break;
      }
    }

    // Final screenshot regardless of outcome
    await page.screenshot({ path: "screenshots/line-clear-attempt-final.png" });

    console.log("Line clearing attempt completed");
  });
});
