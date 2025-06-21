# Deployment Setup

## Vercel Deployment Configuration (推奨方法)

このプロジェクトでは、**Vercelの公式GitHubインテグレーション**を使用して自動デプロイを行います。これは最もシンプルで確実な方法です。

### 1. Vercel Dashboard でのプロジェクトセットアップ

1. **Vercelにログイン**
   - https://vercel.com/ にアクセスしてログイン

2. **プロジェクトをインポート**
   - 「Add New... > Project」をクリック
   - GitHubリポジトリから `tetris-game2` を選択
   - 「Import」をクリック

3. **ビルド設定を確認・設定**
   - **Framework Preset**: `Vite` を選択
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
   - **Node.js Version**: `24.x`

4. **デプロイ実行**
   - 「Deploy」をクリックして初回デプロイを実行

### 2. 自動デプロイの仕組み

設定完了後、以下の流れで自動デプロイが実行されます：

1. **mainブランチにプッシュ**
2. **GitHub Actions CI** が実行される（テスト、リント、ビルド）
3. **Vercelが自動検知**してデプロイを開始
4. **本番環境に反映**

### 3. CI/CD構成

- **CI (GitHub Actions)**: `.github/workflows/ci.yml`
  - テスト実行
  - リント検査
  - ビルド確認
  - デッドコード検出

- **CD (Vercel Integration)**: 自動デプロイ
  - mainブランチプッシュ時に自動実行
  - Vercelダッシュボードで詳細ログ確認可能

### 4. 環境変数の設定（必要に応じて）

アプリケーションが環境変数を必要とする場合：
- Vercel Dashboard > Project > Settings > Environment Variables で設定

### 5. デプロイ状況の確認

- **Vercelダッシュボード**: https://vercel.com/dashboard
- **GitHub Actions**: リポジトリの「Actions」タブ
- **デプロイURL**: Vercelから提供される本番URL

## 手動デプロイ（開発時）

開発時に手動でデプロイしたい場合：

1. Vercel CLIをインストール:
   ```bash
   npm install -g vercel
   ```

2. ログインしてデプロイ:
   ```bash
   vercel login
   vercel --prod
   ```

## トラブルシューティング

### ビルドエラーが発生した場合
1. ローカルで `pnpm run build` を実行して問題を特定
2. Vercelダッシュボードの「Functions」タブでログを確認
3. package.jsonの依存関係を確認

### デプロイが実行されない場合
1. Vercelダッシュボードでリポジトリが正しく連携されているか確認
2. GitHub ActionsのCIが成功しているか確認
3. mainブランチにプッシュされているか確認

## GitHub Secretsのクリーンアップ

**重要**: Vercel公式インテグレーションを使用するため、以下のGitHub Secretsは**不要**になりました：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID` 
- `VERCEL_PROJECT_ID`

これらのSecretsは削除して構いません：
1. GitHubリポジトリの「Settings > Secrets and variables > Actions」へ移動
2. 上記3つのSecretsを削除

## 移行完了後の構成

✅ **CI (GitHub Actions)**: テスト・リント・ビルド確認  
✅ **CD (Vercel Integration)**: mainブランチプッシュ時の自動デプロイ  
❌ **手動デプロイワークフロー**: 削除済み（不要）  
❌ **GitHub Secrets**: 削除済み（不要）