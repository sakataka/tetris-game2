import { test, expect } from "@playwright/test";

test.describe("Board Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto("/");

    // Wait for the game to load - wait for visible board
    await page.waitForSelector('[role="img"][aria-label="Tetris game board"]:visible');
  });

  test("should render empty game board correctly", async ({ page }) => {
    // Take a screenshot of the game board in its initial state
    const board = page.getByRole("img", { name: "Tetris game board" });
    await expect(board).toBeVisible();

    // Visual comparison - will create baseline on first run
    await expect(board).toHaveScreenshot("empty-board.png");
  });

  test("should render game board with pieces correctly", async ({ page }) => {
    // Wait a moment for a piece to spawn
    await page.waitForTimeout(1000);

    // Take screenshot with active piece
    const board = page.getByRole("img", { name: "Tetris game board" });
    await expect(board).toHaveScreenshot("board-with-piece.png");
  });

  test("should render game board after piece placement", async ({ page }) => {
    // Drop a piece quickly to simulate placement
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space"); // Hard drop

    // Wait for piece to settle
    await page.waitForTimeout(500);

    const board = page.getByRole("img", { name: "Tetris game board" });
    await expect(board).toHaveScreenshot("board-after-placement.png");
  });

  test("should render ghost piece correctly", async ({ page }) => {
    // Ensure ghost piece is enabled in settings
    // Ghost piece should be visible by default

    const board = page.getByRole("img", { name: "Tetris game board" });
    await expect(board).toHaveScreenshot("board-with-ghost-piece.png");
  });
});
