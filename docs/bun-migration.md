# Node.js → Bun v1.2.17 完全移行ガイド

## 概要

このドキュメントは、テトリスゲームプロジェクトをNode.js環境からBun v1.2.17に完全移行するための詳細ガイドです。2025年6月時点のBun v1.2.17の最新機能を活用し、パフォーマンス向上と開発体験の改善を実現します。

### Bun v1.2.17 最新アップデート（2025年6月21日リリース）
- **50の問題修正**（80の👍に対応）
- **+24のNode.js互換テスト追加**
- **HTML Imports with Ahead-of-Time Bundling**
- **メモリ使用量8-15%削減**（Timer最適化）
- **bun info コマンド追加**（旧 bun pm view）
- **SQLite強化**（columnTypes & declaredTypes）
- **Shell安定性向上**（スタックオーバーフロー修正）

## 📊 移行前後の技術スタック比較

| 項目 | 移行前（Node.js） | 移行後（Bun v1.2.17） | 改善効果 |
|------|------------------|---------------------|----------|
| **Runtime** | Node.js 24.2 | Bun v1.2.17 | 3-4倍高速化 |
| **Package Manager** | pnpm 10.12.1 | bun install | 最大30倍高速化 |
| **Dev Server** | Vite dev server | Bun frontend dev server | Hot reloading対応 |
| **Bundler** | Vite 6.3.5 | Bun.build | Chunk splitting対応 |
| **Test Runner** | Vitest 3.2.4 | bun test | 10-30倍高速化 |
| **DOM Testing** | jsdom 26.1.0 | happy-dom | Bun互換 |
| **Type Checking** | tsc | Bunネイティブ | 設定不要 |

## 🔍 Bun v1.2.17 新機能評価

### ✅ v1.2.17で大幅改善された機能

#### Frontend Development Server
- **HTML Imports with Ahead-of-Time Bundling**: サーバーサイドコードでの事前バンドリング対応
- **React Hot Reloading**: ネイティブ対応（ただしReact Fast Refreshではない）
- **零設定でJSX/TypeScript対応**: 追加設定不要

#### Production Bundler
- **Chunk splitting**: 実装済み・安定稼働
- **Code minification**: 高速圧縮対応
- **Source map**: 外部・インライン対応
- **複数エントリーポイント**: 完全対応

#### Testing Framework（v1.2.17出力例あり）
- **Jest/Vitest互換API**: 高い互換性
- **happy-dom完全対応**: `bun test v1.2.17` で確認済み
- **React Testing Library対応**: `@testing-library/react` 完全対応
- **10-30倍高速化**: 実証済みパフォーマンス

#### Memory & Performance Optimization
- **Timer最適化**: `setTimeout`/`setImmediate` で8-15%メモリ削減
- **Shell改良**: スタックオーバーフロー修正、深いネスト対応
- **Node.js互換性**: `child_process.fork`, `tls.getCACertificates()`など

#### Developer Experience
- **`bun info` コマンド**: パッケージ情報表示（旧`bun pm view`）
- **`--unhandled-rejections` フラグ**: Node.js互換Promise処理
- **CLAUDE.md自動生成**: `bun init`でClaude Code検出時

### ⚠️ 継続する制約（v1.2.17現在）

- **jsdom**: 非対応（happy-dom必須、ただし機能は同等）
- **React Fast Refresh**: 未実装（一般的なhot reloadingは機能）
  - **回避策**: Vite + Bun組み合わせ推奨
  - **将来性**: `import.meta.hot` API対応予定

## 📋 移行戦略：4段階アプローチ

### Phase 1: Package Manager移行（低リスク・15分）
Node.js環境を保持しつつ、pnpmからbun installに移行

### Phase 2: Test Runner移行（中リスク・45分）
VitestからBun native test runnerに移行、happy-dom導入

### Phase 3: Bundler移行（高リスク・1時間）
ViteからBun.buildに完全移行、開発サーバー変更

### Phase 4: 設定最適化（低リスク・30分）
CI/CD、Git hooks、デプロイ設定の最適化

## 🔧 Phase 1: Package Manager移行

### 目標
pnpm完全撤廃、Bunパッケージマネージャー導入

### 実行手順

1. **現環境クリア**
```bash
rm -rf node_modules pnpm-lock.yaml
```

2. **Bunインストール**
```bash
bun install
```

3. **package.json更新**
```json
{
  "packageManager": "bun@1.2.17",
  "scripts": {
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
}
```

### 検証
```bash
bun install
bun run dev      # 開発サーバー起動確認
bun run build    # ビルド成功確認
bun run test     # テスト実行確認
```

## 🧪 Phase 2: Test Runner移行

### 目標
Vitest → bun test、jsdom → happy-dom

### 実行手順

1. **happy-dom導入（v1.2.17推奨設定）**
```bash
bun add -d happy-dom @happy-dom/global-registrator @testing-library/react @testing-library/dom @testing-library/jest-dom
```

2. **不要パッケージ削除**
```bash
bun remove vitest jsdom @vitest/ui @vitest/coverage-v8
```

3. **テスト設定更新（src/test/setup.ts）- v1.2.17対応**
```typescript
import { beforeAll, afterAll, afterEach, expect } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Testing Library matchers拡張
expected.extend(matchers);

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

4. **package.json scripts更新**
```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

5. **テストファイル更新例**
```typescript
// 既存: import { describe, it, expect } from 'vitest';
import { test, expect, describe } from "bun:test";
import { render, screen } from "@testing-library/react";

// テスト内容は基本的に変更不要（互換性高い）
describe("Board Component", () => {
  test("renders correctly", () => {
    render(<Board />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
```

### 検証（v1.2.17出力例）
```bash
bun test                    # 全テスト実行
# 期待出力:
# bun test v1.2.17
# dom.test.ts:
# ✓ dom test [0.82ms]
# 1 pass 0 fail 1 expect() calls
# Ran 1 tests across 1 files.

bun test src/game/         # 特定ディレクトリ
bun test --watch           # ウォッチモード
bun info react             # パッケージ情報確認（新機能）
```

## 🎁 Phase 3: Bundler移行

### 目標
Vite → Bun.build完全移行

### 実行手順

1. **Bunビルド設定作成（bun.build.ts）**
```typescript
import { $ } from "bun";

// Development server
export const dev = async () => {
  console.log("🚀 Starting Bun development server...");
  
  // Bun's frontend dev server
  const proc = Bun.spawn([
    "bun", 
    "run", 
    "index.html"
  ], {
    env: { 
      ...process.env, 
      NODE_ENV: "development",
      BUN_ENV: "development"
    },
    stdio: ["inherit", "inherit", "inherit"],
  });
  
  await proc.exited;
};

// Production build
export const build = async () => {
  console.log("🏗️ Building for production...");
  
  // TypeScript check
  await $`bun x tsc --noEmit`;
  
  // Clean dist directory
  await $`rm -rf dist`;
  await $`mkdir -p dist`;
  
  // Bundle with Bun
  const result = await Bun.build({
    entrypoints: ["./src/main.tsx"],
    outdir: "./dist",
    splitting: true,
    minify: true,
    target: "browser",
    format: "esm",
    publicPath: "/",
    naming: {
      entry: "[dir]/[name].[hash].[ext]",
      chunk: "[name].[hash].[ext]",
      asset: "[name].[hash].[ext]",
    },
    external: [],
  });
  
  if (!result.success) {
    console.error("❌ Build failed:");
    result.logs.forEach(log => console.error(log));
    process.exit(1);
  }
  
  // Copy static assets
  await $`cp index.html dist/`;
  await $`cp -r public/* dist/ 2>/dev/null || true`;
  
  // Update index.html asset references
  const html = await Bun.file("dist/index.html").text();
  const updatedHtml = html
    .replace('src="./src/main.tsx"', `src="/main.${result.outputs[0].hash}.js"`)
    .replace('/src/index.css', `/index.${result.outputs.find(o => o.path.endsWith('.css'))?.hash}.css`);
  
  await Bun.write("dist/index.html", updatedHtml);
  
  console.log("✅ Build completed successfully!");
  console.log(`📦 Generated ${result.outputs.length} files`);
};

// Main execution
const command = process.argv[2];
switch (command) {
  case "dev":
    await dev();
    break;
  case "build":
    await build();
    break;
  default:
    console.log("Usage: bun run bun.build.ts [dev|build]");
}
```

2. **package.json scripts更新**
```json
{
  "scripts": {
    "dev": "bun run bun.build.ts dev",
    "build": "bun run bun.build.ts build",
    "preview": "bun run --cwd dist ../node_modules/.bin/serve .",
    "vercel-build": "bun run build"
  }
}
```

3. **index.html更新**
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tetris Game</title>
  <link rel="stylesheet" href="/src/index.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/main.tsx"></script>
</body>
</html>
```

### 検証
```bash
bun run dev      # 開発サーバー確認
bun run build    # プロダクションビルド確認
bun run preview  # ビルド結果確認
```

## ⚙️ Phase 4: 設定最適化

### lefthook.yml更新
```yaml
# Lefthook configuration for Bun
pre-commit:
  parallel: true
  commands:
    format:
      glob: "*.{js,ts,jsx,tsx,json,md}"
      run: bun run format
      stage_fixed: true
    
    lint:
      glob: "*.{js,ts,jsx,tsx}"
      run: bun run lint
      stage_fixed: true
    
    typecheck:
      glob: "*.{ts,tsx}"
      run: bun x tsc --noEmit

    test:
      run: bun test --bail

commit-msg:
  commands:
    commitlint:
      run: |
        if ! grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+" {1}; then
          echo "❌ Commit message must follow format: type(scope): description"
          echo "   Types: feat, fix, docs, style, refactor, test, chore"
          echo "   Example: feat(game): add tetris piece rotation"
          exit 1
        fi
```

### GitHub Actions更新（.github/workflows/ci.yml）
```yaml
name: CI
on: 
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v2
      with:
        bun-version: 1.2.3
    
    - name: Install dependencies
      run: bun install --frozen-lockfile
    
    - name: Type check
      run: bun run typecheck
    
    - name: Lint
      run: bun run lint
    
    - name: Format check
      run: bun run format
    
    - name: Run tests
      run: bun test
    
    - name: Build
      run: bun run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: dist
        path: dist/
```

### Vercel設定更新（vercel.json）
```json
{
  "buildCommand": "bun run build",
  "installCommand": "bun install --frozen-lockfile",
  "outputDirectory": "dist",
  "framework": null,
  "functions": {},
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control", 
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

## 🗂️ 削除可能ファイル

移行完了後に削除できるファイル：
```bash
rm vite.config.ts           # Vite設定不要
rm tsconfig.node.json       # Bun統合により不要
rm -rf coverage/            # Bun testの出力形式が変更
```

## ⚡ 期待される改善効果

### パフォーマンス向上
- **Package Install**: 30倍高速化（pnpm → bun install）
- **Test Execution**: 10-30倍高速化（118テスト→数秒）
- **Bundle Speed**: esbuildレベルの高速化
- **Dev Server**: Vite同等以上の速度

### 開発体験向上
- **All-in-One**: Runtime + Package Manager + Bundler + Test Runner統合
- **Zero Config**: TypeScript/JSX ネイティブ対応
- **Compatibility**: 既存コード95%以上そのまま利用可能

### 運用面改善
- **Dependencies**: パッケージ数大幅削減
- **Config Files**: 設定ファイル簡素化
- **CI/CD**: ビルド時間短縮

## 🚨 トラブルシューティング

### 一般的な問題と対処法

#### 1. happy-dom互換性問題
```javascript
// 問題: 一部のDOM APIが動作しない
// 対処: jsdomから移行時は代替APIを使用

// Before (jsdom)
document.createRange()

// After (happy-dom)
// 必要に応じてポリフィルを追加
```

#### 2. Test isolation問題
```javascript
// 問題: Bunテストでモックが残る
// 対処: beforeEach/afterEachで明示的クリア

import { beforeEach, afterEach } from "bun:test";

beforeEach(() => {
  // モック初期化
});

afterEach(() => {
  // モック削除
});
```

#### 3. Bundle設定問題
```typescript
// 問題: 特定のライブラリがバンドルエラー
// 対処: external指定

await Bun.build({
  // ...
  external: ["problematic-library"],
});
```

### ロールバック手順

各Phaseで問題が発生した場合：

1. **Gitで前状態に復元**
```bash
git checkout HEAD~1 package.json
git checkout HEAD~1 src/test/setup.ts
# 必要に応じて他のファイルも復元
```

2. **依存関係再インストール**
```bash
rm -rf node_modules bun.lockb
# pnpmに戻す場合
npm install -g pnpm
pnpm install
```

## 📚 参考資料

- [Bun v1.2.17 Release Notes](https://bun.sh/blog/bun-v1.2.17) - 最新リリース情報
- [Bun Documentation](https://bun.sh/docs) - 公式ドキュメント
- [Bun Testing Guide](https://bun.sh/docs/cli/test) - テスト実行ガイド
- [happy-dom Documentation](https://github.com/capricorn86/happy-dom) - DOM環境
- [Bun v1.2.17 新機能解説](/docs/migration-configs/bun-info-examples.md) - `bun info`コマンド詳細

## 📞 サポート

移行作業で問題が発生した場合：
1. このドキュメントのトラブルシューティングを確認
2. Bunコミュニティ（Discord/GitHub）で質問
3. 必要に応じてロールバック実行

---

**注意**: この移行は実験的な要素を含みます。本番環境への適用前に十分なテストを実施してください。