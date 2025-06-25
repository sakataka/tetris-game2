# コードレビュー分析 - 修正項目検討

## 概要

コードレビューで指摘された4項目について詳細分析を行い、修正の必要性と実装方針を検討しました。

## 分析項目

### 1. DRY原則違反 - executeGameAction の重複

#### 現状
- `src/hooks/useKeyboardControls.ts` (21-28行目)
- `src/hooks/useTouchGestures.ts` (27-34行目)

両ファイルで同一構造の `executeGameAction` ヘルパー関数が重複定義されています。

```typescript
// 重複している関数
const executeGameAction = (action: () => void, useTransitionWrapper = true) => {
  if (isGameOver || isPaused) return;
  if (useTransitionWrapper) {
    startTransition(action);
  } else {
    action();
  }
};
```

#### 修正の必要性: **高**
- DRY原則に明確に違反
- 将来の変更時に2箇所の同期が必要
- 保守性とコードの一貫性に影響

#### 実装方針
共通カスタムフック `useExecuteGameAction` を作成:
```
src/hooks/useExecuteGameAction.ts を新規作成
既存の両フックから重複コードを削除し、新フックを利用
```

### 2. 副作用の分離 - Zustand store からの localStorage 操作

#### 現状
`src/store/gameStore.ts` で以下の副作用が直接実行されています:
- `saveHighScoreOnGameOver()` - moveDown/drop アクション内 (39, 47行目)
- `updateSettings()` - toggleGhostPiece アクション内 (73行目)

#### 修正の必要性: **中**
- Zustand の推奨パターンから逸脱
- 純粋なstate更新と副作用が混在
- テスタビリティの低下

#### 実装方針
副作用をコンポーネント側に移動:
```
useEffect でゲーム状態変化を監視
localStorage 操作を分離
store は純粋な状態管理に集中
```

### 3. ハイスコア更新 - CustomEvent から Zustand への移行

#### 現状
`src/utils/localStorage.ts` (109行目) で CustomEvent を使用:
```typescript
window.dispatchEvent(new CustomEvent("tetris-high-score-update"));
```

#### 修正の必要性: **中**
- Zustand での統一的な状態管理に合致しない
- React の宣言的パターンから逸脱
- イベントリスナーの管理が複雑

#### 実装方針
Zustand store での統一管理:
```
store にハイスコア状態を追加
CustomEvent を削除
useHighScore フックで store を直接監視
```

### 4. スタイル定数の活用 - Tailwind ハードコードの削減

#### 現状
`src/utils/styles.ts` でスタイル定数が定義されているが、以下のコンポーネントでハードコードされたクラスが使用:
- GameSettings.tsx
- Controls.tsx  
- HighScore.tsx
- ScoreBoard.tsx
- GameOverlay.tsx

例: `bg-gray-900/70 backdrop-blur-sm border-gray-700` などの重複

#### 修正の必要性: **低**
- 機能への直接的影響なし
- 保守性とデザイン一貫性の向上は有益
- 既存のスタイル定数は活用可能

#### 実装方針
段階的な統一:
```
既存の CARD_STYLES, BOARD_STYLES を拡張
新たなスタイル定数カテゴリを追加
ハードコードされたクラスを段階的に置換
```

## 修正優先度と推奨事項

### 即座に修正すべき項目 (優先度: 高)
1. **DRY原則違反** - コード品質への直接的影響

### 検討して修正すべき項目 (優先度: 中)
2. **副作用の分離** - アーキテクチャの改善
3. **CustomEvent の置換** - 状態管理の統一

### 任意で修正する項目 (優先度: 低)
4. **スタイル定数の活用** - 保守性の向上

## リスクと注意点

### 高リスク修正項目
- **副作用の分離**: 状態更新タイミングが変わる可能性
- **CustomEvent 置換**: ハイスコア更新の表示タイミングに影響

### 低リスク修正項目
- **DRY原則違反**: 内部実装の変更のみ
- **スタイル定数**: 見た目への影響のみ

## テスト対象

修正後は以下の機能テストが必要:
- ゲーム操作 (キーボード・タッチ)
- ハイスコア更新・表示
- ゴーストピース設定保存
- UI の見た目確認

## 結論

1項目 (DRY原則違反) は即座に修正し、2-3項目は慎重に検討の上で修正、4項目は任意で修正することを推奨します。