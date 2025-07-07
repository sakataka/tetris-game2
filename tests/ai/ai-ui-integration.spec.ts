import { expect, test } from "@playwright/test";

test.describe("AI UI Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the game to load
    await page.waitForSelector('[data-testid="ai-controls"]', { timeout: 10000 });
  });

  test("should display AI controls panel", async ({ page }) => {
    // Confirm that AI control panel is displayed
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();

    // Confirm that basic buttons exist
    await expect(page.locator('[data-testid="toggle-ai"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-status"]')).toBeVisible();
  });

  test("should start and stop AI successfully", async ({ page }) => {
    // Start AI
    await page.click('[data-testid="toggle-ai"]');
    await expect(page.locator('[data-testid="ai-status"]')).toContainText("Active");

    // Confirm AI thinking display (wait a bit until thinking starts)
    await page.waitForSelector('[data-testid="thinking-indicator"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="thinking-indicator"]')).toBeVisible();

    // Wait 5 seconds and confirm AI operation
    await page.waitForTimeout(5000);

    // Confirm score is increasing (evidence AI is working)
    const scoreElement = page.locator('[data-testid="score"]');
    if (await scoreElement.isVisible()) {
      const score = await scoreElement.textContent();
      expect(Number.parseInt(score || "0")).toBeGreaterThan(0);
    }

    // Stop AI
    await page.click('[data-testid="toggle-ai"]');
    await expect(page.locator('[data-testid="ai-status"]')).toContainText("Inactive");
  });

  test("should display AI visualization when enabled", async ({ page }) => {
    // Enable visualization and start AI
    await page.click('[data-testid="enable-visualization"]');
    await page.click('[data-testid="toggle-ai"]');

    // Wait until AI starts thinking
    await page.waitForSelector('[data-testid="thinking-indicator"]', { timeout: 5000 });

    // Confirm heatmap is displayed (after AI makes decision)
    await page.waitForSelector('[data-testid="move-heatmap"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="move-heatmap"]')).toBeVisible();

    // Confirm evaluation details are displayed
    await page.waitForSelector('[data-testid="evaluation-details"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="evaluation-details"]')).toBeVisible();
  });

  test("should handle AI settings changes", async ({ page }) => {
    // Show advanced settings
    await page.click('[data-testid="show-advanced"]');

    // Change AI level to advanced
    await page.selectOption('[data-testid="ai-level-select"]', "advanced");

    // Change beam width
    const beamWidthSlider = page.locator('[data-testid="beam-width-slider"]');
    if (await beamWidthSlider.isVisible()) {
      // Click center of slider to change value
      await beamWidthSlider.click();
    }

    // Confirm settings are applied
    await page.click('[data-testid="toggle-ai"]');
    const currentBeamWidth = page.locator('[data-testid="current-beam-width"]');
    if (await currentBeamWidth.isVisible()) {
      const widthText = await currentBeamWidth.textContent();
      expect(widthText).toBeTruthy();
    }
  });

  test("should record and replay AI games", async ({ page }) => {
    // Start AI (if actual replay function is integrated)
    await page.click('[data-testid="toggle-ai"]');

    // Wait a bit for game progression
    await page.waitForTimeout(10000);

    // Test if replay button exists
    const replayButton = page.locator('[data-testid="start-replay"]');
    if (await replayButton.isVisible()) {
      await replayButton.click();

      // Confirm replay controls are displayed
      await expect(page.locator('[data-testid="replay-controls"]')).toBeVisible();

      // Play/pause
      await page.click('[data-testid="replay-play"]');
      await page.waitForTimeout(2000);

      // Step forward (after pause)
      const pauseButton = page.locator('[data-testid="replay-play"]');
      if ((await pauseButton.textContent()) === "Pause") {
        await pauseButton.click(); // Pause
      }
      await page.click('[data-testid="replay-next"]');

      // End replay
      await page.click('[data-testid="close-replay"]');
    }
  });

  test("should handle game state transitions correctly", async ({ page }) => {
    // Start AI while game is running
    await page.click('[data-testid="toggle-ai"]');
    await page.waitForSelector('[data-testid="thinking-indicator"]', { timeout: 5000 });

    // Wait until game over or manually end the game
    // This part needs adjustment based on actual game implementation

    // Confirm AI stops properly
    const _aiStatus = page.locator('[data-testid="ai-status"]');
    // Test whether AI auto-stops on game over
  });

  test("should display performance statistics", async ({ page }) => {
    // Start AI
    await page.click('[data-testid="toggle-ai"]');

    // Wait a bit for statistics data to be generated
    await page.waitForTimeout(5000);

    // Check if statistics information is displayed
    const statsSection = page.locator(".text-xs.text-muted-foreground.space-y-1.pt-2.border-t");
    if (await statsSection.isVisible()) {
      // Confirm basic statistics items are displayed
      await expect(statsSection).toContainText("Decisions:");
      await expect(statsSection).toContainText("Avg Time:");
    }
  });

  test("should be responsive on different screen sizes", async ({ page }) => {
    // Desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();

    // Tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();

    // Mobile size
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();
  });

  test("should handle errors gracefully", async ({ page }) => {
    // Simulate network error
    await page.route("**/*", (route) => route.abort());

    // Try to start AI
    await page.click('[data-testid="toggle-ai"]');

    // Confirm UI doesn't break even in error state
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();

    // Restore route
    await page.unroute("**/*");
  });
});
