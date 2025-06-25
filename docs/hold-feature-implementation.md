# Hold Feature Implementation Plan

## 機能概要
テトリスのホールド機能を実装します。プレイヤーがShiftキーで現在のピースを「保持」し、任意のタイミングで交換できる機能です。

## 機能仕様

### 基本動作
1. **ピース保持**: 現在落下中のピースをホールドエリアに保存
2. **ピース交換**: ホールドエリアのピースと現在のピースを交換
3. **ワンロック制御**: 1回のピース設置につき1回のみホールド可能

### ルール
- 初回ホールド: 現在のピースを保持し、次のピースを新しい現在のピースとする
- 2回目以降: ホールドピースと現在のピースを交換
- ピース設置後: ホールド可能フラグがリセットされ、再度ホールド可能

### 操作
- **Shiftキー**: ホールド実行
- ゲームオーバー・一時停止中は無効

## 実装計画

### 1. 型定義の拡張
```typescript
// src/types/game.ts
interface GameState {
  // ... existing fields
  heldPiece: TetrominoTypeName | null;
  canHold: boolean;
}
```

### 2. ゲームロジック
```typescript
// src/game/game.ts
export function holdCurrentPiece(state: GameState): GameState {
  // Hold logic implementation
}
```

### 3. 状態管理
```typescript
// src/store/gameStore.ts
interface GameStore extends GameState {
  // ... existing methods
  holdPiece: () => void;
}
```

### 4. UIコンポーネント
```typescript
// src/components/game/HoldPiece.tsx
export function HoldPiece() {
  // Hold piece display component
}
```

## 実装詳細

### ゲームロジック仕様
1. **holdCurrentPiece()関数**:
   - 現在のピースがnullまたはcanHoldがfalseの場合、何もしない
   - 初回ホールド: currentPieceをheldPieceに保存、nextPieceを新しいcurrentPieceに
   - 交換ホールド: heldPieceとcurrentPieceを交換
   - canHoldをfalseに設定
   - ゴーストピース位置を更新

2. **lockCurrentTetromino()関数の更新**:
   - ピース設置時にcanHoldをtrueにリセット

3. **createInitialGameState()関数の更新**:
   - heldPiece: null, canHold: trueで初期化

### UIコンポーネント仕様
- **HoldPiece.tsx**:
  - NextPiece.tsxをベースに作成
  - 4x4グリッドでピース形状を表示
  - ホールドピースがない場合は空のボックス表示
  - canHoldがfalseの場合はグレーアウト表示

### キーボード操作仕様
- **Shiftキー**:
  - ゲーム中のみ有効
  - ゲームオーバー・一時停止中は無効
  - executeGameActionを使用してトランジション対応

### 国際化対応
- **日本語 (ja.json)**:
  - "hold": "ホールド"
  - "holdPiece": "ホールドピース"
  - "holdDescription": "ピースを保存"

- **英語 (en.json)**:
  - "hold": "Hold"
  - "holdPiece": "Hold Piece"
  - "holdDescription": "Save piece"

## テスト戦略

### 単体テスト (hold.test.ts)
1. **基本動作テスト**:
   - 初回ホールド: 現在のピースが保存される
   - 交換ホールド: ピースが正しく交換される
   - ワンロック制御: 1回のピース設置につき1回のみホールド可能

2. **エッジケーステスト**:
   - 現在のピースがnullの場合
   - canHoldがfalseの場合
   - ゲームオーバー・一時停止中の場合

3. **ゴーストピーステスト**:
   - ホールド後のゴーストピース位置が正しく更新される

### 統合テスト
1. **キーボード操作テスト**:
   - Shiftキーでホールド機能が動作する
   - 無効状態でShiftキーを押しても何も起こらない

2. **UI表示テスト**:
   - ホールドピースが正しく表示される
   - canHoldの状態に応じた視覚的フィードバック

## 実装手順チェックリスト

### Phase 1: Core Implementation
- [x] ドキュメント作成
- [ ] 型定義更新 (GameState)
- [ ] ゲームロジック実装 (holdCurrentPiece関数)
- [ ] 状態管理更新 (GameStore)

### Phase 2: UI Implementation
- [ ] HoldPieceコンポーネント作成
- [ ] レイアウト更新 (Game.tsx)
- [ ] キーボード操作追加

### Phase 3: Localization & Polish
- [ ] 国際化対応 (ja.json, en.json)
- [ ] 操作説明更新 (Controls.tsx)

### Phase 4: Testing & Quality
- [ ] テスト実装 (hold.test.ts)
- [ ] 既存テストの更新
- [ ] 品質チェック (テスト・型チェック・リント)
- [ ] 動作確認

## 期待効果
- 現代テトリスの標準機能により戦略性が向上
- プレイヤーのピース管理能力が向上
- ゲーム体験の向上とリプレイ性の増加

## 工数見積もり
- 実装: 4-6時間
- テスト: 1-2時間
- 合計: 5-8時間