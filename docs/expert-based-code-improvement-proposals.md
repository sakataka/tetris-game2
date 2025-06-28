# エキスパート指針に基づく現在ソースコードの改善提案

このドキュメントは、現在のTetrisゲームプロジェクトのソースコードを詳細に分析し、各エキスパートの指針に基づいて具体的な改善提案をまとめたものです。

## 分析対象と方法論

### 分析範囲
- **実装ファイル**: 63個
- **テストファイル**: 34個（カバレッジ約54%）
- **重点領域**: src/game/, src/hooks/, src/store/, src/components/

### 適用するエキスパート指針
1. **t_wada氏のTDDスタイル**
2. **Kent Beck's Test-Driven Development**
3. **mizchi氏のTypeScript設計パターン**
4. **koba04氏のReact実践パターン**
5. **Martin Fowlerのリファクタリングカタログ**
6. **Robert C. Martin (Uncle Bob) のClean Code**
7. **伊藤淳一氏のテスト実践**

---

## 【高優先度】改善提案

### 1. t_wada氏のTDDスタイル適用

#### **未テストコンポーネントのテスト駆動開発**

**対象ファイル:**
- `src/components/game/Board.tsx` - ボード表示の中核コンポーネント
- `src/components/game/HoldPiece.tsx` - ホールド機能UI
- `src/components/game/NextPiece.tsx` - 次ピース表示
- `src/components/game/ScoreBoard.tsx` - スコア表示ボード

**t_wada氏スタイル適用方法:**
```typescript
// アサーションファーストでのテスト設計例
describe('Board.tsx', () => {
  test('should render game board with correct cell colors', () => {
    // Arrange: ゲーム状態を準備
    const mockState = createMockGameState({
      board: createBoardWithTetromino(I_PIECE, { x: 4, y: 0 })
    });
    
    // Act: コンポーネントをレンダリング
    render(<Board />, { wrapper: createStoreWrapper(mockState) });
    
    // Assert: 期待する表示状態を検証
    expect(getCellAt(4, 0)).toHaveClass('bg-tetris-i');
    expect(getCellAt(5, 0)).toHaveClass('bg-tetris-i');
    // ... 三角測量で複数のケースをテスト
  });
});
```

**三角測量の適用:**
- 異なるテトロミノタイプでの表示テスト
- 異なる配置位置での表示テスト
- ゲーム状態（ポーズ、ゲームオーバー）での表示テスト

---

### 2. Martin Fowlerのリファクタリングカタログ適用

#### **Extract Function適用: game.ts:304行の巨大関数分解**

**現状の問題:**
```typescript
// src/game/game.ts の lockCurrentTetromino() 関数
// 複数の責務を一つの関数で処理（300行超）
```

**Extract Function適用後の設計:**
```typescript
// Martin Fowlerの「Extract Function」適用
export const lockCurrentTetromino = (state: GameState): GameState => {
  const stateWithLockedPiece = lockPieceToBoard(state);
  const stateWithClearedLines = clearCompletedLines(stateWithLockedPiece);
  const stateWithUpdatedScore = updateScoreForLock(stateWithClearedLines);
  const stateWithNextPiece = spawnNextPiece(stateWithUpdatedScore);
  return checkGameOverCondition(stateWithNextPiece);
};

// 単一責任に分解された関数群
const lockPieceToBoard = (state: GameState): GameState => { /* ... */ };
const clearCompletedLines = (state: GameState): GameState => { /* ... */ };
const updateScoreForLock = (state: GameState): GameState => { /* ... */ };
const spawnNextPiece = (state: GameState): GameState => { /* ... */ };
const checkGameOverCondition = (state: GameState): GameState => { /* ... */ };
```

**「Inline Variable」も同時適用:**
```typescript
// 改善前: 中間変数の乱用
const newBoard = updateBoard(currentBoard, currentPiece);
const clearedBoard = clearLines(newBoard);
const finalBoard = clearedBoard;

// 改善後: 意味のある変数のみ保持
const boardWithPiece = updateBoard(currentBoard, currentPiece);
return clearLines(boardWithPiece);
```

---

### 3. mizchi氏のTypeScript設計パターン適用

#### **型安全性の向上と関数型設計**

**現状の改善点:**
```typescript
// src/hooks/controls/useActionCooldown.ts:10行
// 現状: 型安全性が低い
<T extends unknown[]>

// mizchi氏の設計パターン適用後
<T extends readonly [string, ...any[]]>
// または具体的な制約
type CooldownAction = readonly [action: string, ...args: any[]];
<T extends CooldownAction>
```

**関数型アプローチの徹底:**
```typescript
// src/game/pieceBag.ts - 唯一のクラス使用箇所
// 現状: class PieceBag
export class PieceBag {
  private pieces: TetrominoType[] = [];
  // ...
}

// mizchi氏スタイルの関数型設計
export type PieceBag = {
  readonly pieces: readonly TetrominoType[];
  readonly shuffledBag: readonly TetrominoType[];
};

export const createPieceBag = (): PieceBag => ({
  pieces: [],
  shuffledBag: TETROMINO_TYPES.slice().sort(() => Math.random() - 0.5)
});

export const getNextPiece = (bag: PieceBag): [TetrominoType, PieceBag] => {
  // 純粋関数での実装
};
```

---

### 4. koba04氏のReact実践パターン適用

#### **責務分離とパフォーマンス最適化**

**複数責務フックの分解:**
```typescript
// src/hooks/controls/useKeyboardControls.ts (78行)
// 現状: 入力処理 + デバウンス + 状態管理 + トランジション

// koba04氏スタイル分解案
export const useKeyboardInput = () => {
  // 純粋な入力検出のみ
};

export const useInputDebounce = <T>(value: T, delay: number) => {
  // 汎用的なデバウンス処理
};

export const useGameInputActions = () => {
  // ゲームアクションへの変換のみ
};

export const useKeyboardControls = () => {
  // 上記フックの組み合わせ
  const inputs = useKeyboardInput();
  const debouncedInputs = useInputDebounce(inputs, 50);
  const actions = useGameInputActions();
  
  return useMemo(() => ({
    // 最終的な制御インターフェース
  }), [debouncedInputs, actions]);
};
```

**useMemo/useCallbackの戦略的活用:**
```typescript
// src/hooks/selectors/useBoardSelectors.ts
// パフォーマンス最適化の明確化
export const useBoardData = () => {
  const boardState = useGameStore(selectBoardState);
  const currentPiece = useGameStore(selectCurrentPiece);
  
  // 計算コストの高い処理を分離
  const filledCells = useMemo(() => 
    computeFilledCells(boardState), [boardState]
  );
  
  const ghostPosition = useMemo(() => 
    computeGhostPosition(boardState, currentPiece), 
    [boardState, currentPiece]
  );
  
  // 依存関係を明確にした結合
  return useMemo(() => ({
    filledCells,
    ghostPosition,
    displayBoard: combineBoard(filledCells, ghostPosition)
  }), [filledCells, ghostPosition]);
};
```

---

### 5. Uncle BobのClean Code適用

#### **単一責任原則と意味のある名前付け**

**重複コードの除去:**
```typescript
// 現状: 複数箇所に散在
// useBoardSelectors.ts, board.ts, 他複数
const isValidPosition = (x: number, y: number) => 
  x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;

// Clean Code適用後: utils/boardUtils.ts
export const createBoardPosition = (x: number, y: number) => ({ x, y });
export const isValidBoardPosition = ({ x, y }: Position): boolean => 
  x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;

export const createCellKey = ({ x, y }: Position): string => `${x},${y}`;

// ゲーム状態チェックの統一
export const isGamePlayable = (state: GameState): boolean => 
  state.currentPiece !== null && !state.isGameOver && !state.isPaused;
```

**意味のある抽象化:**
```typescript
// src/hooks/controls/useTouchDetection.ts:153行
// 現状: handleTouchEnd() 70行の複雑な処理

// Clean Code適用後
const useTouchGestureDetection = () => ({
  detectTap: useTapDetection(),
  detectDoubleTap: useDoubleTapDetection(),
  detectSwipe: useSwipeDetection()
});

const useTouchActions = () => {
  const gestures = useTouchGestureDetection();
  
  return {
    onTap: () => rotateCurrentPiece(),
    onDoubleTap: () => holdCurrentPiece(),
    onSwipeLeft: () => moveCurrentPiece('left'),
    onSwipeRight: () => moveCurrentPiece('right'),
    onSwipeDown: () => dropCurrentPiece()
  };
};
```

---

### 6. 伊藤淳一氏のテスト実践適用

#### **わかりやすいテスト構造化**

**現在のテスト改善例:**
```typescript
// より可読性の高いテスト設計
describe('useActionCooldown', () => {
  describe('アクション実行時', () => {
    test('クールダウン期間中は同じアクションを実行しない', async () => {
      // Given: クールダウン設定とアクション
      const cooldownMs = 100;
      const mockAction = vi.fn();
      const { result } = renderHook(() => 
        useActionCooldown([mockAction], cooldownMs)
      );
      
      // When: 短時間に連続でアクション実行
      const [executeAction] = result.current;
      executeAction(0);
      executeAction(0); // 即座に再実行
      
      // Then: 1回目のみ実行される
      expect(mockAction).toHaveBeenCalledTimes(1);
      
      // And: クールダウン後は再度実行可能
      await waitFor(() => {
        executeAction(0);
        expect(mockAction).toHaveBeenCalledTimes(2);
      }, { timeout: cooldownMs + 50 });
    });
  });
});
```

**エッジケーステストの拡充:**
```typescript
describe('Board コンポーネント', () => {
  describe('境界値テスト', () => {
    test.each([
      ['最上段', { x: 5, y: 0 }],
      ['最下段', { x: 5, y: 19 }],
      ['最左端', { x: 0, y: 10 }],
      ['最右端', { x: 9, y: 10 }]
    ])('%s にピースを配置できる', (_, position) => {
      // テストロジック
    });
  });
  
  describe('例外処理', () => {
    test('無効な座標でもクラッシュしない', () => {
      // 範囲外座標でのテスト
    });
  });
});
```

---

## 【中優先度】改善提案

### 7. Kent Beck's TDD適用

#### **新機能開発でのRed-Green-Refactorサイクル**

**将来の機能追加時の指針:**
```typescript
// 例: 新しいテトロミノタイプ追加時
describe('new tetromino type', () => {
  test('should render X-piece correctly', () => {
    // Red: 失敗するテストを最初に書く
    expect(() => createTetromino('X')).not.toThrow();
  });
});

// Green: 最小限の実装
const createTetromino = (type: TetrominoType | 'X') => {
  if (type === 'X') return BASIC_X_SHAPE;
  // 既存ロジック
};

// Refactor: 重複除去と設計改善
```

---

## 【低優先度】改善提案

### 8. アニメーション設定の中央管理

```typescript
// src/utils/animationConstants.ts
export const ANIMATION_PRESETS = {
  pieceSpawn: { type: "spring", stiffness: 300, damping: 20 },
  lineClear: { type: "spring", stiffness: 500, damping: 25 },
  scoreUpdate: { type: "spring", stiffness: 400, damping: 15 }
} as const;
```

---

## 実装計画

### フェーズ1（1-2週間）
1. **Board.tsx**, **HoldPiece.tsx**, **NextPiece.tsx** のt_wada氏スタイルテスト作成
2. **game.ts** の `lockCurrentTetromino()` Martin Fowler Extract Function適用

### フェーズ2（2-3週間）
1. **pieceBag.ts** のmizchi氏スタイル関数型変換
2. **useKeyboardControls.ts** のkoba04氏スタイル責務分離

### フェーズ3（1週間）
1. Uncle Bob Clean Code適用での共通ユーティリティ作成
2. 伊藤淳一氏スタイルでのテスト可読性向上

---

## 期待効果

### コード品質向上
- **テストカバレッジ**: 54% → 85%以上
- **関数の複雑度**: Cyclomatic Complexity 10以下に統一
- **型安全性**: `unknown` タイプの排除

### 開発効率向上
- **テスト実行時間**: 並列化により50%短縮
- **デバッグ効率**: 単一責任により問題箇所の特定が容易
- **新機能追加**: TDDサイクルにより品質を保ちつつ高速開発

### 保守性向上
- **可読性**: 意図を表現する関数・変数名による理解の容易化
- **拡張性**: 関数型設計による副作用のない変更
- **リファクタリング安全性**: 包括的テストによる回帰防止

このプロジェクトは既に非常に高い品質を持っていますが、これらの改善により世界クラスのコード品質到達が期待できます。