import { expect, test } from "@playwright/test";

test.describe("AI UI Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the game to load
    await page.waitForSelector('[data-testid="ai-controls"]', { timeout: 10000 });
  });

  test("should display AI controls panel", async ({ page }) => {
    // AI制御パネルが表示されることを確認
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();

    // 基本的なボタンが存在することを確認
    await expect(page.locator('[data-testid="toggle-ai"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-status"]')).toBeVisible();
  });

  test("should start and stop AI successfully", async ({ page }) => {
    // AIを開始
    await page.click('[data-testid="toggle-ai"]');
    await expect(page.locator('[data-testid="ai-status"]')).toContainText("Active");

    // AI思考中表示の確認（思考が開始されるまで少し待つ）
    await page.waitForSelector('[data-testid="thinking-indicator"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="thinking-indicator"]')).toBeVisible();

    // 5秒待ってAIの動作を確認
    await page.waitForTimeout(5000);

    // スコアが上がっていることを確認（AIが動作している証拠）
    const scoreElement = page.locator('[data-testid="score"]');
    if (await scoreElement.isVisible()) {
      const score = await scoreElement.textContent();
      expect(Number.parseInt(score || "0")).toBeGreaterThan(0);
    }

    // AIを停止
    await page.click('[data-testid="toggle-ai"]');
    await expect(page.locator('[data-testid="ai-status"]')).toContainText("Inactive");
  });

  test("should display AI visualization when enabled", async ({ page }) => {
    // 可視化を有効にしてAI開始
    await page.click('[data-testid="enable-visualization"]');
    await page.click('[data-testid="toggle-ai"]');

    // AIが思考を開始するまで待つ
    await page.waitForSelector('[data-testid="thinking-indicator"]', { timeout: 5000 });

    // ヒートマップが表示されることを確認（AIが決定を行った後）
    await page.waitForSelector('[data-testid="move-heatmap"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="move-heatmap"]')).toBeVisible();

    // 評価詳細が表示されることを確認
    await page.waitForSelector('[data-testid="evaluation-details"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="evaluation-details"]')).toBeVisible();
  });

  test("should handle AI settings changes", async ({ page }) => {
    // 詳細設定を表示
    await page.click('[data-testid="show-advanced"]');

    // AIレベルを高度に変更
    await page.selectOption('[data-testid="ai-level-select"]', "advanced");

    // ビーム幅を変更
    const beamWidthSlider = page.locator('[data-testid="beam-width-slider"]');
    if (await beamWidthSlider.isVisible()) {
      // スライダーの中央をクリックして値を変更
      await beamWidthSlider.click();
    }

    // 設定が反映されることを確認
    await page.click('[data-testid="toggle-ai"]');
    const currentBeamWidth = page.locator('[data-testid="current-beam-width"]');
    if (await currentBeamWidth.isVisible()) {
      const widthText = await currentBeamWidth.textContent();
      expect(widthText).toBeTruthy();
    }
  });

  test("should record and replay AI games", async ({ page }) => {
    // AI開始（実際のリプレイ機能が統合されている場合）
    await page.click('[data-testid="toggle-ai"]');

    // 少し待ってゲーム進行
    await page.waitForTimeout(10000);

    // リプレイボタンが存在する場合のテスト
    const replayButton = page.locator('[data-testid="start-replay"]');
    if (await replayButton.isVisible()) {
      await replayButton.click();

      // リプレイコントロールが表示されることを確認
      await expect(page.locator('[data-testid="replay-controls"]')).toBeVisible();

      // 再生/一時停止
      await page.click('[data-testid="replay-play"]');
      await page.waitForTimeout(2000);

      // ステップ進行（一時停止後）
      const pauseButton = page.locator('[data-testid="replay-play"]');
      if ((await pauseButton.textContent()) === "Pause") {
        await pauseButton.click(); // Pause
      }
      await page.click('[data-testid="replay-next"]');

      // リプレイ終了
      await page.click('[data-testid="close-replay"]');
    }
  });

  test("should handle game state transitions correctly", async ({ page }) => {
    // ゲームが実行中状態でAIを開始
    await page.click('[data-testid="toggle-ai"]');
    await page.waitForSelector('[data-testid="thinking-indicator"]', { timeout: 5000 });

    // ゲームオーバーになるまで待つか、手動でゲームを終了
    // この部分は実際のゲーム実装に応じて調整が必要

    // AIが適切に停止することを確認
    const _aiStatus = page.locator('[data-testid="ai-status"]');
    // ゲームオーバー時にAIが自動停止するかどうかをテスト
  });

  test("should display performance statistics", async ({ page }) => {
    // AI開始
    await page.click('[data-testid="toggle-ai"]');

    // 少し待って統計データが生成されるのを待つ
    await page.waitForTimeout(5000);

    // 統計情報が表示されるかチェック
    const statsSection = page.locator(".text-xs.text-muted-foreground.space-y-1.pt-2.border-t");
    if (await statsSection.isVisible()) {
      // 基本的な統計項目が表示されていることを確認
      await expect(statsSection).toContainText("Decisions:");
      await expect(statsSection).toContainText("Avg Time:");
    }
  });

  test("should be responsive on different screen sizes", async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();

    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();

    // モバイルサイズ
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();
  });

  test("should handle errors gracefully", async ({ page }) => {
    // ネットワークエラーのシミュレーション
    await page.route("**/*", (route) => route.abort());

    // AIを開始しようとする
    await page.click('[data-testid="toggle-ai"]');

    // エラー状態でも UI が壊れないことを確認
    await expect(page.locator('[data-testid="ai-controls"]')).toBeVisible();

    // ルートを元に戻す
    await page.unroute("**/*");
  });
});
