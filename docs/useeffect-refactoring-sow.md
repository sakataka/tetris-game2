# 不要なuseEffect利用解消タスク - Statement of Work (SOW)

## プロジェクト概要

**目的**: ReactアプリケーションにおけるuseEffectの適切な利用を確保し、パフォーマンス問題や無限ループリスクを解消する

**期間**: 1-2週間

**優先度**: 高（パフォーマンスとコード品質向上のため）

## 現状分析

### 調査結果サマリー

総対象ファイル: **10ファイル**のuseEffect利用を調査

```
src/hooks/
├── ai/useAdvancedAIController.ts        ❌ 要修正
├── core/useGameLoop.ts                  ✅ 適切
├── effects/useHighScoreSideEffect.ts    ✅ 適切
├── controls/useActionCooldown.ts        ✅ 適切
├── controls/useKeyboardControls.ts      ⚠️  要改善
├── controls/useKeyboardInput.ts         ✅ 適切
├── controls/useTouchDetection.ts        ✅ 適切
├── common/useInputDebounce.ts           ✅ 適切
├── ui/useAnimatedValue.ts               ✅ 適切
└── ui/useResponsiveBoard.ts             ✅ 適切
```

## 重要度別問題特定

### 🔴 緊急 (High Priority)

#### 1. useAdvancedAIController.ts - 複雑なuseEffect

**問題箇所**: 267-355行目（約80行の巨大useEffect）

**問題内容**:
- **依存関係過多**: `[aiState.isEnabled, aiState.isPaused, aiSettings]`
- **責任の分散**: AI状態管理、タイマー制御、リプレイデータ管理が混在
- **可読性低下**: 80行の巨大なuseEffect
- **メンテナンス困難**: 複数の関心事が一つのEffectに集約

**影響度**: 高（AIシステムの中核部分、パフォーマンス・安定性に直結）

### 🟡 改善推奨 (Medium Priority)

#### 2. useKeyboardControls.ts - 複数useEffectの分散

**問題箇所**: 
- 99-115行目: 単発キー処理
- 118-120行目: リピートキー処理  
- 123-133行目: preventDefault処理

**問題内容**:
- **機能分散**: キーボード処理が3つのuseEffectに分かれている
- **重複する依存関係**: `executeKeyAction`を複数箇所で依存
- **統合可能**: 関連機能を統合することで理解しやすくなる

**影響度**: 中（機能は動作するが、可読性・保守性に影響）

## タスク詳細

### Task 1: useAdvancedAIController リファクタリング

**目標**: 巨大なuseEffectを責任分離し、保守性とパフォーマンスを向上

**実装方針**:

1. **AI状態管理の分離**
```typescript
// 現在: 1つの巨大useEffect
useEffect(() => {
  // AI有効/無効制御
  // タイマー管理  
  // リプレイデータ管理
  // クリーンアップ
}, [aiState.isEnabled, aiState.isPaused, aiSettings]);

// 改善後: 責任分離
useEffect(() => {
  // AI有効/無効制御のみ
}, [aiState.isEnabled]);

useEffect(() => {
  // AI一時停止制御のみ  
}, [aiState.isPaused]);

useEffect(() => {
  // AI設定変更処理のみ
}, [aiSettings]);
```

2. **カスタムフックへの分離**
```typescript
// 新規カスタムフック
function useAITimer() { /* タイマー制御専用 */ }
function useAIReplayRecording() { /* リプレイ記録専用 */ }
function useAIStateManager() { /* 状態管理専用 */ }
```

**成功基準**:
- ✅ 各useEffectが30行以下
- ✅ 単一責任原則の遵守
- ✅ 既存機能の完全維持
- ✅ パフォーマンステスト通過

### Task 2: useKeyboardControls 統合最適化

**目標**: 分散した3つのuseEffectを統合し、処理効率を向上

**実装方針**:

1. **処理の統合**
```typescript
// 現在: 3つの独立したuseEffect
useEffect(() => { /* 単発キー */ }, [pressedKeys, executeKeyAction, keyMapping]);
useEffect(() => { /* リピートキー */ }, [debouncedKeys, executeKeyAction]);  
useEffect(() => { /* preventDefault */ }, [keyMapping]);

// 改善後: 効率的な統合
useEffect(() => {
  // キー処理とpreventDefaultを統合
  // 重複する依存関係を解消
}, [/* 最適化された依存関係 */]);
```

**成功基準**:
- ✅ useEffect数を3個→2個以下に削減
- ✅ 依存関係の重複解消
- ✅ 全キーボード機能の正常動作確認

### Task 3: ベストプラクティス文書化

**目標**: プロジェクト内でのuseEffect利用基準を確立

**成果物**:
1. **useEffectガイドライン文書**
   - 適切な使用パターン
   - 避けるべきアンチパターン
   - 責任分離の指針

2. **コードレビューチェックリスト**
   - useEffect作成時の確認事項
   - リファクタリング判断基準

## 作業計画

### Phase 1: 準備・分析 (1-2日)
- [ ] 既存コードの詳細分析
- [ ] テストケース準備
- [ ] リファクタリング設計

### Phase 2: useAdvancedAIController修正 (3-4日)
- [ ] カスタムフック分離
- [ ] useEffect責任分離
- [ ] 単体テスト作成
- [ ] 結合テスト実行

### Phase 3: useKeyboardControls最適化 (1-2日)
- [ ] useEffect統合
- [ ] 機能テスト実行
- [ ] パフォーマンステスト

### Phase 4: 文書化・検証 (1日)
- [ ] ガイドライン作成
- [ ] コードレビュー実施
- [ ] CI/CDテスト実行

## 品質保証

### テスト戦略

**必須テスト**:
```bash
# 機能テスト
bun test src/hooks/ai/
bun test src/hooks/controls/

# パフォーマンステスト  
bun run test:perf

# 完全テストスイート
bun run test:full

# ビルド確認
bun run build
bun run lint
bun run typecheck
```

### 成功基準

**定量目標**:
- ✅ 全テストパス率: 100%
- ✅ TypeScriptエラー: 0件
- ✅ Lintエラー: 0件
- ✅ 平均useEffect行数: 30行以下

**定性目標**:
- ✅ コード可読性向上
- ✅ 保守性向上  
- ✅ パフォーマンス維持
- ✅ 機能の完全性保持

## リスク・制約

### 技術リスク
- **AI機能の動作変更**: 慎重なテストで対処
- **キーボード処理の回帰**: 段階的リファクタリングで対処

### 制約条件
- **機能変更禁止**: 既存機能は完全維持
- **破壊的変更禁止**: 外部APIは変更しない
- **パフォーマンス低下禁止**: ベンチマークで確認

## 完了条件

- [ ] 全対象ファイルのリファクタリング完了
- [ ] 全テストスイートパス  
- [ ] パフォーマンステストパス
- [ ] ガイドライン文書作成
- [ ] コードレビュー承認
- [ ] 本番環境デプロイ確認

---

**作成日**: 2025-07-12  
**更新日**: 2025-07-12  
**ステータス**: 計画中