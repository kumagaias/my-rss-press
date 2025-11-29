# Technical Architecture

## Overview

MyRSSPressは、AWS上にデプロイされるサーバーレスアーキテクチャを採用したWebアプリケーションです。フロントエンドはNext.js + Amplify、バックエンドはLambda + Honoで構築されます。

## Technology Stack

### Frontend
- **Framework**: Next.js 15.x (App Router)
- **Runtime**: Node.js 24.x LTS (Active LTS) または 22.x LTS (Maintenance LTS)
- **Language**: TypeScript 5.9.x
- **Styling**: Tailwind CSS 3.x
- **Hosting**: AWS Amplify
- **State Management**: React Context
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: AWS Lambda (Node.js 24.x または 22.x)
- **Framework**: Hono 4.x
- **Language**: TypeScript 5.9.x
- **Database**: DynamoDB
- **API Gateway**: AWS API Gateway
- **Validation**: Zod 3.x

### Infrastructure
- **IaC**: Terraform 1.10.x (安定版)
- **Container Registry**: Amazon ECR
- **CI/CD**: AWS Amplify (Frontend), GitHub Actions (Backend)
- **Monitoring**: CloudWatch
- **CDN**: CloudFront

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    CloudFront (CDN)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Amplify (Next.js Hosting)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js App (SSR/SSG)                               │  │
│  │  - Pages & Components                                │  │
│  │  - Client-side Logic                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Lambda Functions (Hono)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes → Services → Repositories                    │  │
│  │  - Newspaper Management                              │  │
│  │  - RSS Feed Processing                               │  │
│  │  - AI Feed Suggestions                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      DynamoDB                                │
│  - Newspapers Table                                          │
│  - Feeds Table                                               │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture (Next.js + Amplify)

### Hosting & Deployment

- AWS Amplifyを使用してNext.jsアプリケーションをホスティング
- Amplify Hostingの自動デプロイ機能を活用
- ブランチごとに環境を分離（main → production、develop → staging）
- CloudFront CDNを活用してパフォーマンスを最適化

### Component Architecture

- 関数コンポーネントとフックを使用
- Container/Presentationalパターンに従う
- ビジネスロジックとUIコンポーネントを分離
- 各コンポーネントは単一責任の原則に従う

### State Management

- グローバルステートにはReact Contextを使用
- ローカルコンポーネントステートには`useState`を優先
- 複雑なステートロジックには`useReducer`を使用
- 状態の更新は不変性を保つ

### Performance Optimization

- 高コストな計算は`useMemo`でメモ化
- 不要な再レンダリングは`React.memo`で防止
- 子コンポーネントに渡すイベントハンドラーには`useCallback`を使用
- SSR/SSGを適切に使い分けてパフォーマンスを最適化

### API Integration

```typescript
// lib/api/newspapers.ts
export const fetchNewspapers = async (sortBy: 'popular' | 'recent') => {
  const response = await fetch(`${API_BASE_URL}/api/newspapers?sort=${sortBy}`);
  if (!response.ok) throw new Error('Failed to fetch newspapers');
  return response.json();
};
```

- バックエンドAPIとの通信には`fetch`を使用
- API呼び出しは`lib/api`ディレクトリに集約
- エラーハンドリングを適切に実装
- ローディング状態を管理
- APIレスポンスの型定義を共有

### Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_APP_ENV=production
```

- 環境変数は`NEXT_PUBLIC_`プレフィックスを使用してクライアント側で利用可能に
- 機密情報はサーバー側の環境変数として管理
- `.env.local`、`.env.development`、`.env.production`で環境ごとに設定を分離

## Backend Architecture (Lambda + Hono)

### Serverless Architecture

- AWS Lambdaを使用したサーバーレスアーキテクチャ
- Honoフレームワークを使用してAPIエンドポイントを構築
- TypeScriptで型安全なコードを記述
- 関数は単一責任の原則に従う

### Layered Architecture

```
Routes (Hono) → Services → Repositories → DynamoDB
```

1. **Routes Layer**: HTTPリクエストの受付とレスポンス
2. **Services Layer**: ビジネスロジックの実装
3. **Repositories Layer**: データアクセスの抽象化
4. **Data Layer**: DynamoDB

### Hono Best Practices

```typescript
// routes/newspapers.ts
app.post('/api/newspapers', async (c) => {
  const body = await c.req.json();
  const validated = validateNewspaperInput(body);
  const result = await newspaperService.create(validated);
  return c.json({ data: result }, 201);
});
```

- ルートハンドラーは簡潔に保ち、ビジネスロジックはservicesレイヤーに配置
- ミドルウェアを活用して横断的関心事（認証、ログ、エラーハンドリング）を処理
- バリデーションはルートレベルで実行
- レスポンスは一貫した形式で返す

### Hono Local Development

Honoはローカル開発とLambda本番環境の両方で動作します。

#### アプリケーション構造

```typescript
// backend/src/app.ts - Honoアプリケーション（共通）
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export const app = new Hono();

// ミドルウェア
app.use('*', cors());
app.use('*', logger());

// ルート
app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.post('/api/newspapers', async (c) => {
  // ... ビジネスロジック
});

// backend/src/dev.ts - ローカル開発用サーバー
import { serve } from '@hono/node-server';
import { app } from './app';

const port = process.env.PORT || 3001;

serve({
  fetch: app.fetch,
  port: Number(port),
});

console.log(`🚀 Server running at http://localhost:${port}`);

// backend/src/lambda.ts - Lambda用ハンドラー
import { app } from './app';

export const handler = app.fetch;
```

#### ローカル開発コマンド

```json
// backend/package.json
{
  "scripts": {
    "dev": "tsx watch src/dev.ts",
    "build": "tsc",
    "start": "node dist/dev.js",
    "test": "vitest"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### ローカル実行

```bash
# 開発サーバー起動（ホットリロード付き）
cd backend
npm run dev

# ブラウザまたはcurlでテスト
curl http://localhost:3001/api/health
```

#### 環境変数の管理

```typescript
// backend/src/config.ts
export const config = {
  // ローカル開発ではダミー値、本番ではAWS Secrets Manager
  bedrockRegion: process.env.BEDROCK_REGION || 'ap-northeast-1',
  dynamodbTable: process.env.DYNAMODB_TABLE || 'newspapers-local',
  isLocal: process.env.NODE_ENV !== 'production',
};

// backend/.env.local（gitignore済み）
BEDROCK_REGION=ap-northeast-1
DYNAMODB_TABLE=newspapers-local
NODE_ENV=development
```

#### ローカルでのAWSサービステスト

**DynamoDB Local:**
```bash
# DynamoDB Localを起動
docker run -p 8000:8000 amazon/dynamodb-local

# 接続設定
const dynamoClient = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  region: 'ap-northeast-1',
});
```

**Bedrock（ローカルから実際のAPIを使用）:**

Bedrockにはローカルエミュレーターがないため、ローカル開発でも実際のAWS Bedrock APIを使用します。

```typescript
// backend/src/services/bedrockService.ts
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config';

// ローカル開発でも本番でも同じクライアントを使用
const bedrockClient = new BedrockRuntimeClient({
  region: config.bedrockRegion,
  // ローカル開発時はAWS CLIの認証情報を使用
  // 本番環境ではLambdaのIAMロールを使用
});

export async function suggestFeeds(theme: string): Promise<FeedSuggestion[]> {
  const prompt = `ユーザーが「${theme}」に興味があります。関連するRSSフィードを3つ提案してください。`;
  
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  
  const response = await bedrockClient.send(command);
  // レスポンスを解析して返す
  return parseBedrockResponse(response);
}
```

**ローカル開発のセットアップ:**

1. **AWS CLIの設定:**
```bash
# AWS CLIをインストール（未インストールの場合）
brew install awscli

# AWS認証情報を設定
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region name: ap-northeast-1
# Default output format: json
```

2. **Bedrock Model Accessの有効化:**
```bash
# AWSコンソールで以下を実行：
# 1. Bedrockコンソールにアクセス
# 2. Model access → Manage model access
# 3. Claude 3.5 Haikuを有効化
```

3. **IAM権限の確認:**
ローカル開発用のIAMユーザーに以下の権限が必要：
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0"
      ]
    }
  ]
}
```

4. **環境変数の設定:**
```bash
# backend/.env.local
BEDROCK_REGION=ap-northeast-1
AWS_PROFILE=default  # 複数のAWSプロファイルを使用する場合
```

**コスト管理:**

ローカル開発でBedrockを使用する際のコスト管理：

```typescript
// backend/src/config.ts
export const config = {
  bedrockRegion: process.env.BEDROCK_REGION || 'ap-northeast-1',
  isLocal: process.env.NODE_ENV !== 'production',
  
  // ローカル開発時はキャッシュを有効化してコストを削減
  enableCache: process.env.ENABLE_BEDROCK_CACHE !== 'false',
};

// backend/src/services/bedrockService.ts
const cache = new Map<string, FeedSuggestion[]>();

export async function suggestFeeds(theme: string): Promise<FeedSuggestion[]> {
  // ローカル開発時はキャッシュを使用
  if (config.isLocal && config.enableCache) {
    const cached = cache.get(theme);
    if (cached) {
      console.log('Using cached Bedrock response');
      return cached;
    }
  }
  
  // Bedrock APIを呼び出し
  const result = await callBedrockAPI(theme);
  
  // キャッシュに保存
  if (config.isLocal && config.enableCache) {
    cache.set(theme, result);
  }
  
  return result;
}
```

**モックモード（オプション）:**

Bedrock APIの呼び出しを完全に避けたい場合：

```typescript
// backend/.env.local
USE_BEDROCK_MOCK=true

// backend/src/services/bedrockService.ts
export async function suggestFeeds(theme: string): Promise<FeedSuggestion[]> {
  // モックモードが有効な場合
  if (process.env.USE_BEDROCK_MOCK === 'true') {
    console.log('Using mock Bedrock response');
    return [
      {
        url: 'https://news.ycombinator.com/rss',
        title: 'Hacker News',
        reasoning: `${theme}に関連する技術ニュース`,
      },
      {
        url: 'https://techcrunch.com/feed/',
        title: 'TechCrunch',
        reasoning: `${theme}のスタートアップニュース`,
      },
    ];
  }
  
  // 実際のBedrock APIを呼び出し
  return await callBedrockAPI(theme);
}
```

**推奨アプローチ:**

1. **通常の開発**: 実際のBedrock APIを使用（キャッシュ有効）
2. **オフライン開発**: モックモードを使用
3. **テスト**: モックを使用してコストを削減

#### デバッグ

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

### Lambda Function Design

```typescript
// handlers/api.ts
export const handler = async (event: APIGatewayProxyEvent) => {
  const app = new Hono();
  setupRoutes(app);
  return await app.fetch(new Request(event));
};
```

- 各Lambda関数は単一の責任を持つ
- コールドスタート時間を最小化するため、依存関係を最小限に保つ
- 環境変数を使用して設定を管理
- Lambda関数のハンドラーは薄く保ち、ロジックはservicesに委譲

### Error Handling

```typescript
class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// エラーハンドリングミドルウェア
app.onError((err, c) => {
  const statusCode = err.statusCode || 500;
  return c.json({ error: err.message }, statusCode);
});
```

- カスタムエラークラスを定義して使用
- エラーは適切なHTTPステータスコードとともに返す
- エラーメッセージは多言語対応
- 本番環境では詳細なエラー情報を隠蔽

### API Design

```typescript
// 成功レスポンス
{
  "data": { ... },
  "meta": { "timestamp": "2025-11-28T..." }
}

// エラーレスポンス
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

- RESTful APIの原則に従う
- エンドポイントは名詞を使用し、動詞は避ける
- バージョニングを考慮（例：`/api/v1/newspapers`）
- ページネーションをサポート
- レスポンスは一貫した構造を持つ

### Validation

```typescript
import { z } from 'zod';

const NewspaperSchema = z.object({
  name: z.string().min(1).max(100),
  feedUrls: z.array(z.string().url()).min(1),
  isPublic: z.boolean().optional(),
});

type NewspaperInput = z.infer<typeof NewspaperSchema>;
```

- 入力データは必ずバリデーション
- Zodなどのバリデーションライブラリを使用
- バリデーションエラーは明確なメッセージとともに返す

## Data Architecture

### DynamoDB Design

#### Newspapers Table

```
PK: NEWSPAPER#{newspaperId}
SK: METADATA
Attributes:
  - newspaperId: string
  - name: string
  - userName: string
  - feedUrls: string[]
  - createdAt: string (ISO 8601)
  - updatedAt: string (ISO 8601)
  - viewCount: number
  - isPublic: boolean
```

#### GSI: PublicNewspapers

```
PK: PUBLIC
SK: VIEWS#{viewCount}#{newspaperId}
Purpose: 人気順での新聞取得
```

#### GSI: RecentNewspapers

```
PK: PUBLIC
SK: CREATED#{createdAt}#{newspaperId}
Purpose: 新着順での新聞取得
```

### Access Patterns

1. 新聞IDで取得: `GetItem(PK=NEWSPAPER#{id}, SK=METADATA)`
2. 人気順で公開新聞を取得: `Query(GSI=PublicNewspapers, PK=PUBLIC, SK begins_with VIEWS#)`
3. 新着順で公開新聞を取得: `Query(GSI=RecentNewspapers, PK=PUBLIC, SK begins_with CREATED#)`

## Security

### Frontend Security

- 環境変数で機密情報を管理
- XSS対策（Reactのデフォルト保護）
- CSRF対策（SameSite Cookie）
- Content Security Policy (CSP)の設定

### Backend Security

- 環境変数に機密情報を保存し、コードにハードコードしない
- AWS Secrets Managerを使用して機密情報を管理
- CORSを適切に設定
- レート制限を実装
- 入力データをサニタイズ
- IAMロールで最小権限の原則を適用

## Monitoring & Logging

### Logging

```typescript
const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error?.message,
      stack: error?.stack,
      ...meta 
    }));
  },
};
```

- 構造化ログを使用（JSON形式）
- CloudWatch Logsにログを出力
- エラーと警告を適切にログに記録
- パフォーマンスメトリクスを記録

### Monitoring

- CloudWatch Metricsでパフォーマンス監視
- CloudWatch Alarmsでアラート設定
- X-Rayでトレーシング
- Lambda Insightsで詳細なメトリクス取得

## Performance Optimization

### Frontend

- SSR/SSGを適切に使い分け
- 画像最適化（Next.js Image）
- コード分割（Dynamic Import）
- CloudFront CDNでキャッシュ

### Backend

- Lambda関数のウォームアップ
- DynamoDBクエリの最適化
- 並列処理の活用（Promise.all）
- ElastiCacheでキャッシュ（将来の拡張）

## Testing Strategy

### Frontend Testing

- **Unit Tests**: Jest/Vitest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright
- **Coverage Target**: 60%以上

#### E2E Testing with Playwright

**テストフレームワーク**: Playwright 1.40.x以上

**テスト構成:**
```
frontend/tests/e2e/
├── fixtures/              # テストフィクスチャ
│   ├── auth.ts           # 認証関連のフィクスチャ
│   └── test-data.ts      # テストデータ
├── pages/                 # Page Object Model
│   ├── HomePage.ts
│   ├── NewspaperPage.ts
│   └── FeedSelectorPage.ts
├── specs/                 # テストスペック（機能別）
│   ├── newspaper/
│   │   ├── create-newspaper.spec.ts
│   │   ├── view-newspaper.spec.ts
│   │   └── share-newspaper.spec.ts
│   ├── feed/
│   │   ├── select-feeds.spec.ts
│   │   └── suggest-feeds.spec.ts
│   └── home/
│       ├── popular-newspapers.spec.ts
│       └── recent-newspapers.spec.ts
├── utils/                 # ヘルパー関数
│   ├── api-helpers.ts
│   └── test-helpers.ts
└── setup/                 # セットアップファイル
    ├── global-setup.ts
    └── global-teardown.ts
```

**Page Object Model (POM):**
```typescript
// tests/e2e/pages/HomePage.ts
import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly popularNewspapers: Locator;
  readonly recentNewspapers: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: /新聞を作成/i });
    this.popularNewspapers = page.getByTestId('popular-newspapers');
    this.recentNewspapers = page.getByTestId('recent-newspapers');
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickCreateNewspaper() {
    await this.createButton.click();
  }

  async getPopularNewspaperCount() {
    return await this.popularNewspapers.locator('article').count();
  }
}
```

**テストスペック例:**
```typescript
// tests/e2e/specs/newspaper/create-newspaper.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { FeedSelectorPage } from '../../pages/FeedSelectorPage';
import { NewspaperPage } from '../../pages/NewspaperPage';

test.describe('新聞作成フロー', () => {
  test('テーマからフィードを選択して新聞を作成できる', async ({ page }) => {
    const homePage = new HomePage(page);
    const feedSelector = new FeedSelectorPage(page);
    const newspaperPage = new NewspaperPage(page);

    await homePage.goto();
    await homePage.clickCreateNewspaper();
    await feedSelector.enterTheme('テクノロジー');
    await feedSelector.clickSuggestFeeds();
    await expect(feedSelector.suggestedFeeds).toBeVisible();
    await feedSelector.selectFeed(0);
    await feedSelector.selectFeed(1);
    await feedSelector.clickGenerate();
    await expect(newspaperPage.newspaperTitle).toBeVisible();
    await expect(newspaperPage.articles).toHaveCount(10, { timeout: 10000 });
  });
});
```

**Playwright設定:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**実行コマンド:**
```json
// package.json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

**ベストプラクティス:**
- Page Object Modelで再利用性を高める
- 機能ごとにテストスペックを整理
- テストデータはフィクスチャで管理
- CI環境ではリトライを有効化
- スクリーンショットとトレースで問題を診断
- 複数ブラウザでテストを実行

### Backend Testing

- **Unit Tests**: Jest/Vitest
- **Integration Tests**: Supertest + Hono
- **Mock**: AWS SDK Mock
- **Coverage Target**: 60%以上

## Deployment

### CI/CD Strategy

**インフラ（Terraform）**: ローカルから手動デプロイ
**フロントエンド**: AWS Amplify（自動デプロイ）
**バックエンド**: GitHub Actions + ECR + Lambda

### Infrastructure Deployment (Terraform)

**デプロイ方法:**
ローカル環境から`terraform apply`を実行

**ディレクトリ構造:**
```
infra/
├── environments/
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
└── modules/
    ├── ecr/              # ECRリポジトリ
    ├── lambda/           # Lambda関数（ECRイメージ使用）
    ├── api-gateway/      # API Gateway
    ├── dynamodb/         # DynamoDB
    └── amplify/          # Amplify Hosting
```

**デプロイコマンド:**
```bash
cd infra/environments/production

# 初回のみ
terraform init

# 変更内容を確認
terraform plan

# デプロイ実行
terraform apply

# 出力確認
terraform output
```

**Terraform設定例:**
```hcl
# infra/modules/lambda/main.tf
resource "aws_lambda_function" "api" {
  function_name = "myrsspress-api"
  role          = aws_iam_role.lambda_exec.arn
  
  # ECRイメージを使用
  package_type  = "Image"
  image_uri     = "${var.ecr_repository_url}:${var.image_tag}"
  
  timeout       = 30
  memory_size   = 512
  
  environment {
    variables = {
      BEDROCK_REGION  = "ap-northeast-1"
      DYNAMODB_TABLE  = var.dynamodb_table_name
    }
  }
}
```

### Frontend Deployment

**自動デプロイフロー:**
1. コードをGitHubの`main`ブランチにプッシュ
2. AWS Amplifyが自動的に検知
3. ビルド実行（Next.js）
4. CloudFrontでキャッシュ配信
5. デプロイ完了通知

**設定:**
- `amplify.yml`でビルド設定を定義
- 環境変数はAmplifyコンソールで管理
- プレビュー環境は自動的に作成（PRごと）

### Backend Deployment

**GitHub Actions + ECR + Lambda**

#### デプロイフロー

```
GitHub Push (main) 
  ↓
GitHub Actions トリガー
  ↓
1. テスト実行（make test）
  ↓
2. セキュリティチェック
  ↓
3. Dockerイメージビルド
  ↓
4. ECRにプッシュ
  ↓
5. Lambda関数を更新（新しいイメージを使用）
```

#### Dockerfile

```dockerfile
# backend/Dockerfile
FROM public.ecr.aws/lambda/nodejs:20

# 依存関係をコピー
COPY package*.json ./
RUN npm ci --production

# アプリケーションコードをコピー
COPY dist/ ./

# Lambda関数ハンドラーを指定
CMD ["lambda.handler"]
```

#### GitHub Actions設定

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend to Lambda

on:
  push:
    branches: [main]
    paths: ['backend/**']

env:
  AWS_REGION: ap-northeast-1
  ECR_REPOSITORY: myrsspress-backend

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: make test
      
      - name: Build TypeScript
        run: cd backend && npm run build
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
      
      - name: Update Lambda function
        env:
          IMAGE_URI: ${{ steps.build-image.outputs.image }}
        run: |
          aws lambda update-function-code \
            --function-name myrsspress-api \
            --image-uri $IMAGE_URI
          
          # 更新完了を待機
          aws lambda wait function-updated \
            --function-name myrsspress-api
      
      - name: Verify deployment
        run: |
          # Lambda関数の状態を確認
          aws lambda get-function \
            --function-name myrsspress-api \
            --query 'Configuration.[State,LastUpdateStatus]' \
            --output text
```

#### package.json設定

```json
// backend/package.json
{
  "scripts": {
    "dev": "tsx watch src/dev.ts",
    "build": "tsc",
    "test": "vitest run",
    "docker:build": "docker build -t myrsspress-backend .",
    "docker:run": "docker run -p 9000:8080 myrsspress-backend"
  }
}
```

#### ローカルでのDockerテスト

```bash
# Dockerイメージをビルド
cd backend
npm run build
docker build -t myrsspress-backend .

# ローカルでLambdaをテスト
docker run -p 9000:8080 myrsspress-backend

# 別のターミナルでテスト
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"path": "/api/health", "httpMethod": "GET"}'
```

### Environment Strategy

**現在（本番環境のみ）:**
- **Production**: mainブランチ → production環境
- 環境ごとに独立したリソース
- 環境変数で設定を分離

**将来（複数環境）:**
- **Development**: developブランチ → development環境
- **Staging**: stagingブランチ → staging環境
- **Production**: mainブランチ → production環境

### Secrets Management

**GitHub Secrets（必須）:**
- `AWS_ACCESS_KEY_ID` - AWSアクセスキーID
- `AWS_SECRET_ACCESS_KEY` - AWSシークレットアクセスキー

**設定方法:**
1. GitHubリポジトリの Settings → Secrets and variables → Actions
2. New repository secret をクリック
3. 上記のシークレットを追加

**AWS IAM権限:**
GitHub Actionsに必要な権限：
- ECR（イメージのプッシュ）
- Lambda（関数コードの更新）
- CloudWatch Logs（ログの読み取り）

**Terraform用IAM権限:**
ローカルからのTerraform実行に必要な権限：
- Lambda（作成・更新・削除）
- API Gateway（作成・更新・削除）
- DynamoDB（作成・更新・削除）
- ECR（リポジトリ作成・管理）
- IAM（ロール作成）
- S3（Terraformステート保存）

### Deployment Best Practices

1. **テストを必ず実行**: デプロイ前に`make test`を実行
2. **インフラ変更の確認**: `terraform plan`で変更内容を確認
3. **段階的デプロイ**: 重要な変更は段階的にデプロイ
4. **イメージタグ管理**: GitコミットSHAをイメージタグとして使用
5. **ロールバック準備**: 前のイメージタグに戻せるようにする
6. **モニタリング**: CloudWatch Logsでデプロイ後の動作を確認
7. **通知設定**: デプロイ成功/失敗をSlackなどに通知

### Rollback Strategy

**バックエンドのロールバック:**
```bash
# 前のイメージタグを確認
aws ecr describe-images \
  --repository-name myrsspress-backend \
  --query 'sort_by(imageDetails,& imagePushedAt)[-5:]'

# 特定のイメージタグに戻す
aws lambda update-function-code \
  --function-name myrsspress-api \
  --image-uri <ECR_REGISTRY>/myrsspress-backend:<PREVIOUS_TAG>
```

**インフラのロールバック:**
```bash
cd infra/environments/production

# 前の状態に戻す
terraform apply -target=<resource>

# または、Terraformステートから復元
terraform state pull > backup.tfstate
```

## Internationalization (i18n)

### Implementation Strategy

- アプリケーションは日本語と英語の両方をサポート
- すべてのユーザー向けテキストは翻訳ファイルで管理
- UIテキストをハードコードせず、必ず翻訳キーを使用
- ブラウザの言語設定に基づいて自動的に言語を検出

### Translation File Structure

```typescript
// lib/i18n.ts
export type Locale = 'en' | 'ja';

export const translations = {
  en: {
    appName: 'MyRSSPress',
    appTagline: 'Your Personalized Morning Digest, Curated by AI',
    // ... more translations
  },
  ja: {
    appName: 'MyRSSPress',
    appTagline: 'AIがキュレートする、あなた専用の朝刊',
    // ... more translations
  },
};

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}

export function useTranslations(locale: Locale) {
  return translations[locale];
}
```

### Usage in Components

```typescript
import { useTranslations } from '@/lib/i18n';

export default function MyComponent({ locale }: { locale: Locale }) {
  const t = useTranslations(locale);
  
  return (
    <div>
      <h1>{t.appName}</h1>
      <p>{t.appTagline}</p>
    </div>
  );
}
```

### Locale-Specific Formatting

- 日付、数値、通貨などのフォーマットは選択された言語のロケールに従う
- `toLocaleDateString()`、`toLocaleString()`を活用

```typescript
const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US';
const formattedDate = new Date().toLocaleDateString(dateLocale, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
```

### Translation Management Rules

- 各言語の翻訳は同じキー構造を維持すること
- 新しいUIテキストを追加する際は、必ず両言語の翻訳を同時に追加すること
- 翻訳キーは説明的な名前を使用すること（例：`buttonSubmit`ではなく`generateNewspaper`）

## TypeScript/JavaScript Conventions

### 命名規則

- 変数と関数にはcamelCaseを使用すること（例：`userName`, `fetchData`）
- クラスとReactコンポーネントにはPascalCaseを使用すること（例：`UserProfile`, `NewspaperCard`）
- 定数にはUPPER_SNAKE_CASEを使用すること（例：`MAX_RETRY_COUNT`, `API_BASE_URL`）
- ブール値の変数には`is`, `has`, `should`などのプレフィックスを使用すること（例：`isLoading`, `hasError`）
- イベントハンドラーには`handle`プレフィックスを使用すること（例：`handleClick`, `handleSubmit`）

### ファイル構造

- 1ファイルにつき1コンポーネントを配置すること
- 関連するコンポーネントはフォルダーにまとめること
- エクスポートにはindex.tsファイルを使用すること
- ファイル名はコンポーネント名と一致させること（例：`UserProfile.tsx`）
- テストファイルは同じディレクトリに配置し、`.test.ts`または`.spec.ts`の拡張子を使用すること

### TypeScriptのベストプラクティス

- パブリックAPIにはtypeよりもinterfaceを優先すること
- エクスポートされる関数には明示的な戻り値の型を指定すること
- `any`型の使用を避けること（やむを得ない場合は`unknown`を検討）
- 型アサーション（`as`）は最小限に抑えること
- ユニオン型とインターセクション型を適切に使用すること
- ジェネリクスを活用して再利用可能な型を作成すること
- `null`と`undefined`を明確に区別すること
- オプショナルチェイニング（`?.`）とnullish coalescing（`??`）を活用すること

### コーディングスタイル

- セミコロンを使用すること
- シングルクォート（`'`）を優先すること（JSX内ではダブルクォート）
- インデントは2スペースを使用すること
- 行の長さは100文字以内を目安とすること
- アロー関数を優先すること（`function`キーワードは特別な理由がある場合のみ）
- 分割代入を積極的に使用すること
- テンプレートリテラルを使用して文字列を構築すること

### Import/Export

- 名前付きエクスポートを優先すること（デフォルトエクスポートは最小限に）
- インポートは以下の順序でグループ化すること：
  1. 外部ライブラリ（React、Next.js等）
  2. 内部モジュール（`@/`から始まるパス）
  3. 相対パス（`./`、`../`）
  4. 型のみのインポート（`import type`）
- 未使用のインポートは削除すること

## Code Organization

### File Size Limits

- 各ファイルは300行以内に収めること
- 超える場合は複数ファイルに分割すること
- ファイル分割時は関心の分離を明確に保つこと

### Component Splitting Example

```typescript
// ❌ Bad: 1つの大きなコンポーネント (500行)
export default function NewspaperPage() {
  // すべてのロジックとUIが1つのファイルに...
}

// ✅ Good: 複数の小さなコンポーネントに分割
// NewspaperPage.tsx (100行)
export default function NewspaperPage() {
  return (
    <>
      <NewspaperHeader />
      <NewspaperContent />
      <NewspaperFooter />
    </>
  );
}

// NewspaperHeader.tsx (50行)
// NewspaperContent.tsx (150行)
// NewspaperFooter.tsx (50行)
```

### Separation of Concerns

- **Presentation Components**: UIのみを担当
- **Container Components**: ロジックとデータ取得を担当
- **Hooks**: 再利用可能なロジックを抽出
- **Utils**: 汎用的なヘルパー関数

## Scalability Considerations

### Current Architecture

- Lambda: 自動スケーリング
- DynamoDB: オンデマンドキャパシティ
- CloudFront: グローバルCDN
- Amplify: 自動スケーリング

### Future Enhancements

- ElastiCacheでキャッシュ層追加
- SQSで非同期処理
- Step Functionsで複雑なワークフロー
- Aurora Serverlessでリレーショナルデータ（必要に応じて）
