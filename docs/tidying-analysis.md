# Tetris Game Tidying Analysis

Kent Beck's Tidying 原則に基づくコードベース改善案

## Tidying の基本原則

1. **Making code easier to change** - 変更しやすいコードにする
2. **Removing duplication** - 重複を取り除く  
3. **Improving naming** - 命名を改善する
4. **Separating concerns** - 関心事を分離する
5. **Reducing complexity** - 複雑性を減らす

## 現在のコードベース構造

```
src/
├── components/          # React UI components
│   ├── game/           # Game-specific components (11 files)
│   ├── layout/         # Layout components (4 files)
│   └── ui/             # Reusable UI primitives (5 files)
├── game/               # Pure game logic (8 files)
├── hooks/              # Custom React hooks (10 files)
├── store/              # Zustand stores (4 files)
├── types/              # TypeScript definitions (4 files)
├── utils/              # Shared utilities (4 files)
├── locales/            # Translation files (2 files)
└── i18n/               # i18n configuration (1 file)
```

## 特定された改善項目

### 1. 🧹 一時ファイルの清掃 (Priority: High)

**問題**: 開発中の一時ファイルが残存
- `src/store/gameStore.test.ts.temp` - 不要な一時ファイル

**解決策**: 一時ファイルを削除し、git ignore パターンを確認

### 2. 🔄 hooks/useGameSelectors.ts の責任分離 (Priority: High)

**問題**: 1つのファイルに異なる責任のセレクターが混在
```typescript
// 現在: すべてが useGameSelectors.ts に混在
export const useScoreState = () => { /* score関連 */ };
export const useGameActions = () => { /* action関連 */ };  
export const useBoardData = () => { /* board関連 */ };
```

**解決策**: 責任別にファイルを分離
```
hooks/
├── selectors/
│   ├── useScoreSelectors.ts    # useScoreState
│   └── useBoardSelectors.ts    # useBoardData
├── actions/
│   └── useGameActions.ts       # useGameActions
└── ...
```

### 3. 📁 フックディレクトリの整理 (Priority: Medium)

**問題**: hooks/ 配下がフラットな構造で責任が不明確

**現在の構造**:
```
hooks/
├── useAnimatedValue.ts
├── useAnimationCompletionHandler.ts
├── useCellAnimation.ts
├── useGameLoop.ts
├── useGameSelectors.ts
├── useHighScore.ts
├── useHighScoreSideEffect.ts
├── useKeyboardControls.ts
├── useSettingsSideEffect.ts
└── useTouchGestures.ts
```

**提案する構造**:
```
hooks/
├── selectors/          # 状態セレクター系
│   ├── useScoreSelectors.ts
│   └── useBoardSelectors.ts
├── actions/            # アクション系
│   └── useGameActions.ts
├── effects/            # 副作用系
│   ├── useHighScoreSideEffect.ts
│   └── useSettingsSideEffect.ts
├── ui/                 # UI関連
│   ├── useAnimatedValue.ts
│   ├── useAnimationCompletionHandler.ts
│   └── useCellAnimation.ts
├── controls/           # 入力制御系
│   ├── useKeyboardControls.ts
│   └── useTouchGestures.ts
├── core/               # コアゲームロジック
│   └── useGameLoop.ts
└── data/               # データ管理系
    └── useHighScore.ts
```

### 4. 🔧 定数の重複削除 (Priority: Medium)

**問題**: `game/gameConstants.ts` で新旧両方の形式をサポート
```typescript
// 旧形式（下位互換）
export const BOARD_WIDTH = GAME_CONSTANTS.BOARD_WIDTH;
export const BOARD_HEIGHT = GAME_CONSTANTS.BOARD_HEIGHT;
// ... 他多数

// 新形式  
export const GAME_CONSTANTS = {
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  // ...
};
```

**解決策**: 段階的移行
1. 使用箇所を新形式 `GAME_CONSTANTS.XXX` に変更
2. 旧形式のエクスポートを削除

### 5. ✂️ 大きなフックの分割 (Priority: Medium)

**問題**: `useBoardData` が複数の責任を持つ (50+ lines)
- ボードデータの取得
- 位置計算ロジック
- セル状態の判定
- アニメーション状態の管理

**解決策**: 責任別に分割
```typescript
// useBoardSelectors.ts
export const useBoardMatrix = () => { /* board matrix only */ };
export const usePlacedPositions = () => { /* positions only */ };

// useCellStateCalculator.ts  
export const useCellStates = () => { /* cell state logic */ };

// usePositionCalculators.ts
export const usePositionUtils = () => { /* position calculations */ };
```

### 6. 📝 命名の改善 (Priority: Low)

**問題**: 一部の命名が意図を明確に表現していない

**改善案**:
```typescript
// Before → After
clearAnimationStates → clearAnimationData (より具体的)
animationTriggerKey → animationTrigger (冗長な 'Key' を削除)
BoardMatrix → GameBoard (ドメイン用語を使用)
```

### 7. 🧪 重複テストパターンの統一 (Priority: Low)

**問題**: テストで似たようなセットアップが重複

**解決策**: 共通テストヘルパーの作成
```typescript
// tests/helpers/gameTestUtils.ts
export const createTestGameState = (overrides = {}) => { /* ... */ };
export const createMockTetromino = (type, position) => { /* ... */ };
```

## 実装優先順位

### Phase 1: クリティカル改善 (即座に実施)
1. 一時ファイルの削除
2. useGameSelectors.ts の分割

### Phase 2: 構造改善 (1-2日)
3. hooks ディレクトリの整理
4. 定数の統一

### Phase 3: 品質向上 (必要に応じて)
5. 大きなフックの分割
6. 命名の改善
7. テストヘルパーの統一

## 期待される効果

### 保守性の向上
- ファイルの責任が明確になり、変更影響範囲が限定される
- 新機能追加時に適切な場所を見つけやすくなる

### 開発効率の向上
- 関連コードがグループ化され、必要なファイルを見つけやすくなる
- IDE の自動補完やナビゲーションが向上

### コード品質の向上
- 重複の削除により、一貫性が保たれやすくなる
- 適切な命名により、コードの意図が明確になる

### チーム開発の円滑化
- 統一された構造により、チームメンバーが理解しやすくなる
- レビューがしやすくなる

## 注意事項

- すべての変更は既存のテストが通ることを確認してから実施
- 段階的に実施し、各フェーズでテストとビルドを確認
- TypeScript の型エラーが発生しないよう注意深く進める
- 既存の機能に影響を与えないよう、リファクタリングのみに留める

## 次のステップ

1. この分析レポートのレビューと承認
2. Phase 1 の実装開始
3. 各フェーズ完了後の効果測定
4. 継続的な改善プロセスの確立