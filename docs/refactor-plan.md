# テトリスゲーム リファクタリング計画

このドキュメントは、プロジェクトの品質向上を目的としたリファクタリング計画です。
**テーマ**: シンプル、最新技術、冗長性排除、意図の明確化、一貫性

---

## Step 1: 基盤整理・冗長性排除

### 重複コード削除

- [x] `src/utils/colors.ts` 作成：Board.tsx と NextPiece.tsx の色彩ロジック統合
- [x] `src/utils/constants.ts` 作成：プロジェクト全体の定数を集約
- [x] `src/utils/styles.ts` 作成：共通の Tailwind CSS パターンを定数化
- [x] Board.tsx と NextPiece.tsx から重複する `getCellColor` 関数を削除

### ディレクトリ構造の整理

- [x] `src/components/game/` ディレクトリ作成（ゲーム固有コンポーネント用）
- [x] `src/components/layout/` ディレクトリ作成（レイアウトコンポーネント用）
- [x] ゲーム関連コンポーネントを適切なディレクトリに移動
- [x] Import 文の整理とパス更新

### ユーティリティ関数の統一

- [x] 位置計算関連の処理を `src/utils/position.ts` に集約
- [x] アニメーション共通処理を `src/utils/animation.ts` に抽出
- [x] 不要なファイルや未使用のコードを `knip` で検出・削除

## Step 2: 最新技術適用

### React 19 機能の活用

- [x] `React.memo` を削除し、React Compiler の自動最適化に移行
- [x] `useTransition` を活用してゲームループのパフォーマンス最適化
- [x] Concurrent 機能を使用した非同期ゲーム状態更新の改善
- [x] React 19 の新しい Hook パターンの調査・適用

### TypeScript 5.8 機能の強化

- [x] `TetrominoType` の型定義を判別可能ユニオン型に更新
- [x] `GameState` にパターンマッチング的な型定義を追加
- [x] Switch 式を使用した `getCellColor` 関数の改善
- [x] より厳密な型定義でランタイムエラーを防止

### ES2024 新機能の活用

- [x] `clearLines` 関数で最新の Array メソッドを使用
- [x] Iterator ヘルパー関数の活用検討
- [x] 非同期処理の改善（Promise.withResolvers など）

## Step 3: 意図の明確化

### 命名規則の統一

- [ ] 関数名の改善（`movePiece` → `moveTetrominoBy` など）
- [ ] 定数名の統一（`CELL_SIZE` → `BOARD_CELL_SIZE_PX` など）
- [ ] 型定義名の改善（`number[][]` → `BoardMatrix` など）
- [ ] アニメーション関連の命名統一（`rotationKey` → `animationTriggerKey`）

### Import/Export パターンの統一

- [ ] 全コンポーネントを named export に統一
- [ ] Import 順序の統一（外部ライブラリ → 内部モジュール → 型定義）
- [ ] 型定義のimport/export パターン統一
- [ ] barrel export（index.ts）の適切な使用

### ドキュメンテーション強化

- [ ] 重要なビジネスロジックにコメント追加（ゲームオーバー判定など）
- [ ] 型定義に JSDoc コメント追加
- [ ] 複雑なアルゴリズム（スコア計算、ライン消去）の説明追加
- [ ] README の技術仕様セクション更新

## Step 4: シンプルさの追求

### コンポーネント分割

- [ ] `BoardCell` コンポーネントを Board.tsx から抽出
- [ ] `AnimatedScoreItem` コンポーネントを ScoreBoard.tsx から抽出
- [ ] `CellAnimationLogic` カスタムHook の作成
- [ ] `useAnimatedValue` カスタムHook の作成（スコア用）

### 状態管理の簡素化

- [ ] GameStore を機能別に分割（`useGameState`, `useGameActions`, `useAnimationState`）
- [ ] アニメーション専用 Hook `useTetrominoAnimation` の作成
- [ ] 状態更新ロジックの簡素化
- [ ] 不要な状態の削除

### 関数の簡素化

- [ ] 複雑な条件分岐の簡素化（Board.tsx のアニメーション制御）
- [ ] 純粋関数の抽出と単一責任原則の適用
- [ ] ネストした条件文の flat 化

## Step 5: 品質向上・テスト

### テストカバレッジ拡充

- [ ] UI コンポーネントの単体テスト追加
- [ ] アニメーション処理のテスト実装
- [ ] Integration テストの追加
- [ ] カスタム Hook のテスト実装
- [ ] E2E テストの検討・実装

### パフォーマンス最適化

- [ ] `requestAnimationFrame` の使用方法最適化
- [ ] 不要な再レンダリングの削減
- [ ] メモ化戦略の見直し
- [ ] バンドルサイズの最適化確認

### アクセシビリティ向上

- [ ] キーボードナビゲーションの改善
- [ ] コントラスト比の検証・改善
- [ ] ARIA ラベルの適切な設定

### エラーハンドリング強化

- [ ] 統一されたエラーハンドリングパターンの実装
- [ ] ゲーム状態検証関数の追加
- [ ] 型安全性の更なる強化
- [ ] エラー境界（Error Boundary）の実装

---

## 実行ガイドライン

### 優先順位
1. **Step 1** (基盤整理) → 即効性が高く、後続作業の基盤となる
2. **Step 3** (意図明確化) → 開発効率とメンテナンス性向上
3. **Step 4** (シンプル化) → コードの理解性と保守性向上
4. **Step 2** (最新技術) → パフォーマンス・開発体験向上
5. **Step 5** (品質向上) → 長期的な安定性確保

### 実行方針
- **段階的実装**: 1 Step ずつ確実に完了
- **動作確認**: 各 Step 後に機能テスト実施
- **コミット粒度**: タスク単位でコミット
- **品質確保**: リンター・テスト通過を確認

### 完了基準
- [ ] 全 Step の完了
- [ ] テストスイートの全パス
- [ ] パフォーマンス指標の維持・改善
- [ ] コードレビューの完了
- [ ] ドキュメントの更新完了

---

**📅 作成日**: 2025-06-21  
**👤 担当者**: Claude Code  
**📍 状態**: 計画策定完了 - 実行準備中