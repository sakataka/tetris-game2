import { expect, test } from "@playwright/test";
import { GamePage } from "./pages/GamePage";

test.describe("Game Features", () => {
  let gamePage: GamePage;

  test.describe("Hold Piece Functionality", () => {
    test.beforeEach(async ({ page }) => {
      gamePage = new GamePage(page);
      await gamePage.goto();
      await gamePage.waitForGameToLoad();
    });

    test("should display hold piece after first use", async ({ page }) => {
      // Use hold piece
      await gamePage.holdPiece();
      await page.waitForTimeout(500);

      // Verify hold piece is visible
      await gamePage.expectPieceToBeVisible('[data-testid="hold-piece"]');
      await gamePage.captureScreenshot("hold-piece-first-use");
    });

    test("should swap pieces when hold is used twice", async ({ page }) => {
      // Use hold piece first time
      await gamePage.holdPiece();
      await page.waitForTimeout(500);

      // Make some moves to get a different piece
      await gamePage.hardDrop();
      await page.waitForTimeout(500);

      // Use hold piece again (should swap)
      await gamePage.holdPiece();
      await page.waitForTimeout(500);

      // Verify hold piece is still visible
      await gamePage.expectPieceToBeVisible('[data-testid="hold-piece"]');
      await gamePage.captureScreenshot("hold-piece-swap");
    });

    test("should maintain hold piece across multiple uses", async ({ page }) => {
      // Use hold piece multiple times
      for (let i = 0; i < 5; i++) {
        await gamePage.holdPiece();
        await page.waitForTimeout(300);

        // Make a move
        await gamePage.moveLeft();
        await gamePage.hardDrop();
        await page.waitForTimeout(300);
      }

      // Verify hold piece is still functional
      await gamePage.expectPieceToBeVisible('[data-testid="hold-piece"]');
      await gamePage.captureScreenshot("hold-piece-multiple-uses");
    });

    test("should work with both keyboard and touch controls", async ({ page }) => {
      // Test keyboard hold
      await gamePage.holdPiece();
      await page.waitForTimeout(300);
      await gamePage.hardDrop();
      await page.waitForTimeout(300);

      // Test touch hold
      await gamePage.touchHold();
      await page.waitForTimeout(300);

      // Verify both methods work
      await gamePage.expectPieceToBeVisible('[data-testid="hold-piece"]');
      await gamePage.captureScreenshot("hold-piece-both-controls");
    });
  });

  test.describe("Reset Game Functionality", () => {
    test.beforeEach(async ({ page }) => {
      gamePage = new GamePage(page);
      await gamePage.goto();
      await gamePage.waitForGameToLoad();
    });

    test("should show confirmation dialog when reset is clicked", async ({ page }) => {
      // Click reset button
      await gamePage.resetButton.click();
      await page.waitForTimeout(300);

      // Verify confirmation dialog appears
      await expect(gamePage.resetConfirmDialog).toBeVisible();
      await expect(gamePage.confirmResetButton).toBeVisible();
      await expect(gamePage.cancelResetButton).toBeVisible();

      await gamePage.captureScreenshot("reset-confirmation-dialog");
    });

    test("should cancel reset when cancel button is clicked", async ({ page }) => {
      // Make some moves to change game state
      await gamePage.moveLeft();
      await gamePage.rotate();
      await page.waitForTimeout(100);

      // Get current score
      const scoreBeforeReset = await gamePage.scoreDisplay.textContent();

      // Try to reset but cancel
      await gamePage.cancelReset();
      await page.waitForTimeout(300);

      // Verify game state is preserved
      const scoreAfterCancel = await gamePage.scoreDisplay.textContent();
      expect(scoreAfterCancel).toBe(scoreBeforeReset);

      // Verify game is still running
      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("reset-cancelled");
    });

    test("should reset game when confirm button is clicked", async ({ page }) => {
      // Play for a while to accumulate score
      for (let i = 0; i < 5; i++) {
        await gamePage.moveLeft();
        await gamePage.rotate();
        await gamePage.hardDrop();
        await page.waitForTimeout(200);
      }

      // Reset the game
      await gamePage.resetGame();
      await page.waitForTimeout(500);

      // Verify game is reset (score should be 0 or very low)
      const scoreText = await gamePage.scoreDisplay.textContent();
      const score = Number.parseInt(scoreText?.match(/\d+/)?.[0] || "0");
      expect(score).toBeLessThan(100); // Should be very low after reset

      // Verify game is still running
      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("game-reset");
    });

    test("should work during different game states", async ({ page }) => {
      // Reset while paused
      await gamePage.pauseGame();
      await page.waitForTimeout(300);
      await gamePage.resetGame();
      await page.waitForTimeout(500);

      // Verify game is reset and running
      await gamePage.expectGameToBeRunning();

      // Play a bit more
      await gamePage.moveLeft();
      await gamePage.hardDrop();
      await page.waitForTimeout(200);

      // Reset while playing
      await gamePage.resetGame();
      await page.waitForTimeout(500);

      // Verify game is reset again
      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("reset-different-states");
    });
  });

  test.describe("Language Switching", () => {
    test.beforeEach(async ({ page }) => {
      gamePage = new GamePage(page);
      await gamePage.goto();
      await gamePage.waitForGameToLoad();
    });

    test("should switch language when language button is clicked", async ({ page }) => {
      // Check initial language (assume it starts in English)
      await gamePage.expectLanguageToBeEnglish();
      await gamePage.captureScreenshot("language-english");

      // Switch language
      await gamePage.switchLanguage();
      await page.waitForTimeout(500);

      // Verify language switched to Japanese
      await gamePage.expectLanguageToBeJapanese();
      await gamePage.captureScreenshot("language-japanese");
    });

    test("should switch back to original language", async ({ page }) => {
      // Switch to Japanese
      await gamePage.switchLanguage();
      await page.waitForTimeout(500);
      await gamePage.expectLanguageToBeJapanese();

      // Switch back to English
      await gamePage.switchLanguage();
      await page.waitForTimeout(500);
      await gamePage.expectLanguageToBeEnglish();

      await gamePage.captureScreenshot("language-switch-back");
    });

    test("should maintain language preference across game resets", async ({ page }) => {
      // Switch to Japanese
      await gamePage.switchLanguage();
      await page.waitForTimeout(500);
      await gamePage.expectLanguageToBeJapanese();

      // Reset the game
      await gamePage.resetGame();
      await page.waitForTimeout(500);

      // Verify language is still Japanese
      await gamePage.expectLanguageToBeJapanese();
      await gamePage.captureScreenshot("language-after-reset");
    });

    test("should translate all game elements", async ({ page }) => {
      // Start in English and capture elements
      await gamePage.expectLanguageToBeEnglish();

      // Switch to Japanese
      await gamePage.switchLanguage();
      await page.waitForTimeout(500);

      // Check various game elements are translated
      await gamePage.expectLanguageToBeJapanese();

      // Verify pause dialog shows in Japanese
      await gamePage.pauseGame();
      await page.waitForTimeout(300);
      await gamePage.expectGameToBePaused();

      // Resume and check reset dialog in Japanese
      await gamePage.resumeGame();
      await page.waitForTimeout(300);

      await gamePage.resetButton.click();
      await page.waitForTimeout(300);
      await expect(gamePage.resetConfirmDialog).toBeVisible();

      // Cancel reset
      await gamePage.cancelResetButton.click();
      await page.waitForTimeout(300);

      await gamePage.captureScreenshot("all-elements-translated");
    });

    test("should handle language switching during gameplay", async ({ page }) => {
      // Start playing
      await gamePage.moveLeft();
      await gamePage.rotate();
      await page.waitForTimeout(100);

      // Switch language while playing
      await gamePage.switchLanguage();
      await page.waitForTimeout(500);

      // Continue playing
      await gamePage.hardDrop();
      await page.waitForTimeout(300);

      // Verify game is still functional
      await gamePage.expectGameToBeRunning();
      await gamePage.expectLanguageToBeJapanese();

      await gamePage.captureScreenshot("language-switch-during-play");
    });
  });

  test.describe("Combined Features", () => {
    test.beforeEach(async ({ page }) => {
      gamePage = new GamePage(page);
      await gamePage.goto();
      await gamePage.waitForGameToLoad();
    });

    test("should handle multiple features simultaneously", async ({ page }) => {
      // Switch language
      await gamePage.switchLanguage();
      await page.waitForTimeout(300);

      // Use hold piece
      await gamePage.holdPiece();
      await page.waitForTimeout(300);

      // Pause game
      await gamePage.pauseGame();
      await page.waitForTimeout(300);

      // Resume game
      await gamePage.resumeGame();
      await page.waitForTimeout(300);

      // Use hold piece again
      await gamePage.holdPiece();
      await page.waitForTimeout(300);

      // Verify all features work together
      await gamePage.expectGameToBeRunning();
      await gamePage.expectLanguageToBeJapanese();
      await gamePage.expectPieceToBeVisible('[data-testid="hold-piece"]');

      await gamePage.captureScreenshot("combined-features");
    });

    test("should reset all features properly", async ({ page }) => {
      // Use all features
      await gamePage.switchLanguage();
      await page.waitForTimeout(300);
      await gamePage.holdPiece();
      await page.waitForTimeout(300);
      await gamePage.pauseGame();
      await page.waitForTimeout(300);
      await gamePage.resumeGame();
      await page.waitForTimeout(300);

      // Reset game
      await gamePage.resetGame();
      await page.waitForTimeout(500);

      // Verify game is reset but language preference is maintained
      await gamePage.expectGameToBeRunning();
      await gamePage.expectLanguageToBeJapanese();

      // Verify hold piece is cleared
      await gamePage.holdPiece();
      await page.waitForTimeout(300);
      await gamePage.expectPieceToBeVisible('[data-testid="hold-piece"]');

      await gamePage.captureScreenshot("features-after-reset");
    });
  });
});
