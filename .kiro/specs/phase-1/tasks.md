# 実装タスクリスト MVP

## 概要

このタスクリストは、requirements.mdとdesign.mdに基づいて、MyRSSPress MVPを実装するための具体的なタスクを定義します。各タスクには受け入れ条件が含まれており、タスク完了の判断基準を明確にしています。

## タスク実行の原則

1. **順序を守る**: タスクは番号順に実行すること
2. **受け入れ条件を確認**: 各タスクの受け入れ条件をすべて満たすこと
3. **テストを実行**: タスク完了後は必ず`make test`を実行すること
4. **デプロイして確認**: デプロイ可能なタイミングで本番環境にデプロイして動作確認すること
5. **ブランチ運用**: `feat/task-X.X-<description>`ブランチで作業し、PRを作成してマージすること

## タスク一覧

- [x] 1. プロジェクトセットアップとインフラ基盤
- [x] 2. デザインシステムとUIコンポーネント
- [x] 3. バックエンドAPI実装
- [x] 4. フロントエンド実装
- [ ] 5. 統合とE2Eテスト
- [ ] 6. 最終デプロイと動作確認

---

## 1. プロジェクトセットアップとインフラ基盤

### 1.1 プロジェクト構造の作成

- [x] 1.1 プロジェクト構造の作成
  - ルートディレクトリに`frontend/`, `backend/`, `infra/`ディレクトリを作成
  - 各ディレクトリに基本的な設定ファイルを配置
  - **受け入れ条件:**
    - [ ] `frontend/`, `backend/`, `infra/`ディレクトリが存在する
    - [ ] `.gitignore`が適切に設定されている
    - [ ] `README.md`が作成されている（英語、200行以内）
  - _Requirements: 全般_

### 1.2 Makefileの作成

- [x] 1.2 Makefileの作成
  - プロジェクトルートに`Makefile`を作成
  - `test`, `test-unit`, `test-security`, `install`, `clean`, `help`コマンドを実装
  - **受け入れ条件:**
    - [ ] `make help`でコマンド一覧が表示される
    - [ ] `make install`で依存関係がインストールされる
    - [ ] `make test`でテストが実行される
  - _Requirements: 全般_


### 1.3 バックエンドプロジェクトのセットアップ

- [x] 1.3 バックエンドプロジェクトのセットアップ
  - `backend/`ディレクトリにNode.js + TypeScriptプロジェクトを初期化
  - Hono 4.x、TypeScript 5.9.x、Zod 3.xをインストール
  - `tsconfig.json`を設定
  - **受け入れ条件:**
    - [ ] `backend/package.json`が作成されている
    - [ ] `backend/tsconfig.json`が作成されている
    - [ ] `npm install`が成功する
    - [ ] TypeScriptのコンパイルが成功する
  - _Requirements: 全般_

- [x] 1.3.1 Honoアプリケーションの基本構造を作成
  - `backend/src/app.ts`を作成
  - CORSとロギングミドルウェアを設定
  - `GET /api/health`エンドポイントを実装
  - **受け入れ条件:**
    - [ ] `backend/src/app.ts`が作成されている
    - [ ] `npm run dev`でローカルサーバーが起動する（ポート3001）
    - [ ] `curl http://localhost:3001/api/health`が`{"status":"ok"}`を返す
    - [ ] CORSヘッダーが正しく設定されている
  - _Requirements: 全般_

- [x] 1.3.2 レート制限ミドルウェアを実装
  - `backend/src/middleware/rateLimit.ts`を作成
  - IPベースのレート制限を実装（100リクエスト/分）
  - **受け入れ条件:**
    - [ ] レート制限ミドルウェアが実装されている
    - [ ] 制限を超えると429エラーが返される
    - [ ] ユニットテストが通る
  - _Requirements: 13.6_


### 1.4 フロントエンドプロジェクトのセットアップ

- [x] 1.4 フロントエンドプロジェクトのセットアップ
  - `frontend/`ディレクトリにNext.js 15.xプロジェクトを作成
  - TailwindCSS 3.x、TypeScript 5.9.xを設定
  - **受け入れ条件:**
    - [ ] `frontend/package.json`が作成されている
    - [ ] `npm run dev`で開発サーバーが起動する（ポート3000）
    - [ ] `http://localhost:3000`にアクセスできる
    - [ ] TailwindCSSが正しく動作する
  - _Requirements: 全般_

- [x] 1.4.1 多言語対応（i18n）のセットアップ
  - `frontend/lib/i18n.ts`を作成
  - 日本語と英語の翻訳ファイルを作成
  - ブラウザ言語検出機能を実装
  - **受け入れ条件:**
    - [ ] `frontend/lib/i18n.ts`が作成されている
    - [ ] 日本語と英語の翻訳が定義されている
    - [ ] `detectLocale()`関数が正しく動作する
    - [ ] ユニットテストが通る
  - _Requirements: 1.1, 1.2, 1.3_

### 1.5 Terraformインフラのセットアップ

- [x] 1.5 Terraformインフラのセットアップ
  - `infra/environments/production/`ディレクトリを作成
  - `main.tf`, `variables.tf`, `outputs.tf`を作成
  - **受け入れ条件:**
    - [ ] Terraformファイルが作成されている
    - [ ] `terraform init`が成功する
    - [ ] `terraform validate`が成功する
  - _Requirements: 全般_

- [x] 1.5.1 Route53ホストゾーンの作成
  - `infra/modules/route53/`モジュールを作成
  - `my-rss-press.com`のホストゾーンを作成
  - **受け入れ条件:**
    - [ ] Route53ホストゾーンが作成されている
    - [ ] ネームサーバーが出力される
    - [ ] XServerでネームサーバーを設定する手順が明確
  - _Requirements: 全般_

- [x] 1.5.2 ACM証明書の作成
  - `infra/modules/acm/`モジュールを作成
  - `my-rss-press.com`と`*.my-rss-press.com`の証明書を作成
  - DNS検証を設定
  - **受け入れ条件:**
    - [ ] ACM証明書が作成されている
    - [ ] DNS検証レコードが自動作成される
    - [ ] 証明書が検証済みステータスになる
  - _Requirements: 全般_


- [x] 1.5.3 DynamoDBテーブルの作成
  - `infra/modules/dynamodb/`モジュールを作成
  - Newspapersテーブルを作成（PK: NEWSPAPER#{id}, SK: METADATA）
  - GSI: PublicNewspapers（人気順）とRecentNewspapers（新着順）を作成
  - **受け入れ条件:**
    - [ ] DynamoDBテーブルが作成されている
    - [ ] GSIが正しく設定されている
    - [ ] `terraform apply`が成功する
  - _Requirements: 全般_

- [x] 1.5.4 ECRリポジトリの作成
  - `infra/modules/ecr/`モジュールを作成
  - バックエンド用のECRリポジトリを作成
  - **受け入れ条件:**
    - [ ] ECRリポジトリが作成されている
    - [ ] リポジトリURLが出力される
  - _Requirements: 全般_

- [x] 1.5.5 Lambda関数の作成
  - `infra/modules/lambda/`モジュールを作成
  - ECRイメージを使用するLambda関数を作成
  - 環境変数（BEDROCK_REGION, DYNAMODB_TABLE）を設定
  - **受け入れ条件:**
    - [ ] Lambda関数が作成されている
    - [ ] IAMロールが正しく設定されている
    - [ ] 環境変数が設定されている
  - _Requirements: 全般_

- [x] 1.5.6 API Gatewayの作成
  - `infra/modules/api-gateway/`モジュールを作成
  - REST APIを作成
  - Lambda統合を設定
  - カスタムドメイン（api.my-rss-press.com）を設定
  - **受け入れ条件:**
    - [ ] API Gatewayが作成されている
    - [ ] Lambda統合が動作する
    - [ ] カスタムドメインが設定されている
    - [ ] `https://api.my-rss-press.com/api/health`にアクセスできる
  - _Requirements: 全般_

- [x] 1.5.7 Amplify Hostingの作成
  - `infra/modules/amplify/`モジュールを作成
  - GitHubリポジトリと連携
  - カスタムドメイン（my-rss-press.com）を設定
  - 環境変数（NEXT_PUBLIC_API_BASE_URL）を設定
  - **受け入れ条件:**
    - [ ] Amplify Hostingが作成されている
    - [ ] GitHubリポジトリと連携されている
    - [ ] カスタムドメインが設定されている
    - [ ] 自動デプロイが動作する
  - _Requirements: 全般_

### 1.6 チェックポイント：インフラデプロイ

- [x] 1.6 チェックポイント：インフラデプロイ
  - すべてのインフラをデプロイ
  - 動作確認を実施
  - **受け入れ条件:**
    - [ ] `terraform apply`が成功する
    - [ ] `https://my-rss-press.com`にアクセスできる
    - [ ] `https://api.my-rss-press.com/api/health`が正常に応答する
    - [ ] SSL証明書が有効
    - [ ] すべてのテストが通る


---

## 2. デザインシステムとUIコンポーネント

### 2.1 Storybookのセットアップ

- [x] 2.1 Storybookのセットアップ
  - Storybook 8.xをインストール
  - `.storybook/main.ts`を設定
  - **受け入れ条件:**
    - [ ] `npm run storybook`でStorybookが起動する
    - [ ] `http://localhost:6006`にアクセスできる
  - _Requirements: 全般_

### 2.2 デザインシステムの定義

- [x] 2.2 デザインシステムの定義
  - `frontend/lib/design-system.ts`を作成
  - カラーパレット、タイポグラフィ、スペーシングを定義
  - TailwindCSS設定に反映
  - **受け入れ条件:**
    - [ ] デザインシステムが定義されている
    - [ ] `tailwind.config.ts`に反映されている
    - [ ] カラーパレットが使用できる
  - _Requirements: 全般_

### 2.3 基本UIコンポーネントの実装

- [x] 2.3.1 Buttonコンポーネント
  - `frontend/components/ui/Button.tsx`を作成
  - variant（primary, secondary, outline, ghost）を実装
  - size（sm, md, lg）を実装
  - Storybookストーリーを作成
  - **受け入れ条件:**
    - [x] Buttonコンポーネントが実装されている
    - [x] すべてのvariantとsizeが動作する
    - [x] Storybookで確認できる
    - [x] ユニットテストが通る
  - _Requirements: 全般_

- [x] 2.3.2 Inputコンポーネント
  - `frontend/components/ui/Input.tsx`を作成
  - エラー表示機能を実装
  - Storybookストーリーを作成
  - **受け入れ条件:**
    - [x] Inputコンポーネントが実装されている
    - [x] エラー表示が動作する
    - [x] Storybookで確認できる
    - [x] ユニットテストが通る
  - _Requirements: 2.2_

- [x] 2.3.3 Cardコンポーネント
  - `frontend/components/ui/Card.tsx`を作成
  - Storybookストーリーを作成
  - **受け入れ条件:**
    - [x] Cardコンポーネントが実装されている
    - [x] Storybookで確認できる
  - _Requirements: 4.5_

- [x] 2.3.4 Checkboxコンポーネント
  - `frontend/components/ui/Checkbox.tsx`を作成
  - Storybookストーリーを作成
  - **受け入れ条件:**
    - [x] Checkboxコンポーネントが実装されている
    - [x] Storybookで確認できる
    - [x] ユニットテストが通る
  - _Requirements: 3.2_

- [x] 2.3.5 Modalコンポーネント
  - `frontend/components/ui/Modal.tsx`を作成
  - Storybookストーリーを作成
  - **受け入れ条件:**
    - [x] Modalコンポーネントが実装されている
    - [x] 開閉が正しく動作する
    - [x] Storybookで確認できる
    - [x] ユニットテストが通る
  - _Requirements: 6.2_


---

## 3. バックエンドAPI実装

### 3.1 AWS Bedrock統合

- [x] 3.1 AWS Bedrock統合
  - `backend/src/services/bedrockService.ts`を作成
  - Claude 3.5 Haikuを使用したフィード提案機能を実装
  - **受け入れ条件:**
    - [x] BedrockRuntimeClientが正しく設定されている
    - [x] `suggestFeeds(theme)`関数が実装されている
    - [x] テーマに基づいて3つのフィード提案が返される
    - [x] ユニットテスト（モック使用）が通る
  - _Requirements: 3.1, 3.2_

### 3.2 RSS取得サービス

- [x] 3.2 RSS取得サービス
  - `backend/src/services/rssFetcherService.ts`を作成
  - 並行フィード取得を実装
  - 日付フィルタリング（3日間→7日間）を実装
  - **受け入れ条件:**
    - [x] `fetchArticles(feedUrls, daysBack)`関数が実装されている
    - [x] 複数フィードを並行して取得できる
    - [x] 日付フィルタリングが正しく動作する
    - [x] タイムアウト処理が実装されている
    - [x] ユニットテストが通る
  - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_

### 3.3 記事重要度計算サービス

- [x] 3.3 記事重要度計算サービス
  - `backend/src/services/importanceCalculator.ts`を作成
  - Bedrockを使用した重要度計算を実装
  - フォールバックアルゴリズムを実装
  - **受け入れ条件:**
    - [x] `calculateImportance(articles, theme)`関数が実装されている
    - [x] Bedrockで重要度スコア（0-100）が計算される
    - [x] Bedrock失敗時にフォールバックが動作する
    - [x] ユニットテストが通る
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

### 3.4 新聞サービス

- [x] 3.4 新聞サービス
  - `backend/src/services/newspaperService.ts`を作成
  - DynamoDB操作（保存、取得、一覧取得）を実装
  - **受け入れ条件:**
    - [x] `saveNewspaper(newspaper)`関数が実装されている
    - [x] `getNewspaper(id)`関数が実装されている
    - [x] `getPublicNewspapers(sortBy, limit)`関数が実装されている
    - [x] `incrementViewCount(id)`関数が実装されている
    - [x] ユニットテスト（AWS SDK Mock使用）が通る
  - _Requirements: 6.1, 6.5, 4.1, 4.2, 4.3, 4.4_


### 3.5 APIエンドポイントの実装

- [x] 3.5.1 POST /api/suggest-feeds
  - `backend/src/routes/feeds.ts`を作成
  - フィード提案エンドポイントを実装
  - Zodバリデーションを追加
  - レート制限（10リクエスト/分）を設定
  - **受け入れ条件:**
    - [x] エンドポイントが実装されている
    - [x] リクエストボディがバリデーションされる
    - [x] 正しいレスポンスが返される
    - [x] レート制限が動作する
    - [x] 統合テストが通る
  - _Requirements: 3.1, 3.2_

- [x] 3.5.2 POST /api/generate-newspaper
  - 新聞生成エンドポイントを実装
  - RSS取得、重要度計算を統合
  - レート制限（20リクエスト/分）を設定
  - **受け入れ条件:**
    - [x] エンドポイントが実装されている
    - [x] 記事が正しく取得される
    - [x] 重要度が計算される
    - [x] 5秒以内に完了する
    - [x] 統合テストが通る
  - _Requirements: 5.1, 5.2, 5.3, 5.8, 5.9, 5.10, 10.1, 10.2_

- [x] 3.5.3 POST /api/newspapers
  - 新聞保存エンドポイントを実装
  - **受け入れ条件:**
    - [x] エンドポイントが実装されている
    - [x] 新聞がDynamoDBに保存される
    - [x] 新聞IDが返される
    - [x] 統合テストが通る
  - _Requirements: 6.1, 6.5_

- [x] 3.5.4 GET /api/newspapers/:id
  - 新聞取得エンドポイントを実装
  - 閲覧数インクリメント機能を追加
  - **受け入れ条件:**
    - [x] エンドポイントが実装されている
    - [x] 新聞データが返される
    - [x] 閲覧数がインクリメントされる
    - [x] 統合テストが通る
  - _Requirements: 4.6_

- [x] 3.5.5 GET /api/newspapers
  - 公開新聞一覧取得エンドポイントを実装
  - 並び替え（popular/recent）を実装
  - **受け入れ条件:**
    - [x] エンドポイントが実装されている
    - [x] 人気順と新着順の並び替えが動作する
    - [x] 統合テストが通る
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

### 3.6 Dockerfileの作成

- [x] 3.6 Dockerfileの作成
  - `backend/Dockerfile`を作成
  - Lambda用のイメージをビルド
  - **受け入れ条件:**
    - [x] Dockerfileが作成されている
    - [x] `docker build`が成功する
    - [x] ローカルでLambdaをテストできる
  - _Requirements: 全般_

### 3.7 チェックポイント：バックエンドデプロイ

- [x] 3.7 チェックポイント：バックエンドデプロイ
  - バックエンドをECR + Lambdaにデプロイ
  - 動作確認を実施
  - **受け入れ条件:**
    - [x] GitHub Actionsでビルド&デプロイが成功する
    - [x] `https://api.my-rss-press.com/api/health`が正常に応答する
    - [x] すべてのエンドポイントが動作する
    - [x] すべてのテストが通る


---

## 4. フロントエンド実装

### 4.1 レイアウト計算ロジック

- [x] 4.1 レイアウト計算ロジック
  - `frontend/lib/layoutCalculator.ts`を作成
  - 記事数に応じた動的レイアウトを実装
  - **受け入れ条件:**
    - [ ] `calculateLayout(articles)`関数が実装されている
    - [ ] 記事数に応じてレイアウトが変わる
    - [ ] すべての記事が含まれる
    - [ ] ユニットテストが通る
  - _Requirements: 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

### 4.2 新聞レイアウトコンポーネント

- [x] 4.2 新聞レイアウトコンポーネント
  - `frontend/components/features/newspaper/NewspaperLayout.tsx`を作成
  - 紙テクスチャスタイリングを実装
  - レスポンシブデザインを実装
  - **受け入れ条件:**
    - [ ] 新聞レイアウトが実装されている
    - [ ] 紙テクスチャが表示される
    - [ ] セリフフォントが使用されている
    - [ ] モバイルで1カラムに変わる
    - [ ] ユニットテストが通る
  - _Requirements: 7.1, 7.2, 7.3, 11.1, 11.2, 11.3, 11.4_

### 4.3 テーマ入力コンポーネント

- [x] 4.3 テーマ入力コンポーネント
  - `frontend/components/features/feed/ThemeInput.tsx`を作成
  - 入力検証を実装
  - **受け入れ条件:**
    - [ ] テーマ入力コンポーネントが実装されている
    - [ ] 空入力が拒否される
    - [ ] Enterキーで送信できる
    - [ ] ユニットテストが通る
  - _Requirements: 2.2, 3.4_

### 4.4 フィード選択コンポーネント

- [x] 4.4 フィード選択コンポーネント
  - `frontend/components/features/feed/FeedSelector.tsx`を作成
  - フィード追加・削除機能を実装
  - 重複チェックを実装
  - **受け入れ条件:**
    - [ ] フィード選択コンポーネントが実装されている
    - [ ] フィードの追加・削除が動作する
    - [ ] 重複が防止される
    - [ ] ユニットテストが通る
  - _Requirements: 2.3, 2.4, 2.5, 3.2, 3.3_


### 4.5 人気の新聞コンポーネント

- [x] 4.5 人気の新聞コンポーネント
  - `frontend/components/features/home/PopularNewspapers.tsx`を作成
  - 並び替え機能を実装
  - 新聞カードを実装
  - **受け入れ条件:**
    - [ ] 人気の新聞コンポーネントが実装されている
    - [ ] 人気順・新着順の並び替えが動作する
    - [ ] 新聞カードが正しく表示される
    - [ ] ユニットテストが通る
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

### 4.6 新聞設定モーダル

- [x] 4.6 新聞設定モーダル
  - `frontend/components/features/newspaper/NewspaperSettings.tsx`を作成
  - ユーザー名・新聞名入力を実装
  - デフォルト値設定を実装
  - **受け入れ条件:**
    - [ ] 設定モーダルが実装されている
    - [ ] 入力フィールドが動作する
    - [ ] デフォルト値が設定される
    - [ ] ユニットテストが通る
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_

### 4.7 統合ホーム画面

- [x] 4.7 統合ホーム画面
  - `frontend/app/page.tsx`を作成
  - すべてのコンポーネントを統合
  - API連携を実装
  - **受け入れ条件:**
    - [ ] ホーム画面が実装されている
    - [ ] テーマ入力→フィード提案が動作する
    - [ ] フィード選択→新聞生成が動作する
    - [ ] 人気の新聞が表示される
    - [ ] ユニットテストが通る
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

### 4.8 新聞詳細ページ

- [x] 4.8 新聞詳細ページ
  - `frontend/app/newspapers/[id]/page.tsx`を作成
  - 新聞レイアウトを表示
  - 保存機能を実装
  - ホームに戻るボタンを実装
  - **受け入れ条件:**
    - [ ] 新聞詳細ページが実装されている
    - [ ] 新聞が正しく表示される
    - [ ] 保存機能が動作する
    - [ ] ホームに戻れる
    - [ ] ユニットテストが通る
  - _Requirements: 5.9, 6.1, 6.5, 6.6, 6.7, 9.1, 9.2_

### 4.9 ローディング・エラー表示

- [x] 4.9 ローディング・エラー表示
  - ローディングインジケーターを実装
  - エラーメッセージ表示を実装
  - **受け入れ条件:**
    - [ ] ローディング中に進行状況が表示される
    - [ ] エラー時に適切なメッセージが表示される
    - [ ] ユニットテストが通る
  - _Requirements: 5.1, 5.2, 10.4_

### 4.10 チェックポイント：フロントエンドデプロイ

- [x] 4.10 チェックポイント：フロントエンドデプロイ
  - フロントエンドをAmplifyにデプロイ
  - 動作確認を実施
  - **受け入れ条件:**
    - [ ] `git push origin main`で自動デプロイされる
    - [ ] `https://my-rss-press.com`にアクセスできる
    - [ ] すべての機能が動作する
    - [ ] すべてのテストが通る


---

## 5. 統合とE2Eテスト

### 5.1 Playwrightのセットアップ

- [ ] 5.1 Playwrightのセットアップ
  - Playwright 1.40.x以上をインストール
  - `playwright.config.ts`を設定
  - Page Objectsディレクトリを作成
  - **受け入れ条件:**
    - [ ] Playwrightがインストールされている
    - [ ] `npm run test:e2e`でテストが実行できる
    - [ ] 設定ファイルが正しく動作する
  - _Requirements: 12.3, 12.4, 12.5_

### 5.2 Page Objectsの作成

- [ ] 5.2.1 HomePage Page Object
  - `frontend/tests/e2e/pages/HomePage.ts`を作成
  - **受け入れ条件:**
    - [ ] HomePageクラスが実装されている
    - [ ] すべての要素セレクタが定義されている
    - [ ] メソッドが実装されている
  - _Requirements: 12.5_

- [ ] 5.2.2 FeedSelectorPage Page Object
  - `frontend/tests/e2e/pages/FeedSelectorPage.ts`を作成
  - **受け入れ条件:**
    - [ ] FeedSelectorPageクラスが実装されている
    - [ ] すべての要素セレクタが定義されている
    - [ ] メソッドが実装されている
  - _Requirements: 12.5_

- [ ] 5.2.3 NewspaperPage Page Object
  - `frontend/tests/e2e/pages/NewspaperPage.ts`を作成
  - **受け入れ条件:**
    - [ ] NewspaperPageクラスが実装されている
    - [ ] すべての要素セレクタが定義されている
    - [ ] メソッドが実装されている
  - _Requirements: 12.5_

### 5.3 E2Eテストの実装

- [ ] 5.3.1 新聞作成フローのE2Eテスト
  - `frontend/tests/e2e/specs/newspaper/create-newspaper.spec.ts`を作成
  - テーマ入力→フィード提案→選択→生成のフローをテスト
  - **受け入れ条件:**
    - [ ] E2Eテストが実装されている
    - [ ] テストが通る
    - [ ] 複数ブラウザで動作する
  - _Requirements: 12.4_

- [ ] 5.3.2 手動フィード追加のE2Eテスト
  - `frontend/tests/e2e/specs/feed/select-feeds.spec.ts`を作成
  - 手動フィード追加・削除をテスト
  - **受け入れ条件:**
    - [ ] E2Eテストが実装されている
    - [ ] テストが通る
  - _Requirements: 12.4_

- [ ] 5.3.3 新聞設定保存のE2Eテスト
  - `frontend/tests/e2e/specs/newspaper/save-newspaper.spec.ts`を作成
  - 新聞設定の保存をテスト
  - **受け入れ条件:**
    - [ ] E2Eテストが実装されている
    - [ ] テストが通る
  - _Requirements: 12.4_

- [ ] 5.3.4 人気の新聞のE2Eテスト
  - `frontend/tests/e2e/specs/home/popular-newspapers.spec.ts`を作成
  - 並び替えと閲覧をテスト
  - **受け入れ条件:**
    - [ ] E2Eテストが実装されている
    - [ ] テストが通る
  - _Requirements: 12.4_

- [ ] 5.3.5 レスポンシブデザインのE2Eテスト
  - モバイル・タブレット・デスクトップでテスト
  - **受け入れ条件:**
    - [ ] E2Eテストが実装されている
    - [ ] すべてのデバイスでテストが通る
  - _Requirements: 12.4_


### 5.4 セキュリティチェックの実装

- [ ] 5.4 セキュリティチェックの実装
  - Gitleaksをインストール
  - `.gitleaks.toml`を作成
  - `scripts/security-check.sh`を作成
  - Makefileに統合
  - **受け入れ条件:**
    - [ ] Gitleaksがインストールされている
    - [ ] `make security-check`が動作する
    - [ ] 機密情報が検出される
  - _Requirements: 13.1, 13.2_

### 5.5 GitHub Actionsの設定

- [ ] 5.5 GitHub Actionsの設定
  - `.github/workflows/deploy-backend.yml`を作成
  - バックエンドのビルド&デプロイを自動化
  - **受け入れ条件:**
    - [ ] GitHub Actionsが設定されている
    - [ ] mainブランチへのプッシュで自動デプロイされる
    - [ ] テストが自動実行される
  - _Requirements: 12.8_

### 5.6 チェックポイント：統合テスト

- [ ] 5.6 チェックポイント：統合テスト
  - すべてのテストを実行
  - カバレッジを確認
  - **受け入れ条件:**
    - [ ] `make test`ですべてのテストが通る
    - [ ] E2Eテストがすべて通る
    - [ ] テストカバレッジが60%以上
    - [ ] セキュリティチェックが通る

---

## 6. 最終デプロイと動作確認

### 6.1 本番環境での動作確認

- [ ] 6.1 本番環境での動作確認
  - すべての機能を本番環境でテスト
  - パフォーマンスを測定
  - **受け入れ条件:**
    - [ ] `https://my-rss-press.com`が正常に動作する
    - [ ] 新聞生成が5秒以内に完了する
    - [ ] すべての機能が動作する
    - [ ] SSL証明書が有効
    - [ ] DNS設定が正しい
  - _Requirements: 10.1, 10.2, 10.3_

### 6.2 ドキュメントの更新

- [ ] 6.2 ドキュメントの更新
  - README.mdを更新
  - tech.mdを更新（必要に応じて）
  - structure.mdを更新（必要に応じて）
  - **受け入れ条件:**
    - [ ] README.mdが最新の情報を反映している
    - [ ] セットアップ手順が明確
    - [ ] デプロイ手順が明確
  - _Requirements: 全般_

### 6.3 最終チェックリスト

- [ ] 6.3 最終チェックリスト
  - すべての要件が満たされていることを確認
  - **受け入れ条件:**
    - [ ] すべてのタスクが完了している
    - [ ] すべてのテストが通る
    - [ ] 本番環境が正常に動作する
    - [ ] ドキュメントが最新
    - [ ] セキュリティチェックが通る
    - [ ] パフォーマンス要件を満たす

---

## 完了

すべてのタスクが完了したら、Phase 1（MVP）は完成です！🎉

次のステップ：
- Phase 2の要件定義と設計
- ユーザーフィードバックの収集
- パフォーマンスの最適化
- 追加機能の検討

