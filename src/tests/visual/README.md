# Visual Regression Testing with Playwright

Playwrightを使ったTetrisゲームのvisual regression testingです。デグレ防止を目的とし、手動実行でコンポーネントの視覚的な変更を検出します。

## 概要

### テスト対象
- **Board.tsx**: ゲームボード全体（最優先）
- **TetrominoGrid.tsx**: 次のピース・ホールドピース表示

### テスト目的
- 修正時のvisual regression（デグレ）防止
- テトリミノの表示・配置の正確性確認
- レスポンシブレイアウトの保証

## セットアップ

```bash
# 初回のみ：ブラウザインストール
bun run playwright:install
```

## 実行方法

### 1. 基本実行
```bash
# 全てのvisual testを実行
bun run test:visual
```

### 2. インタラクティブモード（推奨）
```bash
# UIモードで実行（ブラウザ表示あり）
bun run test:visual:ui
```

### 3. デバッグモード
```bash
# ステップ実行でデバッグ
bun run test:visual:debug
```

### 4. スクリーンショット更新
```bash
# baseline画像を更新
bun run test:visual:update
```

## 使用シナリオ

### デグレチェック
修正後に以下を実行：
```bash
bun run test:visual
```
→ 既存のbaseline画像と比較し、差分があれば警告

### 新機能追加時
新しいUI実装後：
```bash
bun run test:visual:update  # baseline作成
bun run test:visual         # 動作確認
```

### モバイル対応確認
- Desktop Chrome（1920x1080）
- iPhone 12（390x844）
の両環境でテスト

## ファイル構成

```
src/tests/visual/
├── README.md                    # このファイル
├── board.spec.ts                # Board.tsxのテスト
└── tetromino-grid.spec.ts       # TetrominoGridのテスト

test-results/                    # 生成される結果
├── index.html                   # HTMLレポート
└── board-visual-regression-tests-should-render-empty-game-board-correctly-chromium/
    └── empty-board-actual.png   # 実際の結果
```

## 重要な注意点

- **CICDには含まれません** - 手動実行のみ
- 初回実行時は全てのスクリーンショットがbaselineとして保存
- 差分検出時は`test-results/`でactual vs expectedを確認
- ゲームの動的要素（ランダムなピース生成）を考慮したテスト設計

## エラー対処

### ゲームが起動しない場合
```bash
# 開発サーバーが起動していることを確認
bun run dev
```

### スクリーンショットの差分が意図的な場合
```bash
# baseline画像を更新
bun run test:visual:update
```