import { expect, test } from "@playwright/test";
import { GamePage } from "./pages/GamePage";

test.describe("Game Controls", () => {
  let gamePage: GamePage;

  test.describe("Desktop Controls", () => {
    test.beforeEach(async ({ page }) => {
      gamePage = new GamePage(page);
      await gamePage.goto();
      await gamePage.waitForGameToLoad();
    });

    test("should respond to keyboard arrow keys", async ({ page }) => {
      // Test each arrow key
      await gamePage.moveLeft();
      await page.waitForTimeout(100);
      await gamePage.captureScreenshot("keyboard-left");

      await gamePage.moveRight();
      await page.waitForTimeout(100);
      await gamePage.captureScreenshot("keyboard-right");

      await gamePage.moveDown();
      await page.waitForTimeout(100);
      await gamePage.captureScreenshot("keyboard-down");

      await gamePage.rotate();
      await page.waitForTimeout(100);
      await gamePage.captureScreenshot("keyboard-rotate");

      // Verify game is still running
      await gamePage.expectGameToBeRunning();
    });

    test("should respond to space key for hard drop", async ({ page }) => {
      await gamePage.hardDrop();
      await page.waitForTimeout(300);

      // Verify piece was dropped
      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("hard-drop");
    });

    test("should respond to C key for hold piece", async ({ page }) => {
      await gamePage.holdPiece();
      await page.waitForTimeout(300);

      // Verify hold piece is visible
      await gamePage.expectPieceToBeVisible('[data-testid="hold-piece"]');
      await gamePage.captureScreenshot("keyboard-hold");
    });

    test("should respond to P key for pause", async ({ page }) => {
      await gamePage.pauseWithKeyboard();
      await page.waitForTimeout(300);

      // Verify game is paused
      await gamePage.expectGameToBePaused();
      await gamePage.captureScreenshot("keyboard-pause");

      // Resume game
      await gamePage.pauseWithKeyboard();
      await page.waitForTimeout(300);
      await gamePage.expectGameToBeRunning();
    });

    test("should handle rapid key presses", async ({ page }) => {
      // Rapid left/right movement
      for (let i = 0; i < 10; i++) {
        await gamePage.moveLeft();
        await page.waitForTimeout(50);
        await gamePage.moveRight();
        await page.waitForTimeout(50);
      }

      // Rapid rotation
      for (let i = 0; i < 5; i++) {
        await gamePage.rotate();
        await page.waitForTimeout(50);
      }

      // Verify game is still responsive
      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("rapid-keys");
    });

    test("should handle key combinations", async ({ page }) => {
      // Test holding down key while pressing other keys
      await page.keyboard.down("ArrowLeft");
      await page.waitForTimeout(100);
      await gamePage.rotate();
      await page.waitForTimeout(100);
      await page.keyboard.up("ArrowLeft");

      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(100);
      await gamePage.holdPiece();
      await page.waitForTimeout(100);
      await page.keyboard.up("ArrowRight");

      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("key-combinations");
    });
  });

  test.describe("Mobile Touch Controls", () => {
    test.beforeEach(async ({ page }) => {
      gamePage = new GamePage(page);
      await gamePage.goto();
      await gamePage.waitForGameToLoad();
    });

    test("should respond to touch left button", async ({ page }) => {
      await gamePage.touchMoveLeft();
      await page.waitForTimeout(100);

      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("touch-left");
    });

    test("should respond to touch right button", async ({ page }) => {
      await gamePage.touchMoveRight();
      await page.waitForTimeout(100);

      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("touch-right");
    });

    test("should respond to touch rotate button", async ({ page }) => {
      await gamePage.touchRotate();
      await page.waitForTimeout(100);

      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("touch-rotate");
    });

    test("should respond to touch drop button", async ({ page }) => {
      await gamePage.touchDrop();
      await page.waitForTimeout(300);

      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("touch-drop");
    });

    test("should respond to touch hold button", async ({ page }) => {
      await gamePage.touchHold();
      await page.waitForTimeout(300);

      await gamePage.expectPieceToBeVisible('[data-testid="hold-piece"]');
      await gamePage.captureScreenshot("touch-hold");
    });

    test("should handle rapid touch inputs", async ({ page }) => {
      // Rapid touch movements
      for (let i = 0; i < 8; i++) {
        await gamePage.touchMoveLeft();
        await page.waitForTimeout(50);
        await gamePage.touchMoveRight();
        await page.waitForTimeout(50);
      }

      // Rapid rotations
      for (let i = 0; i < 4; i++) {
        await gamePage.touchRotate();
        await page.waitForTimeout(50);
      }

      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("rapid-touch");
    });

    test("should handle multiple touch inputs", async ({ page }) => {
      // Test multiple touch actions in sequence
      await gamePage.touchMoveLeft();
      await gamePage.touchRotate();
      await page.waitForTimeout(100);

      await gamePage.touchMoveRight();
      await gamePage.touchHold();
      await page.waitForTimeout(100);

      await gamePage.touchDrop();
      await page.waitForTimeout(300);

      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("multiple-touch");
    });
  });

  test.describe("Pause/Resume Functionality", () => {
    test.beforeEach(async ({ page }) => {
      gamePage = new GamePage(page);
      await gamePage.goto();
      await gamePage.waitForGameToLoad();
    });

    test("should pause game with pause button", async ({ page }) => {
      await gamePage.pauseGame();
      await page.waitForTimeout(300);

      await gamePage.expectGameToBePaused();
      await gamePage.captureScreenshot("button-pause");
    });

    test("should resume game with pause button", async ({ page }) => {
      // Pause first
      await gamePage.pauseGame();
      await page.waitForTimeout(300);
      await gamePage.expectGameToBePaused();

      // Resume
      await gamePage.resumeGame();
      await page.waitForTimeout(300);
      await gamePage.expectGameToBeRunning();
      await gamePage.captureScreenshot("button-resume");
    });

    test("should handle multiple pause/resume cycles", async ({ page }) => {
      for (let i = 0; i < 3; i++) {
        // Pause
        await gamePage.pauseGame();
        await page.waitForTimeout(200);
        await gamePage.expectGameToBePaused();

        // Resume
        await gamePage.resumeGame();
        await page.waitForTimeout(200);
        await gamePage.expectGameToBeRunning();

        // Play a bit
        await gamePage.moveLeft();
        await gamePage.rotate();
        await page.waitForTimeout(100);
      }

      await gamePage.captureScreenshot("multiple-pause-resume");
    });

    test("should not respond to game controls while paused", async ({ page }) => {
      // Pause the game
      await gamePage.pauseGame();
      await page.waitForTimeout(300);
      await gamePage.expectGameToBePaused();

      // Try to use controls (should not work)
      await gamePage.moveLeft();
      await gamePage.moveRight();
      await gamePage.rotate();
      await gamePage.hardDrop();
      await page.waitForTimeout(300);

      // Game should still be paused
      await gamePage.expectGameToBePaused();
      await gamePage.captureScreenshot("controls-while-paused");
    });

    test("should preserve game state after pause/resume", async ({ page }) => {
      // Get initial game state
      const initialScoreText = await gamePage.scoreDisplay.textContent();
      const initialScore = Number.parseInt(initialScoreText?.match(/\d+/)?.[0] || "0");

      // Make some moves
      await gamePage.moveLeft();
      await gamePage.rotate();
      await page.waitForTimeout(100);

      // Pause
      await gamePage.pauseGame();
      await page.waitForTimeout(500);

      // Resume
      await gamePage.resumeGame();
      await page.waitForTimeout(300);

      // Verify score is preserved (should be same or higher)
      const currentScoreText = await gamePage.scoreDisplay.textContent();
      const currentScore = Number.parseInt(currentScoreText?.match(/\d+/)?.[0] || "0");
      expect(currentScore).toBeGreaterThanOrEqual(initialScore);

      await gamePage.captureScreenshot("preserved-state");
    });
  });
});
