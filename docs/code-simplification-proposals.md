# Tetris Game Code Simplification Proposals

## 概要

このドキュメントは、Tetris Gameプロジェクトのソースコードをシンプルかつ分かりやすくするための包括的な改善提案をまとめています。既存の機能を維持しながら、保守性・可読性・パフォーマンスの向上を目指します。

## 分析概要

プロジェクト全体を詳細に分析した結果、以下の領域で改善の機会を特定しました：

- **ゲームロジック**: 複雑な関数の分割、重複ロジックの統合
- **状態管理**: セレクターの最適化、重複設定の解消  
- **コンポーネント**: 重複レンダリングロジックの共通化
- **カスタムフック**: 責任の分離、共通パターンの抽出

## 🔴 高優先度の改善提案

### 1. TetrominoGrid共通コンポーネントの作成

**問題**: `NextPiece.tsx`と`HoldPiece.tsx`で80行以上の重複コード

**現在のコード**:
```typescript
// NextPiece.tsx と HoldPiece.tsx で同一のロジック
Array.from({ length: 3 }).map((_, y) =>
  Array.from({ length: NEXT_PIECE_GRID_SIZE }).map((_, x) => {
    const isActive = shape?.[y]?.[x] === 1;
    return (
      <div
        key={`${prefix}-${y * NEXT_PIECE_GRID_SIZE + x}`}
        className={cn(
          "w-4 h-4 rounded-sm transition-all duration-200",
          isActive
            ? cn(tetrominoColor, "border border-white/20 shadow-sm")
            : "bg-gray-800",
        )}
      />
    );
  }),
)}
```

**改善案**: 共通コンポーネントの作成
```typescript
interface TetrominoGridProps {
  shape: number[][] | null;
  tetrominoColor: string;
  gridSize: number;
  keyPrefix: string;
  disabled?: boolean;
}

function TetrominoGrid({ 
  shape, 
  tetrominoColor, 
  gridSize, 
  keyPrefix, 
  disabled = false 
}: TetrominoGridProps) {
  return (
    <div className={cn(
      "grid gap-[1px] bg-gray-700 rounded-lg overflow-hidden w-fit mx-auto p-1",
      disabled && "opacity-50"
    )}>
      {Array.from({ length: 3 }).map((_, y) =>
        Array.from({ length: gridSize }).map((_, x) => {
          const isActive = shape?.[y]?.[x] === 1;
          return (
            <div
              key={`${keyPrefix}-${y * gridSize + x}`}
              className={cn(
                "w-4 h-4 rounded-sm transition-all duration-200",
                isActive
                  ? cn(tetrominoColor, "border border-white/20 shadow-sm")
                  : "bg-gray-800",
              )}
            />
          );
        })
      )}
    </div>
  );
}
```

**効果**: 重複コード削除、保守性向上、一貫性確保

### 2. HighScoreコンポーネントの分割

**問題**: 複雑な条件分岐による3つの異なる表示モード

**現在のコード**:
```typescript
if (!showFullList && !currentHighScore) {
  return (<NoScoreView />);
}

if (showFullList) {
  return (<FullListView />);
}

return (<CurrentScoreView />);
```

**改善案**: 責任の分離
```typescript
// 独立したコンポーネントに分割
function NoHighScore() {
  return (
    <div className="text-center text-gray-400 py-8">
      <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>{t("highScore.noScore")}</p>
    </div>
  );
}

function CurrentHighScore({ score }: { score: HighScoreData }) {
  return (
    <div className="flex items-center justify-between">
      <span>{t("highScore.current")}</span>
      <span className="font-bold text-yellow-400">
        {score.score.toLocaleString()}
      </span>
    </div>
  );
}

function HighScoreList({ scores }: { scores: HighScoreData[] }) {
  return (
    <div className="space-y-2">
      {scores.map((score, index) => (
        <HighScoreItem key={score.id} score={score} rank={index + 1} />
      ))}
    </div>
  );
}

// メインコンポーネント
function HighScore({ showFullList, className }: HighScoreProps) {
  const currentHighScore = useHighScoreStore(state => state.currentHighScore);
  const highScoresList = useHighScoreStore(state => state.highScoresList);

  if (showFullList) {
    return <HighScoreList scores={highScoresList} />;
  }
  
  if (currentHighScore) {
    return <CurrentHighScore score={currentHighScore} />;
  }
  
  return <NoHighScore />;
}
```

**効果**: 単一責任原則の適用、テスト可能性向上、複雑度軽減

### 3. ゲームロジック関数の分割

**問題**: `lockCurrentTetromino()`が複数の責任を持つ

**改善案**: 機能分割
```typescript
// 個別の責任を持つ関数に分割
function preserveBoardForAnimation(state: GameState): GameState {
  const { clearingLines } = findCompletedLines(state.board);
  return clearingLines.length > 0
    ? { ...state, boardBeforeClear: state.board }
    : state;
}

function clearCompletedLines(state: GameState): GameState {
  const { board: newBoard, clearingLines } = clearLines(state.board);
  const linesCleared = clearingLines.length;
  
  if (linesCleared === 0) return state;
  
  return {
    ...state,
    board: newBoard,
    clearingLines,
    lines: state.lines + linesCleared,
    score: state.score + calculateScore(linesCleared, state.level),
    level: calculateLevel(state.lines + linesCleared),
  };
}

function spawnNextPiece(state: GameState): GameState {
  const newPiece = createTetromino(state.nextPiece);
  const nextPieceType = state.pieceBag.getNextPiece();
  
  return {
    ...state,
    currentPiece: newPiece,
    nextPiece: nextPieceType,
    canHold: true,
    ghostPosition: calculateGhostPosition(state.board, newPiece),
  };
}

// メイン関数はコーディネーターとして機能
function lockCurrentTetromino(state: GameState): GameState {
  if (!state.currentPiece) return state;

  let newState = state;
  
  // 1. ピースをボードに配置
  newState = placePieceOnBoard(newState);
  
  // 2. アニメーション用にボード状態を保存
  newState = preserveBoardForAnimation(newState);
  
  // 3. 完成ラインをクリア
  newState = clearCompletedLines(newState);
  
  // 4. 次のピースを生成
  newState = spawnNextPiece(newState);
  
  // 5. ゲームオーバーチェック
  newState = checkGameOver(newState);
  
  return newState;
}
```

**効果**: 関数の責任明確化、テスト容易性向上、再利用性向上

### 4. セレクターの最適化

**問題**: 不要な`useMemo`の使用

**現在のコード**:
```typescript
export const useScoreState = () => {
  const score = useGameStore((state) => state.score);
  const lines = useGameStore((state) => state.lines);
  const level = useGameStore((state) => state.level);
  
  return useMemo(() => ({ score, lines, level }), [score, lines, level]);
};
```

**改善案**: 単一セレクターの使用
```typescript
export const useScoreState = () => 
  useGameStore((state) => ({
    score: state.score,
    lines: state.lines,
    level: state.level,
  }));
```

**効果**: パフォーマンス向上、コード簡素化

## 🟨 中優先度の改善提案

### 5. 共通アクションハンドラーの作成

**問題**: ゲーム状態チェックが複数箇所で重複

**改善案**:
```typescript
export function useGameActionHandler() {
  const isGameOver = useGameStore(state => state.isGameOver);
  const isPaused = useGameStore(state => state.isPaused);
  const [, startTransition] = useTransition();
  
  return useCallback((action: () => void, urgent = false) => {
    if (isGameOver || isPaused) return;
    
    if (urgent) {
      action();
    } else {
      startTransition(action);
    }
  }, [isGameOver, isPaused, startTransition]);
}
```

### 6. 定数の中央集約

**問題**: マジックナンバーが散在

**改善案**:
```typescript
// src/utils/gameConstants.ts
export const GAME_CONSTANTS = {
  BOARD: {
    WIDTH: 10,
    HEIGHT: 20,
    CELL_SIZE: 30,
  },
  TIMING: {
    SOFT_DROP_INTERVAL: 50,
    HARD_DROP_DELAY: 100,
    LINE_CLEAR_DELAY: 300,
  },
  TETROMINO: {
    GRID_SIZE: 4,
    NEXT_PIECE_GRID_SIZE: 4,
    ROTATION_STATES: [0, 90, 180, 270] as const,
  },
  ANIMATION: {
    DROP_DURATION: 200,
    PLACE_DURATION: 150,
    CLEAR_DURATION: 300,
  },
} as const;
```

### 7. AnimatedButtonの共通化

**問題**: motion.div + Button パターンの重複

**改善案**:
```typescript
interface AnimatedButtonProps extends ButtonProps {
  whileHover?: MotionProps['whileHover'];
  whileTap?: MotionProps['whileTap'];
  transition?: MotionProps['transition'];
}

function AnimatedButton({ 
  children, 
  whileHover = { scale: 1.05 }, 
  whileTap = { scale: 0.95 },
  transition = { type: "spring", stiffness: 400, damping: 10 },
  ...buttonProps 
}: AnimatedButtonProps) {
  return (
    <motion.div 
      whileHover={whileHover} 
      whileTap={whileTap}
      transition={transition}
    >
      <Button {...buttonProps}>{children}</Button>
    </motion.div>
  );
}
```

### 8. タッチジェスチャーの分割

**問題**: `useTouchGestures`が過度に複雑（144行）

**改善案**:
```typescript
// ジェスチャー検出のみ
function useTouchDetection() {
  // スワイプ検出、タップ検出、ダブルタップ検出
}

// ゲームアクション実行のみ  
function useTouchActions() {
  // 移動、回転、ドロップアクション
}

// 統合インターフェース
function useTouchGestures() {
  const detection = useTouchDetection();
  const actions = useTouchActions();
  return { ...detection, ...actions };
}
```

## 🟢 低優先度の改善提案

### 9. 型安全性の向上

**改善案**:
```typescript
// より厳密な型定義
type RotationState = 0 | 90 | 180 | 270;
type WallKickKey = `${RotationState}->${RotationState}`;

// 型安全な回転キー生成
function createRotationKey(from: RotationState, to: RotationState): WallKickKey {
  return `${from}->${to}`;
}
```

### 10. Ghost Piece設定の統一

**問題**: gameStateとsettingsStoreで重複管理

**改善案**: settingsStoreのみで管理、gameStateから削除

### 11. localStorage重複の解消

**問題**: `localStorage.ts`とストアのpersist機能で重複

**改善案**: 古い`localStorage.ts`の削除、ストアのpersist機能に統一

## 実装計画

### フェーズ1: 高優先度（推定工数: 2-3日）
1. TetrominoGrid共通コンポーネント作成
2. HighScore コンポーネント分割
3. セレクター最適化

### フェーズ2: 中優先度（推定工数: 3-4日）
1. ゲームロジック関数分割
2. 共通アクションハンドラー作成
3. 定数の中央集約

### フェーズ3: 低優先度（推定工数: 1-2日）
1. 型安全性向上
2. 設定統一
3. 重複削除

## 効果測定指標

- **コード行数**: 約20%削減見込み
- **重複度**: 80%削減見込み
- **複雑度Cyclomatic**: 30%削減見込み
- **テスト保守性**: 向上
- **新機能開発速度**: 向上

## まとめ

これらの改善により、以下の効果が期待できます：

1. **保守性向上**: 重複コードの削除により変更影響範囲が明確化
2. **可読性向上**: 責任の分離により各コンポーネントの目的が明確化
3. **テスト性向上**: 単一責任により単体テストが容易化
4. **パフォーマンス向上**: 不要な再計算の削除
5. **開発効率向上**: 共通コンポーネントによる再利用性向上

段階的な実装により、既存機能を損なうことなく、より保守しやすいコードベースを構築できます。