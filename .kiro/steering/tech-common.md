# 技術ベストプラクティス（汎用）

このドキュメントは、Next.js/React/TypeScript/AWSプロジェクトで再利用可能な汎用的なベストプラクティスを記載しています。

**適用プロジェクト:**
- Next.js + TypeScript
- AWS Serverless (Lambda, DynamoDB等)
- React コンポーネント開発

**プロジェクト固有の情報:**
- MyRSSPress固有の実装詳細は [tech.md](./tech.md) を参照

---

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

### テストとドキュメントでの固有サービス名の使用禁止

**原則**: テストコード、仕様書、設計書、ドキュメントでは実在するサービス名を使用しないこと

**理由**:
1. 商標権の侵害リスクを避ける
2. サービスの仕様変更や終了の影響を受けない
3. 汎用的で理解しやすいコードを保つ
4. 特定のサービスへの依存を示唆しない

**禁止例**:
- ❌ TechCrunch, Hacker News, Reddit, Twitter/X
- ❌ Google, Facebook, Amazon（サービス名として）
- ❌ その他の実在するWebサービス、企業名、製品名

**推奨する代替名**:
```typescript
// ❌ Bad: 実在のサービス名
const mockFeeds = [
  { url: 'https://techcrunch.com/feed/', title: 'TechCrunch', reasoning: 'Tech news' },
  { url: 'https://news.ycombinator.com/rss', title: 'Hacker News', reasoning: 'Tech community' },
];

// ✅ Good: 汎用的な名前
const mockFeeds = [
  { url: 'https://example.com/tech-feed', title: 'Tech News Feed', reasoning: 'Technology news' },
  { url: 'https://example.com/community-feed', title: 'Tech Community Feed', reasoning: 'Community discussions' },
];

// ✅ Good: より説明的な名前
const mockFeeds = [
  { url: 'https://example.com/feed1', title: 'Sample Tech Blog', reasoning: 'Technology articles' },
  { url: 'https://example.com/feed2', title: 'Sample News Site', reasoning: 'General news' },
];
```

**適用範囲**:
- ユニットテスト（`*.test.ts`, `*.spec.ts`）
- E2Eテスト（Playwright等）
- 仕様書（`.kiro/specs/`）
- 設計書（`design.md`, `requirements.md`）
- ドキュメント（`README.md`, `docs/`）
- コード内のコメント例

**例外**:
- 本番コードで実際にそのサービスのAPIを使用する場合（例：AWS SDK、Bedrock API）
- 統合テストで実際のサービスに接続する場合（明示的にマークすること）
- ユーザー向けドキュメントで具体例として説明する場合（「例：」と明記すること）

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

## Testing Strategy

### Frontend Testing

- **Unit Tests**: Jest/Vitest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright
- **Coverage Target**: 60%以上

### Backend Testing

- **Unit Tests**: Jest/Vitest
- **Integration Tests**: Supertest + Hono
- **Mock**: AWS SDK Mock
- **Coverage Target**: 60%以上

### Property-Based Testing

**原則**: 例ベースのテストに加えて、プロパティベーステストを使用すること

**ライブラリ**: `fast-check`

**プロパティの例**:
- **完全性**: すべての入力が出力に含まれる
- **順序性**: ソート結果が正しい順序である
- **不変性**: 元のデータが変更されない
- **べき等性**: 同じ入力で同じ出力が得られる

**実装例**:
```typescript
import * as fc from 'fast-check';

it('Property: All items must be included (Completeness)', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
      (items) => {
        const result = processItems(items);
        return result.length === items.length;
      }
    ),
    { numRuns: 100 }
  );
});
```

## Code Quality & Linting

### ESLint Configuration

**原則**: すべてのプロジェクトでESLintを使用してコード品質を保つこと

**フロントエンド (Next.js)**:
```json
// frontend/.eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:storybook/recommended"
  ],
  "rules": {
    "@next/next/no-html-link-for-pages": "off",
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "off",
    "storybook/no-renderer-packages": "off"
  }
}
```

**バックエンド (Node.js + TypeScript)**:
```json
// backend/.eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": "off"
  },
  "env": {
    "node": true,
    "es2022": true
  },
  "ignorePatterns": ["dist", "node_modules", "tests"]
}
```

**実行方法**:
```bash
# 個別実行
cd frontend && npm run lint
cd backend && npm run lint

# Makefileから実行（推奨）
make test-lint

# すべてのテストを実行（ユニット + ESLint + セキュリティ + 脆弱性）
make test
```

**ベストプラクティス**:
- コミット前に必ずESLintを実行すること
- 警告は可能な限り修正すること
- `any`型の使用は最小限に抑えること
- 未使用変数は削除すること
- CI/CDパイプラインでESLintを実行すること

## Security

### General Security Practices

- 環境変数で機密情報を管理
- 機密情報をコードにハードコードしない
- CORSを適切に設定
- レート制限を実装
- 入力データをサニタイズ
- 最小権限の原則を適用

### Frontend Security

- XSS対策（Reactのデフォルト保護）
- CSRF対策（SameSite Cookie）
- Content Security Policy (CSP)の設定

### Backend Security

- 環境変数に機密情報を保存
- Secrets Managerを使用して機密情報を管理
- IAMロールで最小権限の原則を適用

### Dependency Security (npm脆弱性チェック)

**概要:**

npm依存関係の脆弱性を自動的にチェックし、Medium以上の深刻度の脆弱性が見つかった場合はプッシュを防止します。

**チェックツール:**
- `npm audit` - npm公式の脆弱性チェックツール
- 深刻度レベル: Critical, High, Moderate, Low

**自動チェックのタイミング:**
1. **pre-pushフック**: `git push`実行時に自動チェック（オプション）
2. **手動実行**: `make test-vulnerabilities`または`make audit`

**深刻度の対応方針:**
- **Critical/High/Moderate**: プッシュをブロック、即座に修正が必要
- **Low**: 警告のみ、プッシュは許可（定期的に修正を検討）

**実行方法:**

```bash
# 手動で脆弱性チェック
make test-vulnerabilities
# または
make audit

# すべてのテスト（ユニット + セキュリティ + 脆弱性）
make test
```

**脆弱性が見つかった場合の対応:**

```bash
# 1. 該当ディレクトリに移動
cd frontend  # または backend

# 2. 脆弱性の詳細を確認
npm audit

# 3. 自動修正を試みる（非破壊的）
npm audit fix

# 4. 自動修正できない場合は破壊的変更を含む修正
npm audit fix --force

# 5. package-lock.jsonをコミット
git add package-lock.json
git commit -m "fix: Update dependencies to fix vulnerabilities"
```

**ベストプラクティス:**
1. 定期的に`npm audit`を実行して脆弱性を確認
2. 依存関係の更新は慎重に行い、テストを実行
3. `npm audit fix --force`は破壊的変更を含むため、実行後は必ずテスト
4. 修正できない脆弱性は、代替パッケージの検討またはissue報告
5. CI/CDパイプラインでも脆弱性チェックを実行

**修正できない脆弱性の対応:**

依存関係の競合などで即座に修正できない脆弱性がある場合：

1. **影響範囲を評価**: 開発環境のみか、本番環境にも影響するか
2. **GitHub Issueを作成**: 脆弱性の詳細と修正計画を記録
3. **一時的な回避策**: 
   - 開発環境のみの脆弱性の場合、本番ビルドに影響しないことを確認
   - 本番環境に影響する場合は、代替パッケージの検討または緊急対応
4. **定期的な再評価**: 依存関係の更新時に再度修正を試みる

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
- エラーと警告を適切にログに記録
- パフォーマンスメトリクスを記録

### Monitoring

- メトリクスでパフォーマンス監視
- アラームでアラート設定
- トレーシングで詳細な追跡
- 詳細なメトリクス取得

## Performance Optimization

### Frontend

- SSR/SSGを適切に使い分け
- 画像最適化（Next.js Image）
- コード分割（Dynamic Import）
- CDNでキャッシュ

### Backend

- 関数のウォームアップ
- クエリの最適化
- 並列処理の活用（Promise.all）
- キャッシュの活用

## Deployment Best Practices

1. **プッシュ前にプル**: `git push`前に必ず`git pull`を実行してリモートの変更を取り込む
2. **テストを必ず実行**: デプロイ前に`make test`を実行
3. **インフラ変更の確認**: `terraform plan`で変更内容を確認
4. **段階的デプロイ**: 重要な変更は段階的にデプロイ
5. **イメージタグ管理**: GitコミットSHAをイメージタグとして使用
6. **ロールバック準備**: 前のイメージタグに戻せるようにする
7. **モニタリング**: ログでデプロイ後の動作を確認
8. **通知設定**: デプロイ成功/失敗をSlackなどに通知

**プッシュの正しい手順:**
```bash
# 1. 変更をコミット
git add .
git commit -m "feat: Add new feature"

# 2. リモートの変更を取り込む（重要！）
git pull origin feat/your-branch

# 3. コンフリクトがあれば解決
# （コンフリクトがある場合は手動で解決してコミット）

# 4. プッシュ
git push origin feat/your-branch
```

## Prohibited Practices (禁止事項)

このセクションでは、プロジェクトで絶対に行ってはいけない開発プラクティスを定義します。

### Code Quality

**❌ 禁止: TypeScriptの`any`型の多用**
- `any`型は最小限に抑えること
- やむを得ない場合は`unknown`を検討すること

**❌ 禁止: エラーハンドリングの省略**
- すべての非同期処理にエラーハンドリングを実装すること
- try-catchまたは.catch()を必ず使用すること

**❌ 禁止: コンソールログの本番環境への残置**
- `console.log()`は開発時のみ使用すること
- 本番環境では構造化ログ（JSON形式）を使用すること

### Internationalization (i18n)

**❌ 禁止: コンポーネント内で翻訳を直接分岐すること**
- `locale === 'ja' ? '日本語' : 'English'`のような直接分岐は禁止
- 必ず`lib/i18n.ts`の翻訳ファイルを使用すること
- `useTranslations(locale)`を使って翻訳を取得すること

**悪い例:**
```typescript
// ❌ Bad: 直接分岐
const buttonText = locale === 'ja' ? '保存' : 'Save';
const placeholder = locale === 'ja' 
  ? 'テーマを入力してください'
  : 'Enter your theme';
```

**良い例:**
```typescript
// ✅ Good: i18nファイルを使用
import { useTranslations } from '@/lib/i18n';

const t = useTranslations(locale);
const buttonText = t.save;
const placeholder = t.themeInputPlaceholder;
```

**理由:**
- 翻訳の一元管理が可能
- 翻訳の追加・変更が容易
- コードの可読性が向上
- 翻訳漏れを防止
- 将来的な多言語対応が容易

### Git Workflow

**❌ 禁止: mainブランチへの直接コミット**
- 必ずfeatureブランチを作成してPRを経由すること
- 例外: 緊急のホットフィックスのみ

**❌ 禁止: 大きすぎるPR**
- 1つのPRは500行以内を目安とすること
- 大きな変更は複数のPRに分割すること

### Performance

**❌ 禁止: 無制限のデータ取得**
- クエリには必ずLimitを設定すること
- ページネーションを実装すること

**❌ 禁止: 同期的な大量API呼び出し**
- 複数のAPI呼び出しは`Promise.all()`で並列化すること
- レート制限を考慮すること

---

これらの禁止事項に違反した場合、システムの安定性、セキュリティ、保守性に重大な影響を与える可能性があります。必ず遵守してください。


## Bug Fix Workflow

バグを発見した場合、以下のワークフローに従って修正すること。

### 1. Issue作成

バグを発見したら、まずGitHub Issueを作成する：

```markdown
## Description
バグの詳細な説明

## Steps to Reproduce
1. 手順1
2. 手順2
3. 手順3

## Expected Behavior
期待される動作

## Current Behavior
現在の動作

## Technical Details
- Location: ファイルパスと行番号
- Suspected Cause: 疑わしい原因

## Investigation Needed
調査が必要な項目のリスト

## Priority
High/Medium/Low
```

**Issueのラベル:**
- `bug`: バグ修正
- 影響範囲に応じて: `frontend`, `backend`, `database`, `infrastructure`

### 2. ブランチ作成

Issue番号を含むブランチを作成：

```bash
git checkout -b fix/issue-{番号}-{短い説明}

# 例
git checkout -b fix/issue-13-saved-newspapers-no-articles
```

### 3. 問題の調査

**調査手順:**

1. **再現確認**: バグを実際に再現できるか確認
2. **コードレビュー**: 関連するコードを読んで原因を特定
3. **ログ確認**: エラーログやコンソール出力を確認
4. **データ確認**: データベースやAPIレスポンスを確認

**調査のポイント:**
- フロントエンドとバックエンドの両方を確認
- データの流れを追跡（UI → API → Service → Database）
- 型定義とインターフェースの不一致を確認
- 戻り値に必要なフィールドが含まれているか確認

### 4. 修正実装

**修正の原則:**
- **最小限の変更**: 問題を解決する最小限のコードのみ変更
- **影響範囲の確認**: 変更が他の機能に影響しないか確認
- **型安全性**: TypeScriptの型チェックを活用
- **テスト**: 既存のテストが通ることを確認

**修正例（Issue #13の場合）:**

```typescript
// ❌ Bad: articlesフィールドが欠落
return result.Items.map(item => ({
  newspaperId: item.newspaperId,
  name: item.name,
  // ... articles が含まれていない
}));

// ✅ Good: articlesフィールドを追加
return result.Items.map(item => ({
  newspaperId: item.newspaperId,
  name: item.name,
  articles: item.articles, // 追加
  // ...
}));
```

### 5. テスト実行

修正後、必ずテストを実行：

```bash
# ユニットテスト
make test-unit

# 全テスト
make test

# 手動テスト
# 1. バグの再現手順を実行
# 2. 修正が機能することを確認
# 3. 他の機能に影響がないことを確認
```

### 6. コミットとプッシュ

**コミットメッセージの形式:**

```
fix: {簡潔な説明}

- 変更内容1
- 変更内容2
- 根本原因の説明

Fixes #{Issue番号}
```

**例:**
```bash
git add backend/src/services/newspaperService.ts
git commit -m "fix: Include articles in getPublicNewspapers response

- Add articles field to the response of getPublicNewspapers
- This fixes the issue where saved newspapers show 'no articles' message
- Articles were being saved but not returned when fetching public newspapers

Fixes #13"

git push origin fix/issue-13-saved-newspapers-no-articles
```

### 7. Pull Request作成

**PRの内容:**

```markdown
## Overview
Fixes #{Issue番号} - 問題の簡潔な説明

## Problem
バグの詳細な説明

## Root Cause
根本原因の説明

## Solution
修正内容の説明

## Changes
- **Backend**: 変更したファイルと内容
- **Frontend**: 変更したファイルと内容

## Testing
- ✅ テスト項目1
- ✅ テスト項目2

## Verification Steps
修正を確認する手順

Fixes #{Issue番号}
```

### 8. レビューとマージ

1. PRを作成
2. CI/CDが通ることを確認
3. コードレビュー（必要に応じて）
4. mainブランチにマージ
5. Issueが自動的にクローズされることを確認

### バグ修正のチェックリスト

修正前に以下を確認：

- [ ] Issueを作成した
- [ ] 適切なブランチ名を使用した
- [ ] 問題の根本原因を特定した
- [ ] 最小限の変更で修正した
- [ ] テストが通ることを確認した
- [ ] 手動テストで動作確認した
- [ ] コミットメッセージに`Fixes #番号`を含めた
- [ ] PRの説明が明確である
- [ ] 他の機能に影響がないことを確認した

### よくあるバグのパターン

**1. APIレスポンスのフィールド欠落**
- 症状: フロントエンドでデータが表示されない
- 原因: バックエンドのレスポンスに必要なフィールドが含まれていない
- 修正: レスポンスマッピングにフィールドを追加

**2. 型定義の不一致**
- 症状: TypeScriptのコンパイルエラー
- 原因: インターフェースと実装が一致していない
- 修正: 型定義を更新するか、実装を修正

**3. 非同期処理のエラーハンドリング不足**
- 症状: エラーが発生してもユーザーに通知されない
- 原因: try-catchが不足している
- 修正: 適切なエラーハンドリングを追加

**4. 状態管理の問題**
- 症状: UIが更新されない、または予期しない動作
- 原因: Reactの状態更新が正しく行われていない
- 修正: useEffectの依存配列を確認、状態更新ロジックを修正

### デバッグのヒント

**フロントエンド:**
- ブラウザのDevToolsでネットワークタブを確認
- Consoleでエラーメッセージを確認
- React DevToolsで状態を確認

**バックエンド:**
- CloudWatch Logsでエラーログを確認
- ローカルで`console.log`を使ってデバッグ
- APIレスポンスをcurlやPostmanで確認

**データベース:**
- DynamoDBコンソールでデータを直接確認
- クエリ条件が正しいか確認
- GSI（Global Secondary Index）が正しく設定されているか確認
