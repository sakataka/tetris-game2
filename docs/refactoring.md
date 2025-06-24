# リファクタリング計画

> **総合評価**: コードベース90/100点
> 
> 非常に完成度が高いソースコードですが、以下のリファクタリングポイントで更なる品質向上が期待できます。

## 優先度別リファクタリング項目

### 🔴 高優先度（必須実装）

#### 1. ピース配置処理の重複解消
- **おすすめ度**: 8/10
- **実装判断**: ✅ **やる**
- **工数**: 小（1-2時間）

**現状の問題**: 
ピースをボードに配置する処理が4箇所で重複実装されており、メンテナンス性が低下している。

**重複箇所**:
- `src/game/board.ts:36-57` - `placeTetromino`関数
- `src/hooks/useGameSelectors.ts:52-73` - displayBoard生成処理  
- `src/hooks/useGameSelectors.ts:85-103` - ghostPiecePositions生成処理
- `src/game/game.ts:119-132` - `_getPlacedPositions`関数

**重複しているロジック**:
```typescript
// 全4箇所で同じパターンが繰り返されている
shape.forEach((row, y) => {
  row.forEach((cell, x) => {
    if (cell) {
      const boardY = position.y + y;
      const boardX = position.x + x;
      if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
        // 各箇所で微妙に異なる処理
      }
    }
  });
});
```

**実装手順**:
1. `src/game/board.ts`に汎用ヘルパー関数`forEachPieceCell`を作成
2. 4箇所の処理を段階的に新関数を使用するよう変更
3. 各段階でテスト実行し動作確認
4. 不要になった重複コードを削除

**影響ファイル**:
- 直接: `src/game/board.ts`, `src/hooks/useGameSelectors.ts`, `src/game/game.ts`
- 間接: `src/components/game/Board.tsx`, テストファイル群

#### 2. ハイスコア保存ロジックの集約
- **おすすめ度**: 7/10
- **実装判断**: ✅ **やる**
- **工数**: 小（1時間）

**現状の問題**:
`moveDown`と`drop`関数で同一のハイスコア保存処理が重複している。

**重複箇所**:
- `src/store/gameStore.ts:32-34` - moveDown関数内
- `src/store/gameStore.ts:43-45` - drop関数内

**重複しているコード**:
```typescript
// moveDownとdrop両方に含まれる同一処理
if (!state.isGameOver && newState.isGameOver) {
  setHighScore(newState.score, newState.lines, newState.level);
}
```

**実装手順**:
1. `src/store/gameStore.ts`内に内部ヘルパー関数`saveHighScoreOnGameOver`を作成
2. `moveDown`と`drop`関数でヘルパー関数を使用
3. 未使用の`saveHighScoreIfNeeded`関数を削除または改善
4. テスト実行し動作確認

**提案実装**:
```typescript
// 内部ヘルパー関数
const saveHighScoreOnGameOver = (previousState: GameState, newState: GameState) => {
  if (!previousState.isGameOver && newState.isGameOver) {
    setHighScore(newState.score, newState.lines, newState.level);
  }
};

// 各関数での使用
moveDown: () => {
  set((state) => {
    const newState = moveTetrominoBy(state, 0, 1);
    saveHighScoreOnGameOver(state, newState);
    return newState;
  });
}
```

**影響ファイル**:
- 直接: `src/store/gameStore.ts`
- 間接: 全ての`moveDown`/`drop`を使用するコンポーネント・フック

### 🟡 中優先度（推奨実装）

#### 3. ボード描画のレンダリング最適化
- **おすすめ度**: 6/10
- **実装判断**: ⚠️ **条件付きでやる**
- **工数**: 中（2-4時間）
- **実装条件**: パフォーマンス問題が確認された場合のみ

**現状の問題**: 
20x10=200個のセルを毎フレーム再描画している（現状は問題なく動作）。

**最適化案**: `React.memo`による`BoardCell`の最適化で不変セルの再レンダリングをスキップ。

#### 4. アニメーション状態クリア処理の見直し
- **おすすめ度**: 6/10
- **実装判断**: ✅ **やる**
- **工数**: 小（1-2時間）

**現状の問題**:
`clearAnimationStates()`が複数箇所から重複して呼び出され、不要な処理が発生している。

**重複箇所**:
- `src/hooks/useGameLoop.ts:21` - 毎ゲームループで実行
- `src/hooks/useAnimationCompletionHandler.ts:12,19` - アニメーション完了時に実行

**問題のタイミング**:
1. ピース配置時に`moveDown()`実行
2. `useGameLoop`で即座に`clearAnimationStates()`実行  
3. アニメーション完了時に`useAnimationCompletionHandler`から再度実行

**実装手順**:
1. `src/hooks/useGameLoop.ts`から`clearAnimationStates()`呼び出しを削除
2. アニメーション完了時のみクリア処理を実行するよう変更
3. 既に空の状態への重複処理を防ぐ仕組みを追加（任意）
4. テスト実行し動作確認

**推奨修正（useGameLoop.ts）**:
```typescript
const gameLoop = (currentTime: number) => {
  if (currentTime - lastUpdateTime.current >= gameSpeed) {
    startTransition(() => {
      moveDown();
      // clearAnimationStates()の呼び出しを削除
    });
    lastUpdateTime.current = currentTime;
  }
  requestAnimationFrame(gameLoop);
};
```

#### 5. ハードドロップのダブルタップ対応
- **おすすめ度**: 6/10
- **実装判断**: ✅ **やる**
- **工数**: 小（1-2時間）

**現状の問題**:
コメントと実装に重大な不一致がある。

**不一致箇所**:
- `src/hooks/useTouchGestures.ts:65-66` - コメント: "ダブルタップでハードドロップ"
- 実際の実装: 全てのタップで回転処理を実行

**現在の実装**:
```typescript
// Handle tap for rotation (または double-tap for hard drop)
const handleTap = () => {
  rotate(); // 実際は回転のみ
};
```

**実装選択肢**:
1. **コメント修正**: "タップで回転"に変更（簡単）
2. **ダブルタップ実装**: 実際にダブルタップでハードドロップを実現

**推奨実装** (ダブルタップ対応):  
```typescript
const [lastTap, setLastTap] = useState<number>(0);

const handleTap = () => {
  const now = Date.now();
  const timeDiff = now - lastTap;
  
  if (timeDiff < 300) { // 300ms以内でダブルタップ
    drop(); // ハードドロップ
  } else {
    rotate(); // シングルタップで回転
  }
  setLastTap(now);
};
```

**影響ファイル**:
- 直接: `src/hooks/useTouchGestures.ts`
- 間接: `src/components/game/TouchControls.tsx`, タッチ操作テスト

### 🟢 低優先度（余裕があれば実装）

#### 6. 音量設定パラメータの整理
- **おすすめ度**: 5/10
- **実装判断**: ❌ **やらない**
- **詳細**: 音量設定があるが、サウンド機能が未実装
- **理由**: サウンド機能実装時に併せて対応する方が効率的
- **代替対応**: 設定コメントで「将来の機能拡張用」と明記

#### 7. ゴーストピース表示設定の活用
- **おすすめ度**: 5/10
- **実装判断**: ✅ **やる**
- **工数**: 小（30分）

**現状の問題**:
`GameSettings.showGhostPiece`フラグが存在するが実際の表示制御に使用されていない。

**設定定義箇所**:
- `src/utils/localStorage.ts` - デフォルト設定で`showGhostPiece: true`

**実際の表示箇所**:
- `src/hooks/useGameSelectors.ts` - ゴーストピース位置計算（設定無視）
- `src/components/game/Board.tsx` - ゴーストピース描画（設定無視）

**実装手順**:
1. `useGameSelectors.ts`でゲーム設定を取得
2. `showGhostPiece`がfalseの場合はゴーストピース計算をスキップ  
3. 設定変更時のリアルタイム反映確認
4. テスト実行し動作確認

**推奨修正（useGameSelectors.ts）**:
```typescript
const ghostPiecePositions = useMemo(() => {
  const settings = getGameSettings(); // 設定取得を追加
  const positions = new Set<string>();

  // 設定チェックを追加
  if (!settings.showGhostPiece || !currentPiece || !ghostPosition) {
    return positions;
  }

  // 既存のゴーストピース計算処理
  currentPiece.shape.forEach((row, y) => {
    // ...
  });
  return positions;
}, [currentPiece, ghostPosition]);
```

**影響ファイル**:
- 直接: `src/hooks/useGameSelectors.ts`
- 間接: `src/components/game/Board.tsx`（描画制御）

#### 8. スタイル定義の再利用性向上
- **おすすめ度**: 5/10
- **実装判断**: ❌ **やらない**
- **詳細**: Tailwind CSSクラス指定の重複
- **理由**: 現状で十分保守可能、優先度は低い
- **代替対応**: 将来的なデザインシステム構築時に検討

#### 9. Tetrominoデータへの色情報埋め込み
- **おすすめ度**: 4/10
- **実装判断**: ❌ **やらない**
- **詳細**: 都度`getTetrominoColorIndex(type)`で色を取得
- **理由**: 現状の実装で十分、性能面の影響は微小
- **代替対応**: 大規模な属性拡張時に検討

#### 10. 統合テスト(E2Eテスト)の導入
- **おすすめ度**: 4/10
- **実装判断**: ❌ **やらない**
- **詳細**: 単体・コンポーネントテストは充実、E2Eテストは未実装
- **理由**: 工数対効果を考慮し、現状のテスト品質で十分
- **代替対応**: 重要な機能変更時のみ手動での統合テストを実施

## 実装スケジュール

### Phase 1: 重複解消（優先度高）
1. **ピース配置処理の重複解消** - 1週目
2. **ハイスコア保存ロジックの集約** - 1週目

### Phase 2: パフォーマンス・UX改善（優先度中）
3. **アニメーション状態クリア処理の見直し** - 2週目
4. **ハードドロップのダブルタップ対応** - 2週目
5. **ゴーストピース表示設定の活用** - 2週目

### Phase 3: 条件付き実装
6. **ボード描画のレンダリング最適化** - パフォーマンス問題確認時

## 技術方針

- **テスト駆動開発**: リファクタリング前後でテストケース追加
- **漸進的改善**: 一度に複数項目を変更せず、段階的に実装
- **品質保証**: 各フェーズ完了後にlint・typecheck・testを実行
- **コード品質**: Biomeの設定に従い、一貫したコードスタイルを維持

## 期待効果

- **保守性向上**: 重複コード解消により、将来の変更時の漏れを防止
- **バグ予防**: ロジック統一により、状態の不整合を回避
- **ユーザビリティ**: 操作周りの改善でプレイ体験向上
- **開発効率**: 整理されたコードベースで新機能開発が円滑化