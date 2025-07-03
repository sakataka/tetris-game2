import { expect, type Page } from "@playwright/test";

export class GamePage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto("/");
  }

  // Game board elements
  get gameBoard() {
    return this.page.locator('[aria-label="Tetris game board"]').first();
  }

  get gameOverlay() {
    return this.page.locator('[role="dialog"]');
  }

  get pauseButton() {
    // For mobile header pause button
    return this.page.locator('[aria-label*="Pause game"], [aria-label*="Resume game"]');
  }

  get resetButton() {
    // For mobile header reset button
    return this.page.locator('[aria-label="Reset game"]');
  }

  get nextPiece() {
    // Look for the Next section in mobile header
    return this.page.locator("text=Next").locator("..").locator("div").last();
  }

  get holdPieceButton() {
    // Look for the Hold section in mobile header
    return this.page.locator("text=Hold").locator("..").locator("button");
  }

  get scoreDisplay() {
    // Look for Score text and its value in mobile header
    return this.page.locator(".font-bold.text-cyan-400");
  }

  get levelDisplay() {
    // Look for Level text and its value in mobile header
    return this.page.locator(".font-bold.text-purple-400");
  }

  get linesDisplay() {
    // Look for Lines text and its value in mobile header
    return this.page.locator(".font-bold.text-yellow-400");
  }

  get gameOverDialog() {
    // Game over dialog
    return this.page.locator('[role="dialog"] >> text=Game Over');
  }

  get resetConfirmDialog() {
    // Reset confirmation dialog
    return this.page.locator('[role="dialog"]').filter({ hasText: "Reset" });
  }

  get confirmResetButton() {
    // Confirm reset button in dialog
    return this.page
      .locator(
        '[role="dialog"] button:has-text("Reset"), [role="dialog"] button:has-text("Confirm")',
      )
      .first();
  }

  get cancelResetButton() {
    // Cancel reset button in dialog
    return this.page.locator('[role="dialog"] button:has-text("Cancel")');
  }

  // Language switching
  get languageButton() {
    // Settings button that opens language menu
    return this.page
      .locator("button:has(svg)")
      .filter({ hasText: "Settings" })
      .or(
        this.page
          .locator("button")
          .filter({ has: this.page.locator("svg") })
          .first(),
      );
  }

  // Touch controls (mobile)
  get touchLeftButton() {
    return this.page.locator('[aria-label="Move left"]');
  }

  get touchRightButton() {
    return this.page.locator('[aria-label="Move right"]');
  }

  get touchRotateButton() {
    return this.page.locator('[aria-label="Rotate piece"]');
  }

  get touchDropButton() {
    return this.page.locator('[aria-label="Hard drop"]');
  }

  get touchHoldButton() {
    return this.page.locator('[aria-label="Hold current piece"]');
  }

  // Game actions
  async startNewGame() {
    // Wait for page to load
    await this.page.waitForLoadState("networkidle");

    // Game should start automatically or we need to click start
    await this.page.waitForTimeout(1000);
  }

  async pauseGame() {
    await this.pauseButton.click();
  }

  async resumeGame() {
    await this.pauseButton.click();
  }

  async resetGame() {
    await this.resetButton.click();
    await this.confirmResetButton.click();
  }

  async cancelReset() {
    await this.resetButton.click();
    await this.cancelResetButton.click();
  }

  async switchLanguage() {
    // Click the settings button to open the dropdown
    await this.languageButton.click();
    await this.page.waitForTimeout(500);

    // Check current language and click the other one
    const isEnglish = await this.page.locator("text=Score").isVisible();
    if (isEnglish) {
      // Switch to Japanese
      await this.page.locator("text=Japanese, text=日本語").first().click();
    } else {
      // Switch to English
      await this.page.locator("text=English, text=英語").first().click();
    }

    await this.page.waitForTimeout(500);
  }

  // Keyboard controls
  async moveLeft() {
    await this.page.keyboard.press("ArrowLeft");
  }

  async moveRight() {
    await this.page.keyboard.press("ArrowRight");
  }

  async moveDown() {
    await this.page.keyboard.press("ArrowDown");
  }

  async rotate() {
    await this.page.keyboard.press("ArrowUp");
  }

  async hardDrop() {
    await this.page.keyboard.press("Space");
  }

  async holdPiece() {
    await this.page.keyboard.press("KeyC");
  }

  async pauseWithKeyboard() {
    await this.page.keyboard.press("KeyP");
  }

  // Touch controls (mobile)
  async touchMoveLeft() {
    await this.touchLeftButton.click();
  }

  async touchMoveRight() {
    await this.touchRightButton.click();
  }

  async touchRotate() {
    await this.touchRotateButton.click();
  }

  async touchDrop() {
    await this.touchDropButton.click();
  }

  async touchHold() {
    await this.touchHoldButton.click();
  }

  // Assertions
  async expectGameToBeRunning() {
    await expect(this.gameBoard).toBeVisible();
    await expect(this.scoreDisplay).toBeVisible();
  }

  async expectGameToBePaused() {
    await expect(this.page.locator('[role="dialog"]')).toBeVisible();
    await expect(
      this.page.locator("text=Paused").or(this.page.locator("text=一時停止")),
    ).toBeVisible();
  }

  async expectGameToBeOver() {
    await expect(this.gameOverDialog).toBeVisible();
  }

  async expectScoreToBeGreaterThan(score: number) {
    const scoreText = await this.scoreDisplay.textContent();
    const currentScore = Number.parseInt(scoreText?.match(/\d+/)?.[0] || "0");
    expect(currentScore).toBeGreaterThan(score);
  }

  async expectPieceToBeVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectLanguageToBeEnglish() {
    // Check for English text in the UI
    await expect(this.page.locator("text=Score")).toBeVisible();
  }

  async expectLanguageToBeJapanese() {
    // Check for Japanese text in the UI - look for Japanese translations
    await expect(
      this.page
        .locator("text=スコア")
        .or(this.page.locator("text=ライン").or(this.page.locator("text=レベル"))),
    ).toBeVisible();
  }

  // Helper methods
  async waitForGameToLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.expectGameToBeRunning();
  }

  async playUntilGameOver() {
    // This is a helper method to play until game over
    // We'll keep dropping pieces until game is over
    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
      try {
        await this.hardDrop();
        await this.page.waitForTimeout(100);

        // Check if game is over
        if (await this.gameOverDialog.isVisible()) {
          break;
        }

        attempts++;
      } catch (error) {
        // If we get an error, check if game is over
        if (await this.gameOverDialog.isVisible()) {
          break;
        }
        throw error;
      }
    }
  }

  async captureScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
