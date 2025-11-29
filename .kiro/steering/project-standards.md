# プロジェクト標準

## コミュニケーション標準

- エージェントとのチャットは日本語で行うこと。
- `.kiro`ディレクトリ内のファイルは日本語で記述すること。
- READMEファイルは英語で記述し、200行以内に収めること。

## ツールバージョン管理

### .tool-versions

プロジェクトルートに`.tool-versions`ファイルを配置し、必要なツールとそのバージョンを定義すること：

**必須ツール:**
- **Node.js**: 24.x (Active LTS) または 22.x (Maintenance LTS)
- **Terraform**: >= 1.11.0
- **AWS CLI**: >= 2.0
- **Docker**: >= 20.0
- **Gitleaks**: 最新版（セキュリティチェック用）

**ツールのインストール:**

asdfを使用する場合（推奨）:
```bash
# asdfのインストール（未インストールの場合）
# macOS: brew install asdf
# Linux: https://asdf-vm.com/guide/getting-started.html

# プラグインの追加
asdf plugin add nodejs
asdf plugin add terraform

# .tool-versionsに基づいてインストール
asdf install
```

手動でインストールする場合:
```bash
# ツールの確認
make check-tools

# 各ツールを個別にインストール
# Node.js: https://nodejs.org/
# Terraform: https://www.terraform.io/downloads.html
# AWS CLI: https://aws.amazon.com/cli/
# Docker: https://www.docker.com/get-started
# Gitleaks: https://github.com/gitleaks/gitleaks
```

### Makefile

プロジェクトルートに`Makefile`を配置し、以下のコマンドを提供すること：

**ツール管理コマンド:**
```bash
make check-tools       # 必須ツールのインストール状況を確認
make install-tools     # asdf経由でツールをインストール（asdfがある場合）
```

**テストコマンド:**
```bash
make test              # すべてのテスト（ユニット + セキュリティ）
make test-unit         # ユニットテストのみ
make test-security     # セキュリティチェックのみ
make security-check    # セキュリティチェック（エイリアス）
```

**開発コマンド:**
```bash
make install           # 依存関係のインストール（check-toolsを自動実行）
make clean             # ビルド成果物のクリーンアップ
make help              # 利用可能なコマンドの表示
```

**ログ表示:**（将来実装）
```bash
make logs              # CloudWatch Logsの表示
make logs-frontend     # フロントエンドログ
make logs-backend      # バックエンドログ
```

### テスト実行の原則

- すべてのテストコマンドはMakefileからアクセス可能にすること
- `make test`は常にユニットテストとセキュリティチェックの両方を実行すること
- テストが失敗した場合は非ゼロの終了コードを返すこと
- CI/CDパイプラインでは`make test`を実行すること

## ドキュメント要件

以下のドキュメントファイルを作成・維持すること：

- `tech.md` - 技術アーキテクチャと設計判断
- `structure.md` - プロジェクト構造と構成

これらのファイルは関連する変更があれば必ず更新すること。

## Steering Files管理

### ファイルサイズの制限

**1ファイルあたりの行数:**
- **推奨**: 500-1000行
- **上限**: 1500行
- **1500行を超えた場合**: セクションごとに分割すること

**分割例:**
```
tech.md (1600行) → 分割
├── tech-architecture.md    # アーキテクチャ概要
├── tech-frontend.md        # フロントエンド技術
└── tech-backend.md         # バックエンド技術
```

### ファイル数の制限

**Steering filesの総数:**
- **推奨**: 3-5ファイル
- **上限**: 10ファイル
- **10ファイルを超えた場合**: 統合できるものを統合すること

### 現在のSteering Files

```
.kiro/steering/
├── project-standards.md    # プロジェクト標準（このファイル）
├── tech.md                 # 技術アーキテクチャ
└── structure.md            # プロジェクト構造
```

### 管理ルール

1. **定期的な確認**: 月1回、ファイルサイズを確認すること
2. **分割の判断**: 1500行を超えたら即座に分割を検討すること
3. **統合の判断**: 小さなファイル（100行未満）は統合を検討すること
4. **命名規則**: `<カテゴリ>-<サブカテゴリ>.md`の形式を使用すること
5. **相互参照**: 分割したファイル間で相互参照を明記すること

### ファイルサイズの確認方法

```bash
# すべてのsteering filesの行数を確認
wc -l .kiro/steering/*.md

# 1500行を超えるファイルを検出
find .kiro/steering -name "*.md" -exec wc -l {} \; | awk '$1 > 1500 {print $2 " has " $1 " lines (exceeds limit)"}'
```

## 開発フロー

### 基本的な開発フロー

すべての機能開発とバグ修正は以下のフローに従うこと：

**1. ブランチを切る**
```bash
# タスク番号を使用してブランチを作成
git checkout -b feat/task-1.1-setup-hono-app

# または、説明的な名前を使用
git checkout -b feat/setup-hono-application
```

**ブランチ命名規則:**
- `feat/task-X.X-<description>` - 新機能
- `fix/task-X.X-<description>` - バグ修正
- `refactor/task-X.X-<description>` - リファクタリング
- `test/task-X.X-<description>` - テスト追加

**2. ローカルで動作確認**
```bash
# テストを実行
make test

# ローカルサーバーで動作確認
cd frontend && npm run dev
# または
cd backend && npm run dev

# 手動テスト
# - 実装した機能が正しく動作することを確認
# - 既存の機能に影響がないことを確認
# - ブラウザで実際に操作して確認
```

**3. Push して main に PR 作成**
```bash
# 変更をステージング
git add .

# コミット（タスク番号を含める）
git commit -m "feat: Honoアプリケーションのセットアップ (task-1.1)

- backend/src/app.tsを作成
- GET /api/healthエンドポイントを実装
- CORSとロギングミドルウェアを追加

Task: 1.1"

# プッシュ
git push origin feat/task-1.1-setup-hono-app
```

**4. レビュー & マージ**
- GitHub上でPull Requestを作成
- エージェントまたはチームメンバーがレビュー
- 承認後、mainブランチにマージ
- ブランチを削除

### 自動化されたワークフロー

エージェントは以下を自動的に実行します：

**タスク開始時:**
1. ✅ タスク番号からブランチ名を生成
2. ✅ `git checkout -b feat/task-X.X-<description>`を実行
3. ✅ タスクの実装を開始

**タスク完了時:**
1. ✅ `make test`を実行して全テストが通ることを確認
2. ✅ ローカルで動作確認（必要に応じて）
3. ✅ 変更をコミット（タスク番号を含む）
4. ✅ ブランチをプッシュ
5. ✅ GitHub MCPを使用してPRを作成
6. ✅ コードレビューを実施
7. ✅ 承認後、PRをマージ
8. ✅ ブランチを削除

**エージェントとの対話例:**
```
ユーザー: "タスク1.1を実装して"

エージェント: 
1. ブランチを作成します: feat/task-1.1-setup-hono-app
2. Honoアプリケーションをセットアップします
3. ローカルでテストします
4. PRを作成します

[実装完了後]

エージェント: "実装が完了しました。PRを作成してレビューしますか？"

ユーザー: "お願いします"

エージェント: "PR #1を作成しました。レビューして承認します。"
[レビュー完了]

エージェント: "PRをマージしました。次のタスクに進みますか？"
```

### コミットメッセージの規約

**フォーマット:**
```
<type>: <subject> (task-X.X)

<body>

Task: X.X
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正や機能追加ではないコード変更
- `test`: テストの追加や修正
- `chore`: ビルドプロセスやツールの変更

**例:**
```
feat: Honoアプリケーションのセットアップ (task-1.1)

- backend/src/app.tsを作成
- GET /api/healthエンドポイントを実装
- CORSとロギングミドルウェアを追加
- ローカルサーバーが正常に起動することを確認

Task: 1.1
```

### PR作成のテンプレート

```markdown
## 概要
タスク1.1: Honoアプリケーションのセットアップ

## 変更内容
- backend/src/app.tsを作成
- GET /api/healthエンドポイントを実装
- CORSとロギングミドルウェアを追加

## 受け入れ条件
- [x] backend/src/app.tsが作成されている
- [x] GET /api/healthエンドポイントが実装されている
- [x] npm run devでローカルサーバーが起動する
- [x] curl http://localhost:3001/api/healthが{"status":"ok"}を返す

## テスト
- [x] make testが通る
- [x] ローカルで動作確認済み

## スクリーンショット（必要に応じて）
[スクリーンショットを添付]

Task: 1.1
```

## 不具合報告とバグ修正ワークフロー

### 不具合報告の流れ

**1. ユーザーがエージェントに報告**
```
ユーザー: "新聞生成ボタンをクリックしてもエラーが出ます"
```

**2. エージェントがGitHub Issueを作成**

エージェントはGitHub MCPを使用してIssueを自動作成します：

```
エージェント: "GitHub Issueを作成します..."

[GitHub MCP経由でIssueを作成]
- タイトル: "Bug: 新聞生成ボタンでエラーが発生"
- 本文: 問題の説明、再現手順、期待される動作、環境情報
- ラベル: "bug"
- 担当者: 自動設定

Issue #42 が作成されました
```

**3. 修正ブランチを作成**
```bash
# Issue番号を取得（例: #42）
ISSUE_NUMBER=42

# fix/ブランチを作成
git checkout -b fix/issue-${ISSUE_NUMBER}-newspaper-generation-error

# または、説明的な名前を使用
git checkout -b fix/newspaper-generation-button-error
```

### バグ修正の流れ

**4. 修正作業**
```bash
# 問題を特定して修正
# - コードの調査
# - 修正の実装
# - テストの追加/更新
```

**5. ローカルで動作確認**
```bash
# テストを実行
make test

# ローカルサーバーで動作確認
cd frontend && npm run dev
# または
cd backend && npm run dev

# 手動テスト
# 1. 再現手順を実行
# 2. 修正が機能することを確認
# 3. 他の機能に影響がないことを確認
```

**6. コミットとプッシュ**
```bash
# 変更をステージング
git add .

# コミット（Issue番号を含める）
git commit -m "fix: 新聞生成ボタンのエラーを修正 (#42)

- フィード選択時のバリデーションを追加
- エラーハンドリングを改善
- 関連するテストを追加

Fixes #42"

# プッシュ
git push origin fix/issue-42-newspaper-generation-error
```

**7. Pull Requestを作成**

エージェントはGitHub MCPを使用してPRを自動作成します：

```
エージェント: "Pull Requestを作成します..."

[GitHub MCP経由でPRを作成]
- タイトル: "fix: 新聞生成ボタンのエラーを修正 (#42)"
- ベースブランチ: main
- ヘッドブランチ: fix/issue-42-newspaper-generation-error
- 本文: 変更内容、修正内容、テスト結果
- ラベル: "bug"
- 関連Issue: #42

PR #43 が作成されました
```

**8. コードレビュー（エージェント）**

エージェントがGitHub MCPを使用してコードレビューを実施：

```
エージェント: "コードレビューを実施します..."

[レビュー項目]
- [x] コードの品質
- [x] テストの網羅性
- [x] セキュリティチェック
- [x] パフォーマンスへの影響
- [x] ドキュメントの更新

[GitHub MCP経由でレビュー]
- 変更内容を確認
- 必要に応じてコメントを追加
- 問題なければ承認

レビュー完了: APPROVED
```

**9. マージ**

エージェントまたはユーザーがGitHub MCPを使用してマージ：

```
エージェント: "PRをマージします..."

[GitHub MCP経由でマージ]
- マージ方法: Squash and merge（推奨）
- ブランチ削除: 自動

PR #43 がマージされました
Issue #42 が自動的にクローズされました
```

### コミットメッセージの規約

**フォーマット:**
```
<type>: <subject> (#issue-number)

<body>

<footer>
```

**Type:**
- `fix`: バグ修正
- `feat`: 新機能
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正や機能追加ではないコード変更
- `test`: テストの追加や修正
- `chore`: ビルドプロセスやツールの変更

**例:**
```
fix: 新聞生成ボタンのエラーを修正 (#42)

フィード選択時のバリデーションが不足していたため、
空のフィードリストで生成ボタンをクリックするとエラーが
発生していました。

- フィード選択時のバリデーションを追加
- エラーメッセージを改善
- 関連するテストを追加

Fixes #42
```

### ブランチ命名規則

**フォーマット:**
```
<type>/<issue-number>-<short-description>
```

**例:**
- `fix/42-newspaper-generation-error`
- `feat/15-bookmark-feature`
- `docs/23-update-readme`
- `refactor/31-improve-layout-algorithm`

### GitHub MCPのセットアップ

**前提条件:**
- GitHubアカウント
- GitHubパーソナルアクセストークン

**設定方法:**

1. **GitHubトークンの作成:**
   - GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - 必要なスコープ:
     - `repo` (フルアクセス)
     - `workflow` (GitHub Actionsの管理)
   - トークンをコピー

2. **MCP設定ファイルの更新:**
```json
// .kiro/settings/mcp.json
{
  "mcpServers": {
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

3. **環境変数での管理（推奨）:**
```bash
# ~/.zshrc または ~/.bashrc
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"
```

```json
// .kiro/settings/mcp.json
{
  "mcpServers": {
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

4. **MCPサーバーの再起動:**
   - Kiroを再起動、またはMCP Serverビューから再接続

### エージェントとの対話例

**バグ報告から修正まで:**

```
ユーザー: "新聞生成ボタンをクリックするとエラーが出ます"

エージェント: "問題を確認しました。GitHub Issueを作成します。"
[GitHub MCP: Issue #42 を作成]

エージェント: "修正ブランチを作成して、問題を調査します。"
[Git: fix/issue-42-newspaper-generation-error ブランチを作成]

エージェント: "問題を特定しました。フィード選択のバリデーションが不足していました。修正します。"
[コード修正、テスト追加]

エージェント: "ローカルで動作確認しました。問題が解決しています。"
[make test 実行、手動テスト]

エージェント: "変更をコミットしてPull Requestを作成します。"
[Git: commit & push]
[GitHub MCP: PR #43 を作成]

エージェント: "コードレビューを実施します。"
[GitHub MCP: レビュー実施、承認]

エージェント: "問題なければマージしますか？"

ユーザー: "お願いします"

エージェント: "マージしました。Issue #42 もクローズされました。"
[GitHub MCP: PR #43 をマージ]
```

### 自動化（オプション）

エージェントフックで自動化することも可能：

```json
// .kiro/hooks/create-bug-fix-branch.json
{
  "name": "バグ修正ブランチ作成",
  "description": "GitHub Issueからバグ修正ブランチを作成",
  "trigger": {
    "type": "manual"
  },
  "action": {
    "type": "message",
    "message": "バグ修正のIssue番号を教えてください。ブランチを作成してバグ修正を開始します。"
  }
}
```

## Spec実装の優先順位

機能実装は以下の優先順位で進めること：

### 1. MVP（最優先）

**ディレクトリ**: `.kiro/specs/mvp/`

MVPは最小限の機能で動作する製品を提供します。以下の機能を含みます：

- 基本的なUI/UX
- コア機能の実装
- 本番環境へのデプロイ

**実装順序:**
1. `mvp/requirements.md`の要件を確認
2. `mvp/design.md`の設計に従って実装
3. すべてのテストが通ることを確認
4. 本番環境にデプロイ

### 2. MyRSSPress（次の優先）

**ディレクトリ**: `.kiro/specs/mvp/`

MVPの次に実装する機能セットです。以下を含みます：

- 多言語対応（日本語/英語）
- 新聞設定とメタデータ
- 人気の新聞表示
- レスポンシブデザイン

**実装順序:**
1. MVPが完成していることを確認
2. `phase-2/requirements.md`の要件を確認
3. `phase-2/design.md`の設計に従って実装
4. 段階的にデプロイ

**実装タイミング:**
- Phase 1の実装が完了してから
- ユーザーフィードバックを元に優先順位を調整

### Spec実装のルール

1. **順序を守る**: Phase 1 → Phase 2
2. **完成させる**: 各specは完全に実装してから次に進む
3. **テストを書く**: すべての要件に対してテストを書く
4. **ドキュメント更新**: 実装に合わせてtech.md、structure.mdを更新
5. **レビュー**: 各spec完了時にコードレビューを実施

### タスクの受け入れ条件

**すべてのタスクには受け入れ条件を記載すること**

**受け入れ条件の形式:**
```markdown
- [ ] 1. タスク名
  - 実装内容の説明
  - **受け入れ条件:**
    - [ ] 条件1: 具体的な検証可能な条件
    - [ ] 条件2: 具体的な検証可能な条件
    - [ ] 条件3: 具体的な検証可能な条件
  - _Requirements: X.X_
```

**受け入れ条件の書き方:**
- **具体的**: 曖昧な表現を避ける
- **検証可能**: テストや確認で検証できる
- **完了の定義**: この条件を満たせばタスク完了と判断できる

**良い例:**
```markdown
- [ ] 1.1 Honoアプリケーションのセットアップ
  - **受け入れ条件:**
    - [ ] `backend/src/app.ts`が作成されている
    - [ ] `GET /api/health`エンドポイントが実装されている
    - [ ] `npm run dev`でローカルサーバーが起動する
    - [ ] `curl http://localhost:3001/api/health`が`{"status":"ok"}`を返す
```

**悪い例:**
```markdown
- [ ] 1.1 Honoアプリケーションのセットアップ
  - **受け入れ条件:**
    - [ ] 正しく動作する（❌ 曖昧）
    - [ ] きれいなコードを書く（❌ 検証不可能）
```

**受け入れ条件のカテゴリ:**
1. **ファイル/コードの存在**: 必要なファイルが作成されている
2. **機能の動作**: 特定の操作で期待される結果が得られる
3. **テストの合格**: 関連するテストがすべて通る
4. **パフォーマンス**: レスポンス時間などの性能要件を満たす
5. **デプロイ**: 本番環境で正しく動作する

## エージェントフック

品質チェックを自動化するエージェントフックを作成すること：

### 利用可能なフック

1. **ユニットテスト実行** (`.kiro/hooks/run-tests.json`)
   - コマンド: `make test-unit`
   - 用途: ユニットテストのみを実行
   - トリガー: 手動実行

2. **すべてのテスト実行** (`.kiro/hooks/run-all-tests.json`)
   - コマンド: `make test`
   - 用途: ユニットテスト + セキュリティチェック
   - トリガー: タスク完了時に自動実行

3. **セキュリティチェック** (`.kiro/hooks/pre-commit-security.json`)
   - コマンド: `make security-check`
   - 用途: コミット前の機密情報チェック
   - トリガー: 手動実行

### フックの実行方法（manual トリガーの場合）

**方法1: コマンドパレット（推奨）**
1. `Cmd + Shift + P`（macOS）または`Ctrl + Shift + P`（Windows/Linux）でコマンドパレットを開く
2. 「Agent Hooks」または「フック」と入力して検索
3. 実行したいフック（例：「ユニットテスト実行」）を選択

**方法2: Agent Hooksビュー**
1. サイドバーの「Agent Hooks」セクションを開く
2. 実行したいフックをクリック

**方法3: Makefileから直接実行（フックを使わない場合）**
```bash
make test-unit          # ユニットテストのみ
make test               # すべてのテスト
make security-check     # セキュリティチェックのみ
```

### フック作成のガイドライン

新しいフックを作成する際は以下に従うこと：

- フック定義ファイルは`.kiro/hooks/`に配置
- JSON形式で記述
- `name`は日本語で分かりやすく
- `description`で目的を明確に記述
- `command`はMakefileコマンドを使用
- `trigger.type`は基本的に`manual`（手動実行）

これらのフックにより、コード品質とドキュメントが実装と同期した状態を保つ。

## デプロイと動作確認

### デプロイのタイミング

**原則**: デプロイできるタイミングで積極的にデプロイして動作確認すること

**デプロイ可能なタイミング:**
1. **インフラ構築完了時**
   - Terraformでインフラを構築したら即座にデプロイ
   - Route53、Amplify、API Gateway、Lambdaなどの基本構成が整った時点

2. **機能単位の完成時**
   - 1つの機能（例：フィード提案API）が完成したらデプロイ
   - フロントエンドとバックエンドが連携できる状態になったらデプロイ

3. **バグ修正完了時**
   - 修正が完了し、ローカルテストが通ったらデプロイ
   - 本番環境で動作確認

**デプロイ手順:**
```bash
# バックエンドのデプロイ
cd backend
npm run build
# GitHub Actionsが自動的にECR + Lambdaにデプロイ

# フロントエンドのデプロイ
cd frontend
git push origin main
# Amplifyが自動的にビルド&デプロイ

# インフラの変更
cd infra/environments/production
terraform plan
terraform apply
```

**動作確認:**
1. **ヘルスチェック**: `https://api.my-rss-press.com/api/health`
2. **フロントエンド**: `https://my-rss-press.com`
3. **機能テスト**: 実際にUIから操作して確認
4. **ログ確認**: CloudWatch Logsでエラーがないか確認

### E2Eテストの方針

**原則**: E2Eテストは各機能単位で書いていくこと

**機能単位のE2Eテスト:**
```
frontend/tests/e2e/specs/
├── newspaper/
│   ├── create-newspaper.spec.ts    # 新聞作成フロー
│   ├── view-newspaper.spec.ts      # 新聞閲覧
│   └── share-newspaper.spec.ts     # 新聞共有
├── feed/
│   ├── select-feeds.spec.ts        # フィード選択
│   └── suggest-feeds.spec.ts       # AI提案
└── home/
    ├── popular-newspapers.spec.ts  # 人気の新聞
    └── recent-newspapers.spec.ts   # 新着新聞
```

**E2Eテストの実装タイミング:**
1. **機能実装と同時**: 機能を実装したら、その機能のE2Eテストも書く
2. **デプロイ前**: デプロイ前にE2Eテストを実行して動作確認
3. **継続的に追加**: 新しい機能を追加するたびにE2Eテストも追加

**E2Eテストの実行:**
```bash
# ローカル環境でテスト
cd frontend
npm run test:e2e

# 本番環境でテスト（デプロイ後）
BASE_URL=https://my-rss-press.com npm run test:e2e
```

**E2Eテストのベストプラクティス:**
- 各テストは独立して実行可能にする
- テストデータはフィクスチャで管理
- Page Object Modelパターンを使用
- 失敗時のスクリーンショットを自動保存
- CI/CDパイプラインに組み込む

## セキュリティチェック

### 概要

コミットやプッシュ前に機密情報が含まれていないかチェックすること。これにより、AWS認証情報、秘密鍵、トークンなどの漏洩を防ぐ。

### 使用ツール

**Gitleaks** - 機密情報検出ツール
- AWS Access Key ID / Secret Access Key
- 秘密鍵（RSA、DSA、EC）
- GitHub Token / OAuth Token
- 一般的なパスワードやAPIキーのパターン

### セットアップ

1. **Gitleaksのインストール:**
   ```bash
   # macOS
   brew install gitleaks
   
   # その他のプラットフォーム
   # https://github.com/gitleaks/gitleaks#installing
   ```

2. **設定ファイル:**
   - `.gitleaks.toml` - 検出ルールと除外設定
   - `scripts/security-check.sh` - チェックスクリプト
   - `.kiro/hooks/pre-commit-security.json` - Kiroフック設定

### 実行方法

**方法1: スクリプト直接実行**
```bash
./scripts/security-check.sh
```

**方法2: Kiroエージェントフック**
1. コマンドパレットを開く（Cmd/Ctrl + Shift + P）
2. 「Agent Hooks」を検索
3. 「セキュリティチェック（コミット前）」を実行

**方法3: Makefileから実行**
```bash
make security-check
```

### チェック内容

スクリプトは以下をチェックします：

1. **AWS認証情報**
   - Access Key ID: `AKIA[0-9A-Z]{16}`
   - Secret Access Key: 40文字の英数字文字列

2. **秘密鍵**
   - `-----BEGIN PRIVATE KEY-----`パターン

3. **GitHub Token**
   - Personal Access Token: `ghp_[0-9a-zA-Z]{36}`
   - OAuth Token: `gho_[0-9a-zA-Z]{36}`

4. **一般的なパスワード/APIキー**
   - `password=`, `api_key=`などのパターン

### 除外設定

以下のファイルは自動的に除外されます：
- Markdownファイル（`.md`）
- `package-lock.json`
- `.gitleaks.toml`（設定ファイル自体）

### エラー時の対応

機密情報が検出された場合：

1. **検出されたファイルから機密情報を削除**
2. **環境変数に移動**
   - `.env.local`（gitignore済み）
   - AWS Secrets Manager
   - 環境変数として設定
3. **必要に応じて`.gitignore`に追加**
4. **既にコミット済みの場合**
   - Git履歴から削除（`git filter-branch`または`BFG Repo-Cleaner`）
   - 認証情報をローテーション（無効化して再発行）

### ベストプラクティス

- コミット前に必ずセキュリティチェックを実行すること
- 機密情報は環境変数で管理すること
- `.env`ファイルは`.gitignore`に含めること
- サンプルコードには`your-api-key-here`などのプレースホルダーを使用すること
- 本番環境の認証情報はAWS Secrets Managerで管理すること
