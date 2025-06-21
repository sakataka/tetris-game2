# ゲーム内容

Web上で実行できるテトリスを作成する。

- 美しいUI
- 1画面に収まる
- 言語選択（日本語、英語）

# プロジェクト概要

このプロジェクトは、モダンなWebテクノロジーを使用したテトリスゲームです。React 19とTypeScriptで構築され、美しいUI、多言語対応（日本語・英語）、レスポンシブデザインを特徴としています。

## 主な機能

- 完全なテトリスゲーム体験（移動、回転、ライン消去、スコアリング）
- リアルタイムゲームループ
- キーボード操作（矢印キー、スペース、P）
- 次のピース表示
- レベルアップシステム
- ゲーム一時停止・再開機能
- 言語切り替え（日本語/英語）

## アーキテクチャパターン

### 状態管理

- **Zustand**: 軽量でシンプルな状態管理ライブラリを使用
- 単一のゲームストア（gameStore.ts）でゲーム状態を集中管理
- イミュータブルな状態更新パターン

### コンポーネント設計

- **関数型コンポーネント**: React Hooksを活用したモダンなコンポーネント設計
- **コンポーネント分離**: UI要素を独立したコンポーネントに分割
  - Game.tsx: メインゲームコンテナ
  - Board.tsx: ゲームボード表示
  - ScoreBoard.tsx: スコア・レベル表示
  - Controls.tsx: 操作説明
  - NextPiece.tsx: 次のピース表示
  - GameOverlay.tsx: ゲームオーバー・一時停止画面

### ゲームロジック

- **純粋関数**: サイドエフェクトのないゲームロジック
- **テスト駆動開発**: ゲームロジックに包括的なテスト
- **分離された関心事**: ゲームロジック（game/）とUI（components/）の分離

### カスタムHooks

- **useGameLoop**: ゲームの自動進行を管理
- **useKeyboardControls**: react-hotkeys-hookを使用したキーボード入力の宣言的な処理

## アニメーションシステム

- **Framer Motion**: 全アニメーション効果のライブラリ
- **ピース落下**: 新しいピースの出現時のスムーズな落下アニメーション
- **ピース回転**: 回転時の360度回転エフェクトとキーベースのアニメーション
- **ピース配置**: 配置時のスケールアニメーション（縮小→拡大）
- **ライン消去**: フラッシュエフェクト（点滅・スケール変化・グロー効果）
- **スコア更新**: スコア、ライン数、レベルの更新時のスプリングアニメーション
- **UI遷移**: ゲームオーバー・一時停止画面のフェードイン/アウト、モーダルのスプリング効果

## メインエントリーポイント

メインエントリーポイントは以下の通りです：

- **index.html**: HTMLエントリーポイント
- **src/main.tsx**: Reactアプリケーションの起点
- **src/App.tsx**: アプリケーションのルートコンポーネント
- **src/components/Game.tsx**: ゲームのメインコンポーネント

## フォルダ構造

```
src/
├── components/          # UIコンポーネント
├── game/               # ゲームロジック（純粋関数）
├── hooks/              # カスタムHooks
├── i18n/               # 国際化設定
├── locales/            # 言語ファイル
├── store/              # 状態管理（Zustand）
├── test/               # テスト設定
├── types/              # TypeScript型定義
└── utils/              # ユーティリティ関数
```

## データモデル

### 主要な型定義（types/game.ts）

- **GameState**: ゲーム全体の状態（ボード、現在のピース、スコアなど）
- **Tetromino**: テトリスピースの定義（型、位置、回転、形状）
- **Position**: X、Y座標
- **TetrominoType**: 7種類のテトリスピース（I、O、T、S、Z、J、L）

### ゲーム状態

- board: 20×10のゲームボード
- currentPiece: 現在落下中のピース
- nextPiece: 次に出現するピース
- score/lines/level: ゲーム進行状況
- isGameOver/isPaused: ゲーム状態フラグ

## エラーハンドリング

- **TypeScript**: 型安全性による実行時エラーの予防
- **条件チェック**: ゲーム状態の検証（ゲームオーバー、一時停止時の操作無効化）
- **バリデーション**: ピース配置の有効性チェック
- **Graceful Degradation**: 不正な状態でもアプリケーションクラッシュを回避

## 認証

このゲームはクライアントサイドのみで動作するため、認証機能は実装されていません。将来的にハイスコア保存などの機能を追加する際に検討される可能性があります。

## データベース

現在、データベースは使用されていません。ゲーム状態はメモリ内のみで管理され、ページリロード時にリセットされます。

# 開発方針

- **シンプル**: できるだけモダンな機能を利用し、シンプルでメンテナンスしやすく
- **テストファースト**: テスト駆動開発
- **技術選択**: 下記以外(利用フレームワーク・ツール)のフレームワーク・ツールが必要になった場合は、確認すること‼️
- **TODO 駆動開発**: 大がかりな対応をする際は、ドキュメントを作成する。ドキュメントにはフェーズとフェーズ配下のタスクに分けて記載する。フェーズを順番に実行する。1つのフェーズが完了したらドキュメントを更新し、完了したフェーズ・タスクをチェックを入れる。
- **UIリテラルはソースに埋め込まない**: 日本語、英語のリソースファイル対応

# 利用フレームワーク・ツール

## フロントエンドフレームワーク

- React: 19.1.0
- @types/react: 19.1.8
- @types/react-dom: 19.1.6

## ビルドツール・開発環境

- Vite: 6.3.5
- TypeScript: 5.8.3 (ES2024ターゲット)
- Node.js: 24.2
- pnpm: 10.12.1

## スタイリング・UI

- Tailwind CSS: 4.1.10
- shadcn/ui: 2.7.0
- Framer Motion: 12.18.1 (アニメーション)

## 状態管理・データ処理

- Zustand: 5.0.5 (状態管理)

## スキーマ宣言・データ検証

- Zod: 4 (将来のハイスコア保存機能・設定データ永続化での使用予定)

## キーボード入力ハンドリング

- react-hotkeys-hook: 5.1.0 (宣言的なキーボード入力管理)

## 国際化

- i18next: 25.2.1

## コード品質・リンティング

- Biome: 2.0.2 (リンティング・フォーマッティング)
- Lefthook: 1.11.14 (Gitフック管理)

## テスト

- Vitest: 3.2.4 (テストフレームワーク)

## 最適化・バンドル

- knip: 5.61.2 (デッドコード検出)

## ソース管理

- git: 2.50
- gh: 2.74.2

## デプロイメント

- Vercel

## CI/CDワークフロー

- GitHub Actions

# 現在のソースコード実装詳細

## 詳細なアーキテクチャ分析

### 1. エントリーポイント構成

**`src/main.tsx`**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n/config'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```
- React 19 StrictModeでアプリケーション初期化
- i18n設定の自動読み込み
- グローバルCSS適用

**`src/App.tsx`**
```typescript
import Game from './components/Game'

function App() {
  return <Game />
}

export default App
```
- 最小限の構成でGameコンポーネントをレンダリング

### 2. 型システム (`src/types/game.ts`)

```typescript
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export interface Position {
  x: number
  y: number
}

export interface Tetromino {
  type: TetrominoType
  position: Position
  rotation: number
  shape: number[][]
}

export interface GameState {
  board: number[][]
  currentPiece: Tetromino | null
  nextPiece: Tetromino
  score: number
  lines: number
  level: number
  isGameOver: boolean
  isPaused: boolean
  placedPositions: Position[]
  clearingLines: number[]
  rotationKey: string
}
```

### 3. 状態管理 (`src/store/gameStore.ts`)

```typescript
import { create } from 'zustand'
import { GameState } from '../types/game'
// ゲーム操作関数をインポート

interface GameStore extends GameState {
  moveLeft: () => void
  moveRight: () => void
  moveDown: () => void
  rotate: () => void
  drop: () => void
  togglePause: () => void
  resetGame: () => void
  clearAnimationStates: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 初期状態
  ...createInitialGameState(),
  
  // ゲーム操作メソッド
  moveLeft: () => set(state => ({ ...movePieceLeft(state) })),
  moveRight: () => set(state => ({ ...movePieceRight(state) })),
  moveDown: () => set(state => ({ ...movePieceDown(state) })),
  rotate: () => set(state => ({ ...rotatePiece(state) })),
  drop: () => set(state => ({ ...dropPiece(state) })),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),
  resetGame: () => set(() => createInitialGameState()),
  clearAnimationStates: () => set({ placedPositions: [], clearingLines: [] })
}))
```

### 4. ゲームロジック実装

**`src/game/game.ts`** - メインゲームロジック
```typescript
export function createInitialGameState(): GameState {
  const nextPiece = createRandomTetromino()
  return {
    board: createEmptyBoard(),
    currentPiece: createRandomTetromino(),
    nextPiece,
    score: 0,
    lines: 0,
    level: 1,
    isGameOver: false,
    isPaused: false,
    placedPositions: [],
    clearingLines: [],
    rotationKey: crypto.randomUUID()
  }
}

export function movePieceLeft(state: GameState): GameState
export function movePieceRight(state: GameState): GameState
export function movePieceDown(state: GameState): GameState
export function rotatePiece(state: GameState): GameState
export function dropPiece(state: GameState): GameState
// ... その他のゲーム関数
```

**`src/game/tetrominos.ts`** - テトリスピース定義
```typescript
export const TETROMINOS: Record<TetrominoType, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  // ... 他のピース形状
}

export function getTetrominoShape(type: TetrominoType): number[][] {
  return TETROMINOS[type].map(row => [...row])
}

export function rotateTetromino(shape: number[][]): number[][] {
  // 90度時計回り回転アルゴリズム
}
```

**`src/game/board.ts`** - ボード操作
```typescript
export function createEmptyBoard(): number[][] {
  return Array(20).fill(null).map(() => Array(10).fill(0))
}

export function isValidPosition(board: number[][], piece: Tetromino): boolean
export function placeTetromino(board: number[][], piece: Tetromino): number[][]
export function clearLines(board: number[][]): { newBoard: number[][]; clearedLines: number[] }
```

### 5. カスタムHooks

**`src/hooks/useGameLoop.ts`**
```typescript
export function useGameLoop() {
  const gameState = useGameStore()
  
  useEffect(() => {
    let animationId: number
    
    const gameLoop = () => {
      if (!gameState.isPaused && !gameState.isGameOver) {
        gameState.moveDown()
      }
      
      setTimeout(() => {
        animationId = requestAnimationFrame(gameLoop)
      }, getGameSpeed(gameState.level))
    }
    
    animationId = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animationId)
  }, [gameState])
}
```

**`src/hooks/useKeyboardControls.ts`**
```typescript
export function useKeyboardControls() {
  const gameState = useGameStore()
  
  useHotkeys('ArrowLeft', gameState.moveLeft)
  useHotkeys('ArrowRight', gameState.moveRight)
  useHotkeys('ArrowDown', gameState.moveDown)
  useHotkeys('ArrowUp', gameState.rotate)
  useHotkeys('space', gameState.drop)
  useHotkeys('p', gameState.togglePause, { 
    enableOnFormTags: true,
    preventDefault: true 
  }, [gameState.togglePause])
  // Enter キーでゲームリセット（ゲームオーバー時のみ）
}
```

### 6. UIコンポーネント詳細

**`src/components/Game.tsx`** - メインゲームコンテナ
```typescript
export default function Game() {
  useGameLoop()
  useKeyboardControls()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="mx-auto max-w-6xl">
        {/* デスクトップレイアウト（グリッド） */}
        <div className="hidden md:grid md:grid-cols-4 md:gap-8">
          <LanguageSelector />
          <ScoreBoard />
          <div className="col-span-2 row-span-2 flex justify-center">
            <Board />
          </div>
          <NextPiece />
          <Controls />
        </div>
        
        {/* モバイルレイアウト（縦スタック） */}
        <div className="md:hidden space-y-6">
          {/* モバイル用レイアウト */}
        </div>
      </div>
      <GameOverlay />
    </div>
  )
}
```

**`src/components/Board.tsx`** - ゲームボード
```typescript
export default React.memo(function Board() {
  const { board, currentPiece, placedPositions, clearingLines, rotationKey } = useGameStore()

  return (
    <div className="inline-block bg-slate-900 p-2 rounded-lg shadow-2xl border border-slate-700">
      <div className="grid grid-cols-10 gap-0.5">
        {board.map((row, y) =>
          row.map((cell, x) => {
            const isCurrentPiece = /* ピース位置チェック */
            const isPlacedPosition = /* 配置アニメーション位置チェック */
            const isClearingLine = /* ライン消去アニメーション */
            
            return (
              <motion.div
                key={`${x}-${y}`}
                className={`w-[30px] h-[30px] border border-slate-600 ${getCellColor(cell, isCurrentPiece, currentPiece?.type)}`}
                animate={/* アニメーション設定 */}
                // Framer Motionアニメーション設定
              />
            )
          })
        )}
      </div>
    </div>
  )
})
```

### 7. アニメーションシステム

**ピース落下アニメーション**
```typescript
// 新しいピース出現時
animate={{
  y: ['-100%', '0%'],
  transition: { type: 'spring', damping: 15, stiffness: 300 }
}}
```

**ピース回転アニメーション**
```typescript
// 回転時の360度エフェクト
animate={{
  rotate: [0, 360, 0],
  transition: { duration: 0.3, ease: 'easeInOut' }
}}
```

**ライン消去アニメーション**
```typescript
// フラッシュ・パルス・グロー効果
animate={{
  scale: [1, 1.1, 1],
  backgroundColor: ['#ffffff', '#fbbf24', '#ffffff'],
  boxShadow: ['0 0 0px #fbbf24', '0 0 20px #fbbf24', '0 0 0px #fbbf24'],
  transition: { duration: 0.5, repeat: 2 }
}}
```

### 8. 国際化システム

**`src/i18n/config.ts`**
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ja from '../locales/ja.json'
import en from '../locales/en.json'

i18n.use(initReactI18next).init({
  resources: { ja: { translation: ja }, en: { translation: en } },
  lng: 'ja',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})
```

**言語リソース例 (`src/locales/ja.json`)**
```json
{
  "score": "スコア",
  "lines": "ライン",
  "level": "レベル",
  "next": "次",
  "gameOver": "ゲームオーバー",
  "paused": "一時停止",
  "newGame": "新しいゲーム",
  "resume": "再開",
  "controls": {
    "move": "移動",
    "rotate": "回転",
    "softDrop": "ソフトドロップ",
    "hardDrop": "ハードドロップ",
    "pause": "一時停止"
  }
}
```

### 9. スタイリングシステム

**`src/index.css`** - Tailwind CSS 4.1新記法
```css
@import "tailwindcss";

@theme {
  /* カスタムTetris色定義 */
  --color-tetris-i: #00f5ff;
  --color-tetris-o: #ffff00;
  --color-tetris-t: #800080;
  --color-tetris-s: #00ff00;
  --color-tetris-z: #ff0000;
  --color-tetris-j: #0000ff;
  --color-tetris-l: #ffa500;
}

@source inline() {
  /* 事前生成するクラス */
  .bg-tetris-i { background-color: theme(colors.tetris.i); }
  .bg-tetris-o { background-color: theme(colors.tetris.o); }
  /* ... 他のテトリス色クラス */
}

/* shadcn/ui CSS変数 */
:root {
  --background: 210 40% 98%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

/* 全画面固定 */
html, body { height: 100%; overflow: hidden; }
```

## テスト実装

現在、以下のテストファイルが実装されています：

- `src/game/board.test.ts` - ボードロジックのテスト
- `src/game/game.test.ts` - ゲームロジックのテスト  
- `src/game/tetrominos.test.ts` - テトリスピースのテスト

すべてVitest + TypeScriptで実装され、TDD approach を採用しています。

## パフォーマンス最適化

1. **React.memo**: Board コンポーネントで不要な再レンダリングを防止
2. **アニメーション状態管理**: 定期的なアニメーション状態クリア
3. **requestAnimationFrame**: スムーズなゲームループ
4. **immutable更新**: Zustand での状態管理
5. **遅延読み込み**: 必要な時のみリソース読み込み

## セキュリティ考慮事項

1. **XSS対策**: React の自動エスケープ
2. **CSP対応**: インラインスタイル/スクリプトの回避
3. **型安全性**: TypeScript による実行時エラー防止
4. **依存関係管理**: 定期的なパッケージ更新

この実装は、現代的なWeb開発のベストプラクティスを採用し、保守性、パフォーマンス、ユーザビリティを重視した設計となっています。

