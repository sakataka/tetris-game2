import { test, expect } from "@playwright/test";

test.describe("Simple Tetris Game Test", () => {
  test("should load the game and take a full page screenshot", async ({ page }) => {
    // Navigate to the game
    await page.goto("/");

    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");

    // Check if the game board exists (select visible board)
    await expect(page.getByRole("img", { name: "Tetris game board" })).toBeVisible();

    // Take a full page screenshot to see everything
    await expect(page).toHaveScreenshot("full-tetris-game.png", { fullPage: true });

    // Log some info about what we found
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check if score board is visible
    const scoreBoard = page.locator("text=Score").first();
    if (await scoreBoard.isVisible()) {
      console.log("Score board found");
    }
  });
});
