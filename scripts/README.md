# Scripts Documentation

このディレクトリには、プロジェクトの品質保証とメンテナンスを支援するスクリプトが含まれています。

## i18n Key Consistency Checker

### 概要
`check-i18n-keys.ts` は、翻訳キーの整合性をチェックするスクリプトです。コードベース内で使用されている翻訳キーと、翻訳ファイルで定義されているキーの間の不整合を検出します。

### 機能
- **翻訳キー抽出**: JSON翻訳ファイルからすべてのドット記法キーを抽出
- **使用キー検出**: TypeScript/TSXファイルから`t()`関数呼び出しを検出
- **不整合報告**: 不足キーと未使用キーをレポート
- **ネストキー対応**: `game.score.title`のような階層構造をサポート

### 使用方法

#### コマンド実行
```bash
# NPMスクリプト経由（推奨）
bun run check:i18n

# 直接実行
bun run scripts/check-i18n-keys.ts
```

#### 出力例
```
🔍 i18n Key Consistency Check Results
=====================================

📊 Statistics:
   Translation keys: 40
   Used keys: 33
   Missing keys: 0
   Unused keys: 7

⚠️  Unused Keys (7):
   These keys are defined in translation files but not used in code:
   - game.title
   - game.holdPiece

✨ i18n key consistency check completed successfully!
```

### 検出パターン
スクリプトは以下のパターンでt()関数呼び出しを検出します：

```typescript
t("game.score.title")     // ダブルクォート
t('game.score.title')     // シングルクォート
t(`game.score.title`)     // バッククォート
```

### エラーハンドリング
- **不足キー検出時**: exit code 1でプロセス終了（ビルド失敗）
- **未使用キー検出時**: 警告メッセージのみ（ビルド継続）

### 設定
- **翻訳ファイルディレクトリ**: `src/locales/`
- **ソースコードディレクトリ**: `src/`
- **対象ファイル拡張子**: `.ts`, `.tsx`, `.js`, `.jsx`
- **除外ディレクトリ**: `node_modules`, `dist`, `.git`, `coverage`

### CI/CD統合
CIパイプラインでの使用例：

```yaml
- name: Check i18n consistency
  run: bun run check:i18n
```

### トラブルシューティング

#### よくある問題
1. **Missing Keys**: コードで使用しているキーが翻訳ファイルに存在しない
   - 解決方法: 翻訳ファイルにキーを追加するか、コードのキー名を修正

2. **Unused Keys**: 翻訳ファイルにあるキーがコードで使用されていない
   - 解決方法: 不要なキーを削除するか、コードで使用開始

3. **Template Literal Variables**: `t(\`game.${variable}\`)` のような動的キーは検出されない
   - 制限事項: 静的キーのみサポート

### 開発者向け情報

#### 内部関数
- `extractKeysFromObject()`: ネストオブジェクトからドット記法キーを抽出
- `loadTranslationKeys()`: 翻訳ファイルを読み込みキーを取得
- `findSourceFiles()`: ソースファイルを再帰的に検索
- `extractUsedKeys()`: 正規表現でt()呼び出しを抽出

#### 拡張方法
新しいパターンを追加する場合は、`extractUsedKeys()`関数内の`patterns`配列に正規表現を追加してください。

```typescript
const patterns = [
  /\bt\s*\(\s*["']([^"']+)["']\s*\)/g,  // 既存パターン
  /\bnewPattern\s*\(\s*["']([^"']+)["']\s*\)/g,  // 新パターン
];
```

### 関連ファイル
- 翻訳ファイル: `src/locales/en.json`, `src/locales/ja.json`
- i18n設定: `src/i18n/config.ts`
- NPMスクリプト: `package.json`