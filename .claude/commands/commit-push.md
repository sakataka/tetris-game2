---
allowed-tools: Bash
description: Complete development workflow - validate, commit, and push changes
---

# Development Workflow: Commit & Push

このコマンドは以下の開発ワークフローを自動実行します：

1. **品質チェック** - lint、typecheck、テスト実行
2. **Git状態確認** - 変更内容の表示
3. **コミット作成** - 適切なコミットメッセージ付き
4. **GitHubプッシュ** - リモートリポジトリへの反映

## 実行フロー

### ステップ1: 品質保証チェック
プロジェクトの品質基準をクリアしているか確認します：

```bash
# typecheckとtestのみ実行（format/lintはlefthookが自動実行）
bun run typecheck && bun test
```

### ステップ2: Git状態の確認
現在の変更内容を表示して、コミット対象を明確にします：

```bash
git status
git diff --stat
```

### ステップ3: 変更内容の詳細分析
変更された各ファイルの内容を確認し、適切なコミットメッセージを生成します：

```bash
git diff
```

### ステップ4: コミット作成とプッシュ
品質チェックが完了したら、以下の手順でコミット・プッシュを実行してください：

1. **適切なコミットメッセージの作成**:
   - 変更の種類（feat, fix, refactor, docs, etc.）
   - 変更内容の簡潔な説明
   - 必要に応じて詳細説明

2. **コミット・プッシュの実行**:
   ```bash
   git add -A
   git commit -m "作成されたコミットメッセージ"
   git push
   ```

## 注意事項

- 品質チェックが失敗した場合、問題を修正してから再実行してください
- コミットメッセージは[Conventional Commits](https://www.conventionalcommits.org/)形式を推奨
- **lefthookが自動実行**: コミット時にformat/lintが自動実行されます
- プッシュ前にリモートブランチの状態を確認し、競合を避けてください

実行する準備ができたら、まず品質チェックから始めましょう。