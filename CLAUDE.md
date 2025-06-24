# Tetris Game Project

モダンなWeb技術で構築された完全なテトリスゲーム

## ゲーム概要

- **完全なテトリス体験**: 7種類のピース、ライン消去、レベルアップシステム
- **美しいアニメーション**: Framer Motionによるスムーズなエフェクト
- **モバイル対応**: タッチ操作・レスポンシブデザイン
- **ハイスコア記録**: ローカルストレージでのスコア保存
- **多言語対応**: 日本語・英語の動的切り替え
- **ゴーストピース**: 落下予測位置の表示

## 実装機能

### コアゲーム機能
- 7種類のテトリスピース（I, O, T, S, Z, J, L）
- ピース移動・回転・ハードドロップ
- ライン消去とスコアリング
- レベルアップによる速度上昇
- ゲーム一時停止・再開・リセット
- ゴーストピース（落下予測位置）表示

### ユーザーインターフェース
- リアルタイムスコア・ライン・レベル表示
- 次のピース表示
- ハイスコア一覧表示
- 操作説明
- ゲームオーバー・一時停止画面
- 言語切り替えセレクター

### モバイル対応
- タッチ操作（スワイプ・タップ）
- レスポンシブレイアウト
- デスクトップ・モバイル両対応

### アニメーション
- ピース落下・配置・回転アニメーション
- ライン消去フラッシュエフェクト
- スコア更新スプリングアニメーション
- UI遷移エフェクト

## 技術スタック

### フロントエンド
- **React**: 19.1.0（関数型コンポーネント・Hooks）
- **TypeScript**: 5.8.3（ES2024、厳密な型定義）
- **Zustand**: 5.0.5（軽量状態管理）

### ビルド・開発環境
- **Bun**: 1.2.17（パッケージ管理・テスト実行）
- **Rolldown-Vite**: 7.0.0（Rust製高性能バンドラー）

### スタイリング・UI
- **Tailwind CSS**: 4.1.10（@tailwindcss/viteプラグイン使用）
- **Framer Motion**: 12.19.1（アニメーション）
- **shadcn/ui**: Radix UIベースコンポーネント（Dialog, Select, Button等）
- **class-variance-authority**: 0.7.1（コンポーネントバリアント管理）
- **clsx + tailwind-merge**: 2.1.1/3.3.1（スタイルユーティリティ）
- **lucide-react**: 0.523.0（アイコン）

### 機能ライブラリ
- **react-hotkeys-hook**: 5.1.0（キーボード入力管理）
- **i18next + react-i18next**: 25.2.1/15.5.3（国際化）

### 開発・品質管理
- **Biome**: 2.0.5（リンティング・フォーマッティング）
- **Bun Test**: 1.2.17（テストランナー）
- **happy-dom**: 18.0.1（DOM環境シミュレーション）
- **Testing Library**: React 16.3.0（コンポーネントテスト）
- **Lefthook**: 1.11.14（Gitフック管理）
- **knip**: 5.61.2（デッドコード検出）
- **@vitejs/plugin-react-oxc**: 0.2.3（高速Reactプラグイン）

## アーキテクチャ設計

### 状態管理（Zustand）
```typescript
interface GameStore extends GameState {
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  togglePause: () => void;
  resetGame: () => void;
  clearAnimationStates: () => void;
  saveHighScoreIfNeeded: () => void;
}
```

### ゲーム状態型定義
```typescript
interface GameState {
  board: BoardMatrix;            // 20×10ゲームボード
  currentPiece: Tetromino | null; // 現在のピース
  nextPiece: TetrominoTypeName;   // 次のピース
  score: number;
  lines: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  placedPositions: Position[];    // アニメーション用
  clearingLines: number[];        // ライン消去アニメーション用
  animationTriggerKey: number;    // アニメーション同期用
  ghostPosition: Position | null;  // ゴーストピース位置
}
```

### テトリスピース型定義（判別可能ユニオン型）
```typescript
type TetrominoType =
  | { type: "I"; colorIndex: 1 }
  | { type: "O"; colorIndex: 2 }
  | { type: "T"; colorIndex: 3 }
  | { type: "S"; colorIndex: 4 }
  | { type: "Z"; colorIndex: 5 }
  | { type: "J"; colorIndex: 6 }
  | { type: "L"; colorIndex: 7 };
```

### フォルダ構造
```
src/
├── components/
│   ├── game/              # ゲーム関連コンポーネント
│   │   ├── AnimatedScoreItem.tsx
│   │   ├── Board.tsx
│   │   ├── BoardCell.tsx
│   │   ├── Controls.tsx
│   │   ├── GameOverlay.tsx
│   │   ├── HighScore.tsx
│   │   ├── NextPiece.tsx
│   │   ├── ScoreBoard.tsx
│   │   ├── TouchControls.tsx
│   │   └── index.ts       # エクスポート管理
│   ├── layout/            # レイアウトコンポーネント
│   │   ├── Game.tsx
│   │   └── LanguageSelector.tsx
│   └── ui/                # shadcn/ui汎用コンポーネント
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── select.tsx
├── game/                  # ゲームロジック（純粋関数）
│   ├── board.ts
│   ├── game.ts
│   ├── tetrominos.ts
│   └── ghost.test.ts      # ゴーストピース専用テスト
├── hooks/                 # カスタムHooks
│   ├── useAnimatedValue.ts
│   ├── useAnimationCompletionHandler.ts
│   ├── useCellAnimation.ts
│   ├── useGameLoop.ts
│   ├── useGameSelectors.ts
│   ├── useHighScore.ts
│   ├── useKeyboardControls.ts
│   └── useTouchGestures.ts
├── lib/                   # ユーティリティライブラリ
│   └── utils.ts           # shadcn/ui汎用ユーティリティ
├── store/                 # Zustand状態管理
│   └── gameStore.ts
├── test/                  # テスト設定・モック
│   ├── __mocks__/
│   │   └── react-i18next.ts
│   └── setup.ts           # テスト環境設定
├── types/                 # TypeScript型定義
│   └── game.ts
├── utils/                 # ゲーム専用ユーティリティ
│   ├── colors.ts
│   ├── constants.ts
│   ├── localStorage.ts
│   └── styles.ts
├── locales/               # 国際化リソース
│   ├── en.json
│   └── ja.json
├── i18n/                  # 国際化設定
│   └── config.ts
├── index.css              # グローバルスタイル
└── main.tsx               # アプリケーションエントリーポイント
```

## カスタムHooks設計

### ゲーム制御系
- **useGameLoop**: requestAnimationFrameベースのゲームループ管理
- **useKeyboardControls**: react-hotkeys-hookによる宣言的キー入力処理
- **useTouchGestures**: モバイル向けタッチ操作（スワイプ・タップ）
- **useGameSelectors**: ゲーム状態の効率的な選択とメモ化

### アニメーション系
- **useAnimatedValue**: アニメーション値管理とスプリング制御
- **useAnimationCompletionHandler**: アニメーション完了時の状態管理
- **useCellAnimation**: 個別セルのアニメーション状態管理

### データ管理系
- **useHighScore**: ハイスコアのローカルストレージ管理

## ゲームロジック（純粋関数）

### game/game.ts
- `createInitialGameState()`: 初期ゲーム状態生成
- `moveTetrominoBy()`: ピース移動処理
- `rotateTetrominoCW()`: 時計回り回転処理
- `hardDropTetromino()`: ハードドロップ処理
- `calculateGhostPosition()`: ゴーストピース位置計算

### game/board.ts
- `createEmptyBoard()`: 空ボード生成
- `isValidPosition()`: ピース配置可能性検証
- `placeTetromino()`: ピースボード配置
- `clearLines()`: 完成ライン検出・消去

### game/tetrominos.ts
- `getTetrominoShape()`: ピース形状データ取得
- `rotateTetromino()`: 90度回転アルゴリズム
- `getRandomTetromino()`: ランダムピース生成

## データ永続化

### ローカルストレージ管理（utils/localStorage.ts）
```typescript
interface HighScore {
  score: number;
  lines: number;
  level: number;
  date: string;
}
```

- ハイスコア一覧の保存・取得
- 型安全なJSON操作
- エラーハンドリング

## アニメーションシステム

### Framer Motion統合
- **ピース落下**: 新ピース出現時のスプリングアニメーション
- **ピース回転**: 360度回転エフェクト
- **ピース配置**: スケールアニメーション（縮小→拡大）
- **ライン消去**: フラッシュ・パルス・グロー効果
- **スコア更新**: 数値変更時のスプリングアニメーション
- **UI遷移**: モーダル・オーバーレイのフェード効果

## 国際化対応

### i18next設定
- デフォルト言語: 日本語
- フォールバック言語: 英語
- 実行時言語切り替え
- 構造化リソースファイル（ゲーム用語、操作説明、UI文言）

## モバイル対応

### タッチ操作（useTouchGestures）
- **水平スワイプ**: 左右移動
- **短縦スワイプ**: ソフトドロップ
- **長縦スワイプ**: ハードドロップ
- **タップ**: 回転

### レスポンシブデザイン
- CSS Gridベースレイアウト
- デスクトップ: グリッドレイアウト
- モバイル: 縦スタックレイアウト
- 30×30px固定サイズセル

## テスト戦略

### Bun Test + TypeScript
- **ゲームロジック**: 純粋関数の包括的テスト
- **Hooks**: カスタムHooksの動作テスト
- **コンポーネント**: React Testing Libraryによるレンダリングテスト
- **CI/CD**: Vercel・GitHub Actions対応

## 開発方針

### コード品質
- **TypeScript厳格モード**: ES2024ターゲット
- **関数型プログラミング**: 純粋関数・Immutable更新
- **テスト駆動開発**: 新機能は必ずテスト実装
- **型安全性**: 判別可能ユニオン型・型ガード活用

### パフォーマンス最適化
- **React Compiler**: 自動最適化（React.memo不使用）
- **useTransition**: UI応答性維持
- **Zustand**: 軽量状態管理
- **Rolldown-Vite**: Rust製高速バンドラー

### 命名規則
- **コンポーネント**: PascalCase（Board.tsx, Game.tsx）
- **カスタムHook**: camelCase（useGameLoop.ts）
- **ユーティリティ**: camelCase（gameStore.ts, colors.ts）
- **テストファイル**: `*.test.ts`（同一ディレクトリ配置）

## 開発コマンド

```bash
# 開発・ビルド
bun run dev                    # 開発サーバー起動
bun run build                  # プロダクションビルド
bun run preview                # ビルド結果プレビュー

# テスト・品質管理
bun test                       # 全テスト実行
bun test --watch               # ウォッチモード
bun test src/game/             # 特定ディレクトリのテスト
bun run test:fast              # 高速テスト（game, hooks, utils）
bun run test:components        # コンポーネントテスト
bun run lint                   # Biome lint実行
bun run format                 # Biome format実行
bun run typecheck              # TypeScript型チェック
bun run knip                   # デッドコード検出
bun run check                  # 型チェック + デッドコード検出
bun run ci                     # CI用統合チェック

# パッケージ管理
bun install                    # 依存関係インストール
bun add <package>              # パッケージ追加
bun remove <package>           # パッケージ削除
```

## 禁止事項

- **条件緩和**: テストエラー・型エラー解消のための条件緩和
- **テストスキップ**: 不適切なモック化による回避
- **ハードコード**: 出力・レスポンスのハードコード
- **エラー隠蔽**: エラーメッセージの無視・隠蔽
- **一時的修正**: 問題の先送り

## 技術選択原則

- **新ライブラリ導入**: 事前確認必須
- **Bun優先**: パッケージ管理・テスト実行・スクリプト実行
- **Tailwind設定**: @tailwindcss/viteプラグイン使用（PostCSS非経由）
- **UIリテラル**: ソースコード埋め込み禁止（国際化リソース使用）