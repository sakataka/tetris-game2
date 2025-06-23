# 🎮 Tetris Game

モダンなWebテクノロジーで構築された美しいテトリスゲーム。React 19、TypeScript、Rolldown-Vite、Bun v1.2.17を使用し、高速な開発体験と滑らかなゲームプレイを実現。

## ✨ 特徴

- 🎯 **完全なテトリス体験**: 7種類のピース、ライン消去、レベルアップシステム
- 🎨 **美しいUI**: Tailwind CSS 4.1とFramer Motionによる滑らかなアニメーション
- 🌐 **多言語対応**: 日本語・英語の言語切り替え対応
- 📱 **レスポンシブ**: デスクトップ・モバイル両対応のレイアウト
- ⚡ **高速開発**: Bun v1.2.17による爆速パッケージ管理・テスト実行

## 🚀 パフォーマンス

最新技術スタック移行により大幅な性能向上を実現：

| 項目 | 従来 | 現在 | 向上率 |
|------|-----|------|--------|
| ビルド時間 | 1.07s | 178ms | **82%高速化** |
| 開発サーバー起動 | 731ms | 142ms | **81%高速化** |
| テスト実行時間 | 909ms | 115ms | **87%高速化** |
| TypeScript型チェック | 661ms | 455ms | **31%高速化** |

## 🛠 技術スタック

### コア技術
- **Runtime**: Bun 1.2.17 (Package Manager + Test Runner)
- **Frontend**: React 19.1.0 + TypeScript 5.8.3
- **Bundler**: Rolldown-Vite 6.3.21 (Rust製高性能バンドラー)
- **Styling**: Tailwind CSS 4.1.10 + shadcn/ui
- **Animation**: Framer Motion 12.18.1

### 開発ツール
- **Test**: Bun test + happy-dom + Testing Library
- **Lint/Format**: Biome 2.0.4
- **Git Hooks**: Lefthook 1.11.14
- **State Management**: Zustand 5.0.5
- **Internationalization**: i18next 25.2.1

## 📦 インストール・起動

### 前提条件
- **Bun**: v1.2.17以上 ([インストール手順](https://bun.sh/docs/installation))
- **Node.js**: v24.2以上

### セットアップ

```bash
# リポジトリクローン
git clone https://github.com/sakataka/tetris-game2.git
cd tetris-game2

# 依存関係インストール（爆速）
bun install

# 開発サーバー起動
bun run dev
```

http://localhost:5173 でゲームを開始！

## 🎮 操作方法

| キー | 動作 |
|------|------|
| ← → | ピース移動 |
| ↓ | ソフトドロップ |
| ↑ | 回転 |
| Space | ハードドロップ |
| P | 一時停止/再開 |
| Enter | ゲームリセット |

## 🧪 開発コマンド

```bash
# 開発・ビルド
bun run dev                    # 開発サーバー起動
bun run build                  # プロダクションビルド
bun run preview                # ビルド結果プレビュー

# テスト・品質管理
bun test                       # 全テスト実行（26/26テスト）
bun test --watch               # ウォッチモード
bun test src/game/             # 特定ディレクトリのテスト
bun run lint                   # Biome lint実行
bun run format                 # Biome format実行
bun run typecheck              # TypeScript型チェック（incremental対応）
bun run knip                   # デッドコード検出

# 統合品質チェック
/make                          # 全品質チェック + ビルド（パイプライン実行）

# パッケージ管理
bun add <package>              # パッケージ追加
bun remove <package>           # パッケージ削除
bun info <package>             # パッケージ情報表示
```

## 📁 プロジェクト構造

```
src/
├── components/          # UIコンポーネント
│   ├── game/           # ゲーム関連UI（Board、Controls等）
│   ├── layout/         # レイアウトコンポーネント
│   └── ui/             # 汎用UIコンポーネント（shadcn/ui）
├── game/               # ゲームロジック（純粋関数）
├── hooks/              # カスタムHooks
├── store/              # 状態管理（Zustand）
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
├── locales/            # 言語ファイル（ja.json、en.json）
└── test/               # テスト設定
```

## 🧬 アーキテクチャ

### 設計原則
- **関数型プログラミング**: 純粋関数によるゲームロジック
- **型安全性**: TypeScript厳格モードでの開発
- **テスト駆動開発**: Bun testによる高速テスト実行
- **コンポーネント分離**: 責務の明確な分離設計

### 状態管理
- **Zustand**: 軽量で直感的な状態管理
- **Immutable更新**: 状態の不変性を保証
- **カスタムHooks**: ゲームループ、キーボード制御等

### アニメーション
- **Framer Motion**: 滑らかなピース落下・回転・消去アニメーション
- **CSS Grid**: レスポンシブなボードレイアウト
- **Spring動画**: 自然な動きを実現

## 🚢 デプロイ

### Vercel (推奨)
```bash
# 初回デプロイ
bunx vercel

# 以降のデプロイ
git push origin main  # 自動デプロイ
```

### その他プラットフォーム
- **Netlify**: `bun run build` + `dist/`フォルダ
- **GitHub Pages**: Actions workflow有効化
- **Docker**: Bunイメージ使用可能

## 📚 ドキュメント

- [`CLAUDE.md`](CLAUDE.md): プロジェクト仕様書（開発方針・アーキテクチャ）
- [`.claude/commands/make.md`](.claude/commands/make.md): 統合ビルドパイプライン仕様

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 開発ガイドライン
- **コミットメッセージ**: Conventional Commits形式
- **コード品質**: Biome lintルール準拠
- **テスト**: 新機能には必ずテスト追加
- **ドキュメント**: 重要な変更は`CLAUDE.md`更新

## 📄 ライセンス

[ISC License](LICENSE) - 自由にご利用ください

## 🙏 謝辞

- [Bun](https://bun.sh/) - 革新的なJavaScriptランタイム
- [React](https://react.dev/) - UIライブラリ
- [Tailwind CSS](https://tailwindcss.com/) - ユーティリティCSSフレームワーク
- [Framer Motion](https://www.framer.com/motion/) - アニメーションライブラリ
- [shadcn/ui](https://ui.shadcn.com/) - 美しいUIコンポーネント

---

🎮 楽しいテトリス体験をお楽しみください！