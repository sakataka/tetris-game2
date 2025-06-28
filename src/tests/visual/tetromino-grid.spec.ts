import { test, expect } from "@playwright/test";

test.describe("TetrominoGrid Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[aria-label="Tetris game board"]');
  });

  test("should render next piece preview correctly", async ({ page }) => {
    // Locate the next piece preview area
    const nextPieceArea = page.locator(".grid").filter({ hasText: /next/i }).first();

    if (await nextPieceArea.isVisible()) {
      await expect(nextPieceArea).toHaveScreenshot("next-piece-preview.png");
    }
  });

  test("should render hold piece preview correctly", async ({ page }) => {
    // Use hold function first (C key or touch hold)
    await page.keyboard.press("c");

    // Wait for hold piece to appear
    await page.waitForTimeout(500);

    // Locate the hold piece area
    const holdPieceArea = page.locator(".grid").filter({ hasText: /hold/i }).first();

    if (await holdPieceArea.isVisible()) {
      await expect(holdPieceArea).toHaveScreenshot("hold-piece-preview.png");
    }
  });

  test("should render different tetromino shapes correctly", async ({ page }) => {
    // Test multiple pieces by playing the game briefly
    for (let i = 0; i < 3; i++) {
      // Drop current piece and get new one
      await page.keyboard.press("Space");
      await page.waitForTimeout(800);

      const nextPieceArea = page.locator(".grid").filter({ hasText: /next/i }).first();
      if (await nextPieceArea.isVisible()) {
        await expect(nextPieceArea).toHaveScreenshot(`next-piece-${i + 1}.png`);
      }
    }
  });
});
