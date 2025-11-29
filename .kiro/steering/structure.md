# Project Structure

## Overview

MyRSSPressプロジェクトは、フロントエンド（Next.js）とバックエンド（Lambda + Hono）を分離したモノレポ構造を採用します。

## Root Directory Structure

```
myrsspress/
├── frontend/              # Next.jsフロントエンドアプリケーション
├── backend/               # Lambda + Honoバックエンド
├── infra/                 # インフラストラクチャ（Terraform）
│   ├── environments/     # 環境別設定
│   │   └── production/  # 本番環境（現在）
│   └── modules/          # 再利用可能なTerraformモジュール
├── .kiro/                 # Kiro設定とspec
│   ├── specs/            # 機能仕様
│   │   ├── phase-1/     # Phase 1（MVP）
│   │   └── phase-2/     # Phase 2（拡張機能）
│   ├── steering/         # 開発ガイドライン
│   │   ├── project-standards.md  # プロジェクト標準
│   │   ├── tech.md              # 技術アーキテクチャとコーディング規約
│   │   └── structure.md         # プロジェクト構造（このファイル）
│   └── hooks/            # エージェントフック
├── scripts/              # ユーティリティスクリプト
├── Makefile              # 開発タスク
└── README.md             # プロジェクト概要
```

## Frontend Structure (Next.js + Amplify)

```
frontend/
├── app/                   # Next.js App Router
│   ├── layout.tsx        # ルートレイアウト
│   ├── page.tsx          # ホームページ
│   ├── globals.css       # グローバルスタイル
│   └── favicon.ico       # ファビコン
├── components/            # 再利用可能なコンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   ├── features/         # 機能別コンポーネント
│   └── layouts/          # レイアウトコンポーネント
├── lib/                   # ユーティリティとヘルパー
│   ├── api/              # API呼び出し
│   ├── i18n.ts           # 多言語対応
│   └── utils.ts          # 汎用ユーティリティ
├── types/                 # TypeScript型定義
│   └── index.ts          # 共通型定義
├── hooks/                 # カスタムフック
├── public/                # 静的ファイル
├── tests/                 # テストファイル
│   ├── unit/             # ユニットテスト
│   ├── integration/      # 統合テスト
│   └── e2e/              # E2Eテスト（Playwright）
│       ├── fixtures/     # テストフィクスチャ
│       ├── pages/        # Page Object Model
│       ├── specs/        # テストスペック（機能別）
│       ├── utils/        # ヘルパー関数
│       └── setup/        # セットアップファイル
├── playwright.config.ts  # Playwright設定
├── .env.local            # ローカル環境変数
├── .env.development      # 開発環境変数
├── .env.production       # 本番環境変数
├── amplify.yml           # Amplifyビルド設定
├── next.config.ts        # Next.js設定
├── tailwind.config.ts    # Tailwind CSS設定
├── tsconfig.json         # TypeScript設定
└── package.json          # 依存関係
```

### Frontend Component Organization

```
components/
├── ui/                    # 基本UIコンポーネント
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Modal.tsx
├── features/              # 機能別コンポーネント
│   ├── newspaper/
│   │   ├── NewspaperRenderer.tsx
│   │   ├── NewspaperCard.tsx
│   │   └── NewspaperSettings.tsx
│   ├── feed/
│   │   ├── FeedSelector.tsx
│   │   ├── FeedList.tsx
│   │   └── ThemeInput.tsx
│   └── home/
│       ├── UnifiedHome.tsx
│       └── PopularNewspapers.tsx
└── layouts/               # レイアウトコンポーネント
    ├── Header.tsx
    ├── Footer.tsx
    └── Container.tsx
```

## Backend Structure (Lambda + Hono)

```
backend/
├── src/
│   ├── handlers/          # Lambda関数ハンドラー
│   │   ├── api.ts        # メインAPIハンドラー
│   │   └── cron.ts       # スケジュール実行ハンドラー
│   ├── routes/            # Honoルート定義
│   │   ├── newspapers.ts # 新聞関連ルート
│   │   ├── feeds.ts      # フィード関連ルート
│   │   └── index.ts      # ルート集約
│   ├── services/          # ビジネスロジック
│   │   ├── newspaperService.ts
│   │   ├── feedService.ts
│   │   └── rssParserService.ts
│   ├── repositories/      # データアクセス層
│   │   ├── newspaperRepository.ts
│   │   └── feedRepository.ts
│   ├── models/            # データモデルと型定義
│   │   ├── newspaper.ts
│   │   ├── feed.ts
│   │   └── article.ts
│   ├── middleware/        # Honoミドルウェア
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── cors.ts
│   └── utils/             # ユーティリティ関数
│       ├── logger.ts
│       └── validation.ts
├── tests/                 # テストファイル
│   ├── unit/             # ユニットテスト
│   └── integration/      # 統合テスト
├── infrastructure/        # IaCコード
│   ├── cdk/              # AWS CDK
│   │   ├── lib/
│   │   └── bin/
│   └── sam/              # AWS SAM（代替）
├── .env.development      # 開発環境変数
├── .env.production       # 本番環境変数
├── tsconfig.json         # TypeScript設定
└── package.json          # 依存関係
```

## Infrastructure Structure (Terraform)

```
infra/
├── environments/          # 環境別設定
│   └── production/       # 本番環境
│       ├── main.tf       # メイン設定
│       ├── variables.tf  # 変数定義
│       ├── outputs.tf    # 出力定義
│       └── terraform.tfvars  # 環境固有の値
└── modules/               # 再利用可能なモジュール
    ├── amplify/          # Amplify Hosting
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── lambda/           # Lambda関数
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── api-gateway/      # API Gateway
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── dynamodb/         # DynamoDB
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── bedrock/          # Bedrock設定
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

### Infrastructure Best Practices

- 現在は本番環境（production）のみ
- 将来的にdevelopment、staging環境を追加予定
- モジュールで共通リソースを抽象化
- `terraform.tfvars`は`.gitignore`に追加（機密情報を含む場合）
- リモートバックエンド（S3 + DynamoDB）でstate管理
- 環境変数は`terraform.tfvars`で管理

## Shared Types

フロントエンドとバックエンドで共有する型定義は、以下のように管理します：

```
shared/
└── types/
    ├── newspaper.ts      # 新聞関連の型
    ├── feed.ts           # フィード関連の型
    ├── article.ts        # 記事関連の型
    └── api.ts            # APIレスポンスの型
```

または、バックエンドの型定義をフロントエンドからインポートする形式も検討できます。

## File Naming Conventions

- **コンポーネントファイル**: PascalCase（例：`NewspaperCard.tsx`）
- **ユーティリティファイル**: camelCase（例：`formatDate.ts`）
- **テストファイル**: `*.test.ts`または`*.spec.ts`
- **型定義ファイル**: camelCase（例：`newspaper.ts`）
- **設定ファイル**: kebab-case（例：`next.config.ts`）

## Import Path Aliases

TypeScriptのパスエイリアスを使用して、インポートを簡潔にします：

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"]
    }
  }
}
```

使用例：
```typescript
import { NewspaperCard } from '@/components/features/newspaper/NewspaperCard';
import { useTranslations } from '@/lib/i18n';
import type { Newspaper } from '@/types';
```

## E2E Test Structure (Playwright)

### ディレクトリ構成の詳細

```
frontend/tests/e2e/
├── fixtures/              # テストフィクスチャ
│   ├── auth.ts           # 認証関連のフィクスチャ
│   └── test-data.ts      # テストデータ（フィードURL、テーマ等）
├── pages/                 # Page Object Model
│   ├── HomePage.ts       # ホームページのPOM
│   ├── NewspaperPage.ts  # 新聞ページのPOM
│   └── FeedSelectorPage.ts  # フィード選択ページのPOM
├── specs/                 # テストスペック（機能別に整理）
│   ├── newspaper/        # 新聞機能のテスト
│   │   ├── create-newspaper.spec.ts
│   │   ├── view-newspaper.spec.ts
│   │   └── share-newspaper.spec.ts
│   ├── feed/             # フィード機能のテスト
│   │   ├── select-feeds.spec.ts
│   │   └── suggest-feeds.spec.ts
│   └── home/             # ホーム画面のテスト
│       ├── popular-newspapers.spec.ts
│       └── recent-newspapers.spec.ts
├── utils/                 # ヘルパー関数
│   ├── api-helpers.ts    # API呼び出しヘルパー
│   └── test-helpers.ts   # 汎用テストヘルパー
└── setup/                 # セットアップファイル
    ├── global-setup.ts   # グローバルセットアップ
    └── global-teardown.ts  # グローバルティアダウン
```

### ファイル命名規則

- **Page Object**: PascalCase（例：`HomePage.ts`）
- **テストスペック**: kebab-case + `.spec.ts`（例：`create-newspaper.spec.ts`）
- **フィクスチャ**: kebab-case（例：`test-data.ts`）
- **ヘルパー**: kebab-case（例：`api-helpers.ts`）

### テストの整理方針

1. **機能別にディレクトリを分割**: `specs/`配下を機能ごとに整理
2. **Page Object Modelを活用**: ページごとにPOMクラスを作成
3. **共通ロジックはヘルパーに**: 再利用可能なロジックは`utils/`に配置
4. **テストデータは外部化**: フィクスチャで管理して再利用性を高める

### ベストプラクティス

- 各テストスペックは独立して実行可能にすること
- テストの依存関係を最小限に抑えること
- Page Objectで要素のセレクタを一元管理すること
- テストデータはハードコードせず、フィクスチャから読み込むこと
- 非同期処理には適切なタイムアウトを設定すること

## Documentation Location

- **プロジェクト標準**: `.kiro/steering/project-standards.md`
- **技術アーキテクチャとコーディング規約**: `.kiro/steering/tech.md`
- **プロジェクト構造**: `.kiro/steering/structure.md`（このファイル）
- **機能仕様**: 
  - Phase 1（MVP）: `.kiro/specs/phase-1/`
  - Phase 2（拡張機能）: `.kiro/specs/phase-2/`
