import { expect, test } from "@playwright/test";
import { GamePage } from "./pages/GamePage";

test.describe("Basic Game Flow", () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await gamePage.goto();
    await gamePage.waitForGameToLoad();
  });

  test("should start new game and show game elements", async () => {
    // Verify game board is visible
    await gamePage.expectGameToBeRunning();

    // Verify game UI elements are present
    await expect(gamePage.scoreDisplay).toBeVisible();
    await expect(gamePage.levelDisplay).toBeVisible();
    await expect(gamePage.linesDisplay).toBeVisible();
    await expect(gamePage.nextPiece).toBeVisible();
    await expect(gamePage.holdPieceButton).toBeVisible();

    // Verify control buttons are present
    await expect(gamePage.pauseButton).toBeVisible();
    await expect(gamePage.resetButton).toBeVisible();

    // Take screenshot for visual verification
    await gamePage.captureScreenshot("game-start");
  });

  test("should allow piece movement and rotation", async ({ page }) => {
    // Test basic piece movement
    await gamePage.moveLeft();
    await page.waitForTimeout(100);

    await gamePage.moveRight();
    await page.waitForTimeout(100);

    await gamePage.moveDown();
    await page.waitForTimeout(100);

    // Test piece rotation
    await gamePage.rotate();
    await page.waitForTimeout(100);

    // Test hard drop
    await gamePage.hardDrop();
    await page.waitForTimeout(500);

    // Verify game is still running after movements
    await gamePage.expectGameToBeRunning();

    // Take screenshot after movements
    await gamePage.captureScreenshot("after-movements");
  });

  test("should accumulate score during gameplay", async ({ page }) => {
    // Get initial score
    const initialScoreText = await gamePage.scoreDisplay.textContent();
    const initialScore = Number.parseInt(initialScoreText?.match(/\d+/)?.[0] || "0");

    // Play for a while to accumulate score
    for (let i = 0; i < 10; i++) {
      await gamePage.moveLeft();
      await page.waitForTimeout(50);
      await gamePage.moveRight();
      await page.waitForTimeout(50);
      await gamePage.rotate();
      await page.waitForTimeout(50);
      await gamePage.hardDrop();
      await page.waitForTimeout(200);
    }

    // Verify score has increased
    await gamePage.expectScoreToBeGreaterThan(initialScore);

    // Take screenshot showing score
    await gamePage.captureScreenshot("score-accumulation");
  });

  test("should handle game over scenario", async () => {
    // Play until game over
    await gamePage.playUntilGameOver();

    // Verify game over dialog appears
    await gamePage.expectGameToBeOver();

    // Take screenshot of game over state
    await gamePage.captureScreenshot("game-over");
  });

  test("should show hold piece functionality", async ({ page }) => {
    // Use hold piece feature
    await gamePage.holdPiece();
    await page.waitForTimeout(500);

    // Verify hold piece area shows a piece
    await gamePage.expectPieceToBeVisible('[data-testid="hold-piece"]');

    // Take screenshot showing hold piece
    await gamePage.captureScreenshot("hold-piece");
  });

  test("should handle continuous gameplay", async ({ page }) => {
    // Play for an extended period
    for (let round = 0; round < 5; round++) {
      // Play a round
      for (let i = 0; i < 8; i++) {
        await gamePage.moveLeft();
        await page.waitForTimeout(30);
        await gamePage.moveRight();
        await page.waitForTimeout(30);
        await gamePage.rotate();
        await page.waitForTimeout(30);
        await gamePage.hardDrop();
        await page.waitForTimeout(100);
      }

      // Use hold piece occasionally
      if (round % 2 === 0) {
        await gamePage.holdPiece();
        await page.waitForTimeout(100);
      }
    }

    // Verify game is still running or properly ended
    try {
      await gamePage.expectGameToBeRunning();
    } catch {
      // If game is over, that's also valid
      await gamePage.expectGameToBeOver();
    }

    // Take screenshot of extended gameplay
    await gamePage.captureScreenshot("extended-gameplay");
  });
});
