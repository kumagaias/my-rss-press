# インフラデプロイ チェックポイント - 現在の状況

## 📋 タスク 1.6: チェックポイント：インフラデプロイ

### 現在の状況

インフラストラクチャのコード（Terraform）は完成していますが、**実際のデプロイはまだ実行されていません**。

### ✅ 完了している項目

1. **Terraformモジュールの作成**
   - ✅ Route53 (DNS)
   - ✅ ACM (SSL証明書)
   - ✅ DynamoDB (データベース)
   - ✅ ECR (コンテナレジストリ)
   - ✅ Lambda (バックエンド)
   - ✅ API Gateway (APIエンドポイント)
   - ✅ Amplify (フロントエンド)

2. **ドキュメント**
   - ✅ `infra/README.md` - 基本的なセットアップガイド
   - ✅ `infra/DEPLOYMENT.md` - 詳細なデプロイ手順
   - ✅ `infra/environments/production/pre-deploy-check.sh` - デプロイ前チェックスクリプト

3. **設定ファイル**
   - ✅ `main.tf` - メインのTerraform設定
   - ✅ `variables.tf` - 変数定義
   - ✅ `outputs.tf` - 出力定義
   - ✅ `terraform.tfvars.example` - 変数のサンプル

### ❌ 未完了の項目

以下の項目を完了させる必要があります：

#### 1. 必須ツールのインストール

- ❌ **Terraform** (>= 1.10.0)
  ```bash
  # macOSの場合
  brew install terraform
  
  # その他のプラットフォーム
  # https://www.terraform.io/downloads.html
  ```

#### 2. AWS設定の調整

- ⚠️ **AWSリージョン** (現在: ap-northeast-1 → 変更必要: us-east-1)
  ```bash
  # 一時的にus-east-1を使用する場合
  export AWS_DEFAULT_REGION=us-east-1
  
  # または、aws configureで変更
  aws configure set region us-east-1
  ```
  
  **注意**: ACM証明書はus-east-1で作成する必要があります（CloudFrontとの統合のため）

#### 3. GitHub Personal Access Tokenの取得

- ❌ **GitHub Token** (Amplify用)
  1. GitHubにログイン
  2. Settings → Developer settings → Personal access tokens → Tokens (classic)
  3. "Generate new token (classic)"
  4. スコープを選択: `repo`, `admin:repo_hook`
  5. トークンをコピー

#### 4. Terraform設定ファイルの作成

- ❌ **terraform.tfvars**
  ```bash
  cd infra/environments/production
  cp terraform.tfvars.example terraform.tfvars
  
  # エディタでterraform.tfvarsを開き、以下を設定:
  # - github_access_token: 上記で取得したトークン
  ```

#### 5. 依存関係のインストールとビルド

- ❌ **バックエンド**
  ```bash
  cd backend
  npm install
  npm run build
  ```

- ❌ **フロントエンド**
  ```bash
  cd frontend
  npm install
  ```

#### 6. Terraformの初期化

- ❌ **terraform init**
  ```bash
  cd infra/environments/production
  terraform init
  ```

#### 7. インフラのデプロイ

- ❌ **terraform apply**
  ```bash
  terraform plan  # 変更内容を確認
  terraform apply # デプロイ実行
  ```

#### 8. XServerでのDNS設定

- ❌ **ネームサーバーの変更**
  - Terraform出力からRoute53のネームサーバーを取得
  - XServerのコントロールパネルで設定

#### 9. バックエンドのデプロイ

- ❌ **Dockerイメージのビルドとプッシュ**
  ```bash
  cd backend
  docker build -t myrsspress-backend .
  # ECRにプッシュ（詳細はDEPLOYMENT.mdを参照）
  ```

#### 10. 動作確認

- ❌ **エンドポイントのテスト**
  ```bash
  curl https://api.my-rss-press.com/api/health
  open https://my-rss-press.com
  ```

## 🚀 次のステップ

### オプション1: 今すぐデプロイする

すべての前提条件を満たしてデプロイを実行する場合：

1. **前提条件の確認**
   ```bash
   cd infra/environments/production
   ./pre-deploy-check.sh
   ```

2. **デプロイ手順に従う**
   - `infra/DEPLOYMENT.md`の手順に従ってデプロイ

### オプション2: 後でデプロイする

今はデプロイせず、後で実行する場合：

1. **このドキュメントを保存**
   - `infra/CHECKPOINT-STATUS.md`（このファイル）
   - `infra/DEPLOYMENT.md`

2. **次回デプロイ時**
   - 上記の「未完了の項目」を順番に実行
   - `DEPLOYMENT.md`の手順に従う

## 📝 受け入れ条件の確認

タスク1.6の受け入れ条件:

- [ ] `terraform apply`が成功する
- [ ] `https://my-rss-press.com`にアクセスできる
- [ ] `https://api.my-rss-press.com/api/health`が正常に応答する
- [ ] SSL証明書が有効
- [ ] すべてのテストが通る

**現在の状態**: すべて未完了（デプロイ未実行のため）

## ⚠️ 重要な注意事項

1. **コスト**
   - デプロイすると月額$2-15のAWS料金が発生します
   - 主なコスト: Route53 ($0.50/月)、DynamoDB、Lambda

2. **DNS伝播**
   - ネームサーバー変更後、DNS伝播に最大48時間かかる場合があります
   - 通常は数時間で完了します

3. **GitHub Token**
   - `terraform.tfvars`にトークンを保存します
   - このファイルは`.gitignore`に含まれており、Gitにコミットされません
   - 安全に保管してください

4. **AWS認証情報**
   - デプロイには管理者権限を持つIAMユーザーが必要です
   - MFAを有効化することを推奨します

## 📚 参考ドキュメント

- **詳細なデプロイ手順**: `infra/DEPLOYMENT.md`
- **基本的なセットアップ**: `infra/README.md`
- **技術アーキテクチャ**: `.kiro/steering/tech.md`
- **プロジェクト構造**: `.kiro/steering/structure.md`

## 🤔 質問がある場合

デプロイに関して質問がある場合は、以下を確認してください：

1. `infra/DEPLOYMENT.md`のトラブルシューティングセクション
2. Terraformの公式ドキュメント
3. AWSの公式ドキュメント

---

**作成日**: 2024-11-30
**ステータス**: デプロイ準備完了（実行待ち）
