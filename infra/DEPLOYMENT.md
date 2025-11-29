# MyRSSPress Infrastructure Deployment Guide

## 概要

このドキュメントは、MyRSSPressのインフラストラクチャをAWSにデプロイするための完全なガイドです。

## 前提条件

### 必須ツール

- [Terraform](https://www.terraform.io/downloads.html) >= 1.10.0
- [AWS CLI](https://aws.amazon.com/cli/) >= 2.0
- [Docker](https://www.docker.com/get-started) >= 20.0
- [Node.js](https://nodejs.org/) >= 22.x または 24.x
- Git

### 必須アカウント・認証情報

1. **AWSアカウント**
   - 管理者権限を持つIAMユーザー
   - アクセスキーID / シークレットアクセスキー

2. **GitHubアカウント**
   - リポジトリ: `https://github.com/kumagaias/my-rss-press`
   - Personal Access Token（repo権限が必要）

3. **ドメイン**
   - XServerで登録済み: `my-rss-press.com`

## デプロイ手順

### ステップ1: AWS CLIの設定

```bash
# AWS CLIがインストールされているか確認
aws --version

# AWS認証情報を設定
aws configure
# AWS Access Key ID: <your-access-key-id>
# AWS Secret Access Key: <your-secret-access-key>
# Default region name: us-east-1
# Default output format: json

# 設定を確認
aws sts get-caller-identity
```

### ステップ2: GitHub Personal Access Tokenの作成

1. GitHubにログイン
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token (classic)" をクリック
4. 必要なスコープを選択:
   - `repo` (フルアクセス)
   - `admin:repo_hook` (webhookの管理)
5. トークンをコピー（後で使用）

### ステップ3: Terraform変数ファイルの作成

```bash
# プロジェクトルートから
cd infra/environments/production

# terraform.tfvarsファイルを作成
cat > terraform.tfvars << 'EOF'
# AWS Configuration
aws_region = "us-east-1"
environment = "production"

# Domain Configuration
domain_name = "my-rss-press.com"

# Resource Names
dynamodb_table_name   = "myrsspress-newspapers"
ecr_repository_name   = "myrsspress-backend"
lambda_function_name  = "myrsspress-api"
api_gateway_name      = "myrsspress-api"
amplify_app_name      = "myrsspress-frontend"

# GitHub Configuration
github_repository    = "https://github.com/kumagaias/my-rss-press"
github_access_token  = "YOUR_GITHUB_TOKEN_HERE"

# Bedrock Configuration
bedrock_region = "us-east-1"
EOF

# エディタでterraform.tfvarsを開き、YOUR_GITHUB_TOKEN_HEREを実際のトークンに置き換える
```

**重要**: `terraform.tfvars`は`.gitignore`に含まれているため、Gitにコミットされません。

### ステップ4: Terraformの初期化

```bash
# infra/environments/productionディレクトリで実行
terraform init
```

期待される出力:
```
Initializing modules...
Initializing the backend...
Initializing provider plugins...
Terraform has been successfully initialized!
```

### ステップ5: Terraformプランの確認

```bash
# 変更内容を確認
terraform plan
```

以下のリソースが作成される予定であることを確認:
- Route53 Hosted Zone
- ACM Certificate
- DynamoDB Table
- ECR Repository
- Lambda Function
- API Gateway
- Amplify Hosting

### ステップ6: インフラストラクチャのデプロイ

```bash
# デプロイを実行
terraform apply

# 確認プロンプトで "yes" と入力
```

**注意**: デプロイには10-15分かかります。特にACM証明書の検証に時間がかかる場合があります。

### ステップ7: Route53ネームサーバーの取得

デプロイ完了後、Route53のネームサーバーを取得:

```bash
terraform output route53_name_servers
```

出力例:
```
[
  "ns-1234.awsdns-12.com",
  "ns-5678.awsdns-56.net",
  "ns-9012.awsdns-90.org",
  "ns-3456.awsdns-34.co.uk"
]
```

### ステップ8: XServerでネームサーバーを設定

1. XServerのサーバーパネルにログイン
2. 「ドメイン設定」→「ネームサーバー設定」を選択
3. `my-rss-press.com` を選択
4. 「その他のネームサーバーを使用」を選択
5. Route53の4つのネームサーバーを入力
6. 設定を保存

**注意**: DNS変更の反映には最大48時間かかる場合があります（通常は数時間）。

### ステップ9: バックエンドのビルドとデプロイ

```bash
# プロジェクトルートに戻る
cd ../../..

# バックエンドの依存関係をインストール
cd backend
npm install

# TypeScriptをビルド
npm run build

# Dockerイメージをビルド
docker build -t myrsspress-backend .

# ECRリポジトリURLを取得
cd ../infra/environments/production
ECR_URL=$(terraform output -raw ecr_repository_url)
echo "ECR URL: $ECR_URL"

# ECRにログイン
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL

# イメージにタグを付けてプッシュ
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

### ステップ10: フロントエンドのデプロイ

Amplifyは自動的にGitHubリポジトリと連携し、mainブランチへのプッシュで自動デプロイされます。

```bash
# プロジェクトルートに戻る
cd ../../..

# フロントエンドの依存関係をインストール
cd frontend
npm install

# ローカルでビルドテスト（オプション）
npm run build

# mainブランチにプッシュ
git add .
git commit -m "feat: Initial infrastructure deployment"
git push origin main
```

Amplifyコンソールでビルドの進行状況を確認:
```bash
# Amplify App IDを取得
cd ../infra/environments/production
terraform output amplify_app_id

# ブラウザでAmplifyコンソールを開く
# https://console.aws.amazon.com/amplify/home?region=us-east-1
```

### ステップ11: デプロイの確認

#### 11.1 インフラストラクチャの確認

```bash
# すべての出力を表示
terraform output

# デプロイサマリーを表示
terraform output deployment_summary
```

#### 11.2 APIエンドポイントの確認

```bash
# ヘルスチェック
curl https://api.my-rss-press.com/api/health

# 期待される出力: {"status":"ok"}
```

#### 11.3 フロントエンドの確認

```bash
# ブラウザで開く
open https://my-rss-press.com
```

#### 11.4 SSL証明書の確認

```bash
# SSL証明書の有効性を確認
openssl s_client -connect my-rss-press.com:443 -servername my-rss-press.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

#### 11.5 DNS設定の確認

```bash
# ネームサーバーの確認
dig NS my-rss-press.com

# Aレコードの確認
dig A my-rss-press.com

# APIエンドポイントの確認
dig A api.my-rss-press.com
```

### ステップ12: CloudWatch Logsの確認

```bash
# Lambda関数のログを確認
aws logs tail /aws/lambda/myrsspress-api --follow --region us-east-1

# 最新のログストリームを表示
aws logs describe-log-streams \
  --log-group-name /aws/lambda/myrsspress-api \
  --order-by LastEventTime \
  --descending \
  --max-items 5 \
  --region us-east-1
```

## トラブルシューティング

### ACM証明書の検証が完了しない

**症状**: `terraform apply`がACM証明書の検証で停止する

**原因**: DNS設定が完了していない、またはDNS伝播が完了していない

**解決方法**:
1. Route53でDNS検証レコードが作成されているか確認
2. XServerでネームサーバーが正しく設定されているか確認
3. DNS伝播を確認: https://www.whatsmydns.net/
4. 最大48時間待つ

### Lambda関数が動作しない

**症状**: APIエンドポイントが500エラーを返す

**原因**: ECRイメージがプッシュされていない、またはLambda関数が更新されていない

**解決方法**:
```bash
# ECRイメージが存在するか確認
aws ecr describe-images \
  --repository-name myrsspress-backend \
  --region us-east-1

# Lambda関数の設定を確認
aws lambda get-function \
  --function-name myrsspress-api \
  --region us-east-1

# CloudWatch Logsでエラーを確認
aws logs tail /aws/lambda/myrsspress-api --follow --region us-east-1
```

### Amplifyビルドが失敗する

**症状**: Amplifyコンソールでビルドエラーが表示される

**原因**: 環境変数が設定されていない、またはビルド設定が間違っている

**解決方法**:
1. Amplifyコンソールでビルドログを確認
2. 環境変数が正しく設定されているか確認
3. `amplify.yml`の設定を確認

### API Gatewayのカスタムドメインが動作しない

**症状**: `https://api.my-rss-press.com`にアクセスできない

**原因**: DNS設定が完了していない、またはAPI Gatewayのマッピングが間違っている

**解決方法**:
```bash
# Route53のレコードを確認
aws route53 list-resource-record-sets \
  --hosted-zone-id $(terraform output -raw route53_zone_id) \
  --query "ResourceRecordSets[?Name=='api.my-rss-press.com.']"

# API Gatewayのカスタムドメインを確認
aws apigateway get-domain-name \
  --domain-name api.my-rss-press.com \
  --region us-east-1
```

## デプロイ後のチェックリスト

- [ ] `terraform apply`が成功した
- [ ] Route53ネームサーバーがXServerに設定されている
- [ ] ACM証明書が検証済みステータスになっている
- [ ] ECRにDockerイメージがプッシュされている
- [ ] Lambda関数が最新のイメージを使用している
- [ ] `https://api.my-rss-press.com/api/health`が正常に応答する
- [ ] `https://my-rss-press.com`にアクセスできる
- [ ] SSL証明書が有効である
- [ ] すべてのテストが通る（`make test`）

## コスト見積もり

月額コスト（概算）:
- Route53 ホストゾーン: $0.50
- DynamoDB (オンデマンド): ~$1-5
- Lambda: ~$0-5（無料枠内）
- API Gateway: ~$0-5（無料枠内）
- Amplify: ~$0（無料枠内）
- ACM: 無料
- **合計**: ~$2-15/月

## セキュリティのベストプラクティス

1. **terraform.tfvarsを保護**
   - Gitにコミットしない（`.gitignore`に含まれている）
   - 機密情報を含むため、安全に保管

2. **GitHub Personal Access Tokenを保護**
   - 定期的にローテーション
   - 必要最小限の権限のみ付与

3. **AWS認証情報を保護**
   - IAMユーザーにMFAを有効化
   - アクセスキーを定期的にローテーション
   - 最小権限の原則を適用

4. **CloudWatch Logsを監視**
   - 異常なアクセスパターンを検出
   - エラーログを定期的に確認

## メンテナンス

### インフラストラクチャの更新

```bash
# 変更を加えた後
cd infra/environments/production
terraform plan
terraform apply
```

### バックエンドの更新

```bash
# コードを変更した後
cd backend
npm run build
docker build -t myrsspress-backend .

# ECRにプッシュ
ECR_URL=$(cd ../infra/environments/production && terraform output -raw ecr_repository_url)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL
docker tag myrsspress-backend:latest $ECR_URL:latest
docker push $ECR_URL:latest

# Lambda関数を更新
aws lambda update-function-code \
  --function-name myrsspress-api \
  --image-uri $ECR_URL:latest \
  --region us-east-1
```

### フロントエンドの更新

```bash
# mainブランチにプッシュするだけで自動デプロイ
git push origin main
```

### インフラストラクチャの削除

**警告**: すべてのリソースとデータが削除されます！

```bash
cd infra/environments/production
terraform destroy
```

## サポート

問題が発生した場合:
1. このドキュメントのトラブルシューティングセクションを確認
2. CloudWatch Logsでエラーを確認
3. `.kiro/specs/phase-1/`のドキュメントを参照
4. AWSドキュメントを参照: https://docs.aws.amazon.com/

## 次のステップ

デプロイが完了したら:
1. E2Eテストを実行（`npm run test:e2e`）
2. 本番環境で機能テストを実施
3. パフォーマンスを測定
4. ユーザーフィードバックを収集
5. Phase 2の機能開発を開始
