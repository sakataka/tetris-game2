# Tetris Game

ブラウザで遊べるモダンなテトリスゲーム。

## 特徴

- 完全なテトリス体験（7種類のピース、ライン消去、スコア、レベルアップ）
- 美しいアニメーション
- 日本語・英語対応
- デスクトップ・モバイル対応
- ハイスコア記録

## 技術スタック

- React 19 + TypeScript
- Bun (パッケージ管理・テスト)
- Rolldown-Vite (ビルド)
- Tailwind CSS + Framer Motion
- Zustand (状態管理)

## セットアップ

前提条件: [Bun](https://bun.sh/docs/installation)

```bash
git clone https://github.com/sakataka/tetris-game2.git
cd tetris-game2
bun install
bun run dev
```

http://localhost:5173 でゲーム開始

## 操作方法

| キー | 動作 |
|------|------|
| ← → | ピース移動 |
| ↓ | ソフトドロップ |
| ↑ | 回転 |
| Space | ハードドロップ |
| P | 一時停止/再開 |
| Enter | ゲームリセット |

## 開発コマンド

```bash
# 開発
bun run dev                    # 開発サーバー
bun run build                  # ビルド
bun run preview                # プレビュー

# テスト・品質
bun test                       # テスト実行
bun run lint                   # リント
bun run format                 # フォーマット
bun run typecheck              # 型チェック
```

## ライセンス

ISC License