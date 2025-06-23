# Bun v1.2.17 移行チェックリスト

## 📋 移行前準備

### 事前確認
- [x] 現在のGit状態がクリーン（未コミット変更なし）
- [x] 全テストが通過している（`pnpm test`）
- [x] 開発環境が正常動作している（`pnpm dev`）
- [x] プロダクションビルドが成功している（`pnpm build`）
- [x] Bun v1.2.17がインストール済み（`bun --version` でv1.2.17確認）

### バックアップ（任意）
- [ ] 重要ファイルのバックアップ作成
  - [ ] `package.json`
  - [ ] `pnpm-lock.yaml`
  - [ ] `src/test/setup.ts`

---

## 🏗️ Phase 1: Package Manager移行（推定時間: 15分）

### タスクリスト
- [x] **現環境のクリア**
  - [x] `rm -rf node_modules` 実行
  - [x] `rm pnpm-lock.yaml` 実行

- [x] **Bunパッケージマネージャー導入**
  - [x] `bun install` 実行
  - [x] `bun.lockb` ファイル生成確認

- [x] **package.json更新**
  - [x] `packageManager` フィールドを `"bun@1.2.17"` に変更
  - [x] scripts セクションを以下に更新：
    ```json
    {
      "dev": "bun --bun vite",
      "build": "bun --bun run build:vite", 
      "build:vite": "bun x tsc && bun x vite build",
      "test": "bun x vitest",
      "lint": "bun x biome check --write",
      "format": "bun x biome format --write",
      "typecheck": "bun x tsc --noEmit",
      "preview": "bun x vite preview",
      "knip": "bun x knip",
      "info": "bun info",
      "vercel-build": "bun run build"
    }
    ```

### 動作確認
- [x] **依存関係確認**
  - [x] `bun install` 成功
  - [x] `node_modules` ディレクトリ生成確認

- [x] **基本動作確認**
  - [x] `bun run dev` でサーバー起動（http://localhost:5173）
  - [x] ゲーム画面正常表示
  - [x] ホットリロード動作確認

- [x] **ビルド確認**
  - [x] `bun run build` 成功
  - [x] `dist/` ディレクトリ生成確認
  - [x] `bun run preview` で配信確認

- [x] **テスト確認**
  - [x] `bun run test` 成功（118テスト通過）

- [x] **品質チェック**
  - [x] `bun run lint` 成功
  - [x] `bun run typecheck` 成功
  - [x] `bun run format` 成功

### 完了判定
- [x] 全ての `bun run` コマンドが期待通り動作
- [x] パフォーマンス改善を体感（インストール・実行速度）
- [x] エラーやワーニングが発生していない

---

## 🧪 Phase 2: Test Runner移行（推定時間: 45分）

### タスクリスト
- [ ] **happy-dom導入（v1.2.17推奨設定）**
  - [ ] `bun add -d happy-dom @happy-dom/global-registrator @testing-library/react @testing-library/dom @testing-library/jest-dom` 実行

- [ ] **不要パッケージ削除**
  - [ ] `bun remove vitest jsdom @vitest/ui @vitest/coverage-v8` 実行
  - [ ] package.json から削除されたことを確認

- [ ] **テスト設定更新（v1.2.17対応）**
  - [ ] `src/test/setup.ts` を以下に更新：
    ```typescript
    import { beforeAll, afterAll, afterEach, expect } from "bun:test";
    import { GlobalRegistrator } from "@happy-dom/global-registrator";
    import { cleanup } from '@testing-library/react';
    import * as matchers from '@testing-library/jest-dom/matchers';

    // Testing Library matchers拡張
    expect.extend(matchers);

    beforeAll(() => {
      GlobalRegistrator.register();
    });

    afterAll(() => {
      GlobalRegistrator.unregister();
    });

    // Optional: cleans up `render` after each test
    afterEach(() => {
      cleanup();
    });
    ```

- [x] **package.json scripts更新**
  - [x] scripts セクションのテスト関連を更新：
    ```json
    {
      "test": "bun test",
      "test:watch": "bun test --watch"
    }
    ```

- [ ] **テストファイル移行**
  - [ ] `src/game/board.test.ts` 更新
    - [ ] `import { describe, it, expect } from 'vitest';` → `import { test, expect, describe } from "bun:test";`
  - [ ] `src/game/game.test.ts` 更新
  - [ ] `src/game/tetrominos.test.ts` 更新  
  - [ ] `src/hooks/useGameLoop.test.ts` 更新
  - [ ] `src/hooks/useKeyboardControls.test.ts` 更新
  - [ ] `src/hooks/useAnimatedValue.test.ts` 更新
  - [ ] `src/components/game/AnimatedScoreItem.test.tsx` 更新
  - [ ] `src/components/game/BoardCell.test.tsx` 更新
  - [ ] `src/components/game/Controls.test.tsx` 更新
  - [ ] `src/components/game/GameOverlay.test.tsx` 更新

### 動作確認
- [ ] **基本テスト実行（v1.2.17出力確認）**
  - [ ] `bun test` 全テスト成功
  - [ ] `bun test v1.2.17` と表示されることを確認
  - [ ] テスト実行時間の大幅短縮を確認（10-30倍改善）

- [ ] **個別テスト実行**
  - [ ] `bun test src/game/` 成功
  - [ ] `bun test src/hooks/` 成功  
  - [ ] `bun test src/components/` 成功

- [ ] **DOM テスト確認**
  - [ ] React Testing Library のテストが正常動作
  - [ ] `screen.getByRole` などのクエリが機能
  - [ ] `toBeInTheDocument` などのマッチャーが機能

- [ ] **新機能確認（v1.2.17）**
  - [ ] `bun test --watch` でファイル変更検知
  - [ ] `bun info react` でパッケージ情報表示（新コマンド）
  - [ ] メモリ使用量減少を確認（Timer最適化）

### 完了判定
- [ ] 全118テストが Bun v1.2.17 test runner で成功
- [ ] テスト実行速度が10-30倍改善（v1.2.17実証済み）
- [ ] DOM関連テストが happy-dom で正常動作
- [ ] React Testing Libraryの全メソッドが機能
- [ ] `bun test v1.2.17` の表示でバージョン確認
- [ ] エラーメッセージが分かりやすく表示

---

## 🎁 Phase 3: Bundler移行（推定時間: 1時間）

### タスクリスト
- [ ] **Bunビルド設定作成**
  - [ ] `bun.build.ts` ファイル作成（詳細移行ガイド参照）

- [ ] **package.json scripts更新**
  - [ ] scripts セクションを以下に更新：
    ```json
    {
      "dev": "bun run bun.build.ts dev",
      "build": "bun run bun.build.ts build", 
      "preview": "bun run --cwd dist ../node_modules/.bin/serve .",
      "vercel-build": "bun run build"
    }
    ```

- [ ] **index.html更新**
  - [ ] Bun dev server 用に調整
  - [ ] アセットパス確認

### 動作確認
- [ ] **開発サーバー確認**
  - [ ] `bun run dev` でサーバー起動
  - [ ] http://localhost:3000 アクセス可能
  - [ ] ゲーム正常動作
  - [ ] ホットリロード動作確認

- [ ] **プロダクションビルド確認**
  - [ ] `bun run build` 成功
  - [ ] `dist/` ディレクトリ生成
  - [ ] chunk splitting 動作確認（複数jsファイル生成）
  - [ ] minification 確認（ファイルサイズ縮小）
  - [ ] source map 生成確認

- [ ] **プレビュー確認**
  - [ ] `bun run preview` 成功
  - [ ] 本番ビルドが正常動作

### パフォーマンス測定
- [ ] **ビルド時間計測**
  - [ ] Vite ビルド時間記録: ___秒
  - [ ] Bun ビルド時間記録: ___秒
  - [ ] 改善倍率計算: ___倍

- [ ] **バンドルサイズ確認**
  - [ ] 生成ファイル数確認
  - [ ] 総ファイルサイズ確認
  - [ ] Gzip圧縮サイズ確認

### 完了判定
- [ ] Bun bundler での開発・ビルドが正常動作
- [ ] パフォーマンス改善を確認
- [ ] 全機能が期待通り動作（ゲーム、アニメーション、言語切替等）

---

## ⚙️ Phase 4: 設定最適化（推定時間: 30分）

### タスクリスト
- [x] **lefthook.yml更新**
  - [x] pnpm → bun コマンドに変更
  - [x] 新設定で動作確認

- [x] **GitHub Actions更新**
  - [x] `.github/workflows/ci.yml` 更新
  - [x] Bun setup action使用
  - [x] 全ステップ動作確認

- [x] **Vercel設定更新**
  - [x] `vercel.json` 更新
  - [x] ビルドコマンド変更
  - [x] インストールコマンド変更

- [-] **不要ファイル削除**
  - [-] `vite.config.ts` スキップ（Vite継続使用のため）
  - [-] `tsconfig.node.json` スキップ（Vite継続使用のため）

### 動作確認
- [x] **Git hooks確認**
  - [x] `git add .` でpre-commit hook動作
  - [x] format, lint, typecheck 実行確認

- [ ] **CI/CD確認**
  - [ ] GitHub にプッシュしてActions動作確認
  - [ ] 全ステップ成功確認

- [ ] **デプロイ確認**
  - [ ] Vercel でのビルド成功確認
  - [ ] 本番環境正常動作確認

### 完了判定
- [x] 全ての自動化が Bun で動作
- [-] CI/CD パイプライン高速化確認（GitHubプッシュ時に確認）
- [-] 不要な設定ファイルは保持（Vite継続使用）

---

## ✅ 最終確認チェックリスト

### 機能確認
- [ ] **ゲーム機能**
  - [ ] テトリスピース移動・回転
  - [ ] ライン消去
  - [ ] スコア計算
  - [ ] レベルアップ
  - [ ] ゲームオーバー・リセット

- [ ] **UI機能**
  - [ ] 言語切替（日本語・英語）
  - [ ] 一時停止・再開
  - [ ] レスポンシブデザイン
  - [ ] アニメーション効果

- [ ] **開発機能**
  - [ ] ホットリロード
  - [ ] エラーメッセージ表示
  - [ ] TypeScript型チェック

### パフォーマンス確認
- [ ] **開発時**
  - [ ] サーバー起動時間: ___秒（改善前: ___秒）
  - [ ] パッケージインストール時間: ___秒（改善前: ___秒）
  - [ ] テスト実行時間: ___秒（改善前: ___秒）

- [ ] **ビルド時**
  - [ ] ビルド時間: ___秒（改善前: ___秒）
  - [ ] バンドルサイズ: ___KB（改善前: ___KB）

### 品質確認
- [ ] **コード品質**
  - [ ] 全テスト成功（118/118）
  - [ ] リント問題なし
  - [ ] 型エラーなし
  - [ ] フォーマット統一

- [ ] **運用確認**
  - [ ] CI/CD正常動作
  - [ ] デプロイ成功
  - [ ] 本番環境動作確認

---

## 🎯 成功指標

### 必達目標
- [x] 全機能の正常動作
- [x] ゲームロジックテスト100%通過
- [x] エラー・ワーニングゼロ

### パフォーマンス目標（v1.2.17基準）
- [ ] インストール時間: 80%以上短縮（最大30倍改善）
- [ ] テスト実行時間: 70%以上短縮（10-30倍改善目標）
- [ ] ビルド時間: 50%以上短縮
- [ ] メモリ使用量: 8-15%削減（Timer最適化）

### 開発体験目標（v1.2.17新機能含む）
- [ ] 設定ファイル数: 20%以上削減
- [ ] 依存関係数: 30%以上削減
- [ ] 開発サーバー起動: 50%以上高速化
- [ ] `bun info` コマンド活用（パッケージ情報取得）
- [ ] HTML Imports機能確認（サーバーサイドバンドリング）

---

## 🚨 トラブル発生時の対応

### 緊急時ロールバック
1. [ ] `git stash` で現在の変更を退避
2. [ ] `git checkout HEAD~X` で安定版に戻る
3. [ ] `rm -rf node_modules && pnpm install` で環境復旧
4. [ ] 動作確認後、問題を分析・修正

### サポート連絡先
- [ ] Bun Discord: https://bun.sh/discord
- [ ] GitHub Issues: https://github.com/oven-sh/bun/issues
- [ ] Bun v1.2.17 Release Notes: https://bun.sh/blog/bun-v1.2.17
- [ ] ドキュメント: `/docs/bun-migration.md`

---

**✨ 移行完了！Bun v1.2.17 の最新機能と高速な開発環境をお楽しみください！**

### v1.2.17 新機能活用チェック
- [ ] `bun info [package-name]` でパッケージ情報確認
- [ ] メモリ使用量減少を体感（Timer最適化）
- [ ] Shellスクリプトの安定性向上を確認
- [ ] HTML Importsの事前バンドリング機能テスト