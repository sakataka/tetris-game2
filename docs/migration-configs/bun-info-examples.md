# Bun v1.2.17 新機能: `bun info` コマンド使用例

## 概要

Bun v1.2.17で `bun pm view` が `bun info` に変更されました。このコマンドはパッケージメタデータを npm registry から取得し、説明、バージョン、依存関係などを表示します。

## 基本的な使用方法

### パッケージ情報の取得

```bash
# React の情報を取得
bun info react

# 特定のバージョンの情報を取得
bun info react@19.1.0

# TypeScript の情報を取得
bun info typescript

# 詳細情報を取得
bun info --verbose react
```

## 実用例

### 1. プロジェクトで使用中のパッケージ確認

```bash
# 現在のプロジェクトで使用中のパッケージの最新情報を確認
bun info react
bun info react-dom
bun info zustand
bun info framer-motion
bun info @testing-library/react
```

### 2. 互換性チェック

```bash
# TypeScript の最新バージョンと現在使用中のバージョンを比較
bun info typescript

# Node.js 互換性の確認
bun info @types/node
```

### 3. セキュリティ情報確認

```bash
# パッケージのセキュリティ情報と最新バージョンを確認
bun info lodash
bun info axios
bun info express
```

## 出力例

### React パッケージ情報の例

```bash
$ bun info react

react - A declarative, efficient, and flexible JavaScript library for building user interfaces.

keywords: react, framework, javascript, ui, components
version: 19.1.0
tag: latest

dist
.tarball: https://registry.npmjs.org/react/-/react-19.1.0.tgz
.shasum: 1234567890abcdef...
.integrity: sha512-...
.unpackedSize: 2.1 MB

dependencies:
loose-envify: ^1.1.0

maintainers:
- facebook
- react-team

dist-tags:
latest: 19.1.0
next: 19.2.0-beta.1
canary: 19.2.0-canary.123

published 2 months ago by react-team
```

## 開発ワークフローでの活用

### 1. アップデート前の確認

```bash
# アップデート対象パッケージの情報確認
bun info react
bun info typescript
bun info vite

# 破壊的変更の確認
bun info --verbose react | grep "major\|breaking"
```

### 2. 新規パッケージ導入検討

```bash
# 新しい状態管理ライブラリの検討
bun info zustand
bun info jotai
bun info valtio

# 比較項目: サイズ、メンテナンス状況、依存関係
```

### 3. セキュリティ監査

```bash
# プロジェクトの主要依存関係のセキュリティ状況確認
bun info react
bun info react-dom
bun info @types/react
bun info typescript
```

## スクリプトでの自動化

### package.json に便利なスクリプト追加

```json
{
  "scripts": {
    "info": "bun info",
    "check-updates": "bun info react && bun info typescript && bun info vite",
    "audit-deps": "bun info lodash && bun info axios && bun info express"
  }
}
```

### バッチチェックスクリプト

```bash
#!/bin/bash
# check-all-deps.sh

echo "=== Checking all project dependencies ==="

DEPS=("react" "react-dom" "typescript" "zustand" "framer-motion")

for dep in "${DEPS[@]}"; do
  echo "--- $dep ---"
  bun info "$dep" | head -10
  echo ""
done
```

## 従来の `bun pm view` からの移行

### v1.2.16以前 (廃止予定)

```bash
bun pm view react
bun pm view --verbose typescript
```

### v1.2.17以降 (推奨)

```bash
bun info react
bun info --verbose typescript
```

## CI/CD での活用例

### GitHub Actions での使用

```yaml
- name: Check dependency info
  run: |
    echo "=== Dependency Information ==="
    bun info react
    bun info typescript
    bun info vite
    
    echo "=== Security Check ==="
    bun info --verbose lodash | grep -i security || echo "No security info found"
```

### 自動化スクリプト例

```bash
#!/bin/bash
# automated-dep-check.sh

LOG_FILE="dependency-check-$(date +%Y%m%d).log"

{
  echo "=== Bun v1.2.17 Dependency Check - $(date) ==="
  echo "Bun version: $(bun --version)"
  echo ""
  
  CRITICAL_DEPS=("react" "typescript" "@types/react")
  
  for dep in "${CRITICAL_DEPS[@]}"; do
    echo "=== $dep ==="
    bun info "$dep"
    echo ""
  done
} | tee "$LOG_FILE"

echo "Dependency check completed. Log saved to $LOG_FILE"
```

## トラブルシューティング

### よくある問題と解決法

1. **パッケージが見つからない**
   ```bash
   # タイポの確認
   bun info raect  # ❌ typo
   bun info react  # ✅ correct
   ```

2. **プライベートレジストリの場合**
   ```bash
   # .npmrc の設定確認
   cat .npmrc
   
   # registry の確認
   bun info @company/private-package
   ```

3. **ネットワーク問題**
   ```bash
   # プロキシ設定の確認
   bun config list
   
   # レジストリ接続テスト
   curl -I https://registry.npmjs.org/react
   ```

## まとめ

`bun info` コマンドは Bun v1.2.17 で導入された強力なパッケージ情報取得ツールです。開発ワークフローに組み込むことで、依存関係の管理、セキュリティ監査、アップデート計画に役立ちます。