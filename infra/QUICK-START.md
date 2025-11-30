# Infrastructure Deployment Quick Start

このガイドは、MyRSSPressのインフラストラクチャを最速でデプロイするための手順です。

## 前提条件チェック

```bash
# プロジェクトルートで実行
make check-tools
```

すべてのツールが✓になっていることを確認してください。

## デプロイ手順（5ステップ）

### ステップ1: terraform.tfvarsの作成

```bash
cd infra/environments/production

# terraform.tfvarsを作成
cp terraform.tfvars.example terraform.tfvars

# エディタで開いてGitHub tokenを設定
# github_access_token = "YOUR_GITHUB_TOKEN_HERE" を実際のトークンに置き換える
```

**GitHub Personal Access Tokenの作成方法:**
1. https://github.com/settings/tokens にアクセス
2. "Generate new token (classic)" をクリック
3. `repo` と `admin:repo_hook` にチェック
4. トークンをコピーして terraform.tfvars に貼り付け

### ステップ2: デプロイ前チェック

```bash
# pre-deploy-check.shを実行
./pre-deploy-check.sh
```

すべてのチェックが✓になるまで問題を修正してください。

### ステップ3: Terraformの初期化とデプロイ

```bash
# Terraformを初期化
terraform init

# プランを確認
terraform plan

# デプロイを実行（10-15分かかります）
terraform apply
# "yes" と入力して確定
```

### ステップ4: Route53ネームサーバーの設定

```bash
# ネームサーバーを取得
terraform output route53_name_servers
```

出力されたネームサーバーをXServerに設定:
1. XServerのサーバーパネルにログイン
2. ドメイン設定 → ネームサーバー設定
3. `my-rss-press.com` を選択
4. 「その他のネームサーバーを使用」を選択
5. 4つのネームサーバーを入力
6. 保存

**注意**: DNS伝播には最大48時間かかる場合があります（通常は数時間）。

### ステップ5: バックエンドのデプロイ

```bash
# プロジェクトルートに戻る
cd ../../..

# バックエンドをビルド
cd backend
npm install
npm run build

# Dockerイメージをビルド
docker build -t myrsspress-backend .

# ECRにプッシュ
cd ../infra/environments/production
ECR_URL=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL
docker tag myrsspress-backend:latest $ECR_URL:latest
docker push $ECR_URL:latest

# Lambda関数を更新
aws lambda update-function-code \
  --function-name myrsspress-api \
  --image-uri $ECR_URL:latest \
  --region us-east-1

# 更新完了を待機
aws lambda wait function-updated \
  --function-name myrsspress-api \
  --region us-east-1
```

## デプロイ確認

### 1. インフラストラクチャの確認

```bash
cd infra/environments/production
terraform output deployment_summary
```

### 2. APIエンドポイントの確認

```bash
# ヘルスチェック
curl https://api.my-rss-press.com/api/health

# 期待される出力: {"status":"ok"}
```

### 3. フロントエンドの確認

```bash
# ブラウザで開く
open https://my-rss-press.com
```

### 4. SSL証明書の確認

```bash
# 証明書の有効期限を確認
openssl s_client -connect my-rss-press.com:443 -servername my-rss-press.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

### 5. すべてのテストを実行

```bash
# プロジェクトルートで
make test
```

## トラブルシューティング

### ACM証明書の検証が完了しない

**症状**: `terraform apply`が証明書の検証で停止

**解決方法**:
1. XServerでネームサーバーが正しく設定されているか確認
2. DNS伝播を確認: https://www.whatsmydns.net/
3. 最大48時間待つ

### Lambda関数が動作しない

**症状**: APIエンドポイントが500エラーを返す

**解決方法**:
```bash
# CloudWatch Logsでエラーを確認
aws logs tail /aws/lambda/myrsspress-api --follow --region us-east-1

# Lambda関数の設定を確認
aws lambda get-function --function-name myrsspress-api --region us-east-1
```

### Amplifyビルドが失敗する

**症状**: Amplifyコンソールでビルドエラー

**解決方法**:
1. Amplifyコンソールでビルドログを確認
2. 環境変数が正しく設定されているか確認
3. `amplify.yml`の設定を確認

## 次のステップ

デプロイが完了したら:
1. ✅ すべての受け入れ条件を確認
2. ✅ E2Eテストを実行
3. ✅ 本番環境で機能テスト
4. ✅ パフォーマンスを測定

## 詳細ドキュメント

より詳細な情報は以下を参照:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完全なデプロイガイド
- [README.md](./README.md) - インフラストラクチャ概要
- [../docs/TOOL-MANAGEMENT.md](../docs/TOOL-MANAGEMENT.md) - ツール管理ガイド

## サポート

問題が発生した場合:
1. このガイドのトラブルシューティングセクションを確認
2. DEPLOYMENT.mdの詳細なトラブルシューティングを参照
3. CloudWatch Logsでエラーを確認
