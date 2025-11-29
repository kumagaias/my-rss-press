# 設計書 MVP

## 概要

MyRSSPressは、RSSフィードを視覚的に魅力的な新聞スタイルのレイアウトに変換するWebアプリケーションです。システムは、Next.jsベースのフロントエンド（Amplify Hosting）、TypeScript/HonoバックエンドAPI（Lambda）、AWS BedrockによるAIフィード提案、DynamoDBによる新聞データ保存で構成されています。アーキテクチャは、サーバーレス構成と並行フィード取得を通じて、高速な生成時間（5秒未満）とコスト効率を優先します。

アプリケーションフローは4つの主要段階に従います：
1. テーマ入力とAI駆動のフィード提案（Bedrock）
2. ユーザーによるフィード選択
3. 記事収集と重要度計算（Lambda）
4. 紙テクスチャスタイリングを使用した新聞レイアウト生成（フロントエンド）

プロジェクト構造：
- `backend/` - TypeScript/Hono APIサーバー（Lambda用）
- `frontend/` - Next.js + TailwindCSS（Amplify Hosting用）
- `infra/` - Terraform IaCコード
- `prototype/` - プロトタイプ実装（Next.js）

## アーキテクチャ

### システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│              フロントエンド (Next.js + TailwindCSS)          │
│                    [Amplify Hosting]                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 統合ホーム   │  │ 新聞         │  │ レイアウト   │      │
│  │ 画面         │→ │ レンダラー   │→ │ 計算         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │ HTTPS            │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                   [API Gateway REST]                         │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│           バックエンドAPI (TypeScript/Hono on Lambda)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Bedrock提案  │  │ RSS取得      │  │ 重要度       │      │
│  │ サービス     │  │ サービス     │  │ 計算         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   AWS Bedrock    │  │   RSSフィード    │  │  DynamoDB    │
│   (Claude 3.5    │  │   (外部)         │  │  (新聞保存)  │
│    Haiku)        │  │                  │  │              │
└──────────────────┘  └──────────────────┘  └──────────────┘
```

### 技術スタック

**フロントエンド:**
- Next.js 15.x (App Router)
- Node.js 24.x LTS (Active LTS) または 22.x LTS (Maintenance LTS)
- TypeScript 5.9.x
- TailwindCSS 3.x による紙テクスチャスタイリング
- Storybook 8.x（UIコンポーネント開発・ドキュメント）
- fetchによるAPI通信

**バックエンド:**
- AWS Lambda (Node.js 24.x または 22.x)
- Hono 4.x framework
- TypeScript 5.9.x
- AWS Bedrock Runtime API (Claude 3.5 Haiku)によるフィード提案
- RSSフィード解析ライブラリ
- Zod 3.x によるバリデーション

**データベース:**
- DynamoDB（新聞メタデータ、フィードURL保存）

**インフラ (Terraform 1.10.x):**
- AWS Amplify Hosting（フロントエンド）
- Route53（DNSホストゾーン、ドメイン: my-rss-press.com）
- API Gateway REST（APIエンドポイント）
- AWS Lambda（TypeScript/Honoバックエンド、ECRイメージ使用）
- Amazon ECR（コンテナレジストリ）
- AWS Bedrock Runtime API（Claude 3.5 Haiku）
- DynamoDB（データストレージ）
- CloudWatch Logs（ログ記録）
- CloudFront（CDN）

## デザインシステム

### カラーパレット

**プライマリカラー:**
```typescript
const colors = {
  // ブランドカラー
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',  // メインカラー
    600: '#0284c7',
    700: '#0369a1',
  },
  
  // 新聞テーマカラー
  newspaper: {
    paper: '#f5f5dc',      // 紙の色（ベージュ）
    ink: '#1a1a1a',        // インクの色（ダークグレー）
    border: '#333333',     // ボーダー
    accent: '#8b4513',     // アクセント（茶色）
  },
  
  // セマンティックカラー
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // グレースケール
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};
```

**Tailwind設定:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        newspaper: colors.newspaper,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
      },
    },
  },
};
```

### タイポグラフィ

**フォントファミリー:**
```typescript
const fonts = {
  // UI用フォント
  sans: ['Inter', 'system-ui', 'sans-serif'],
  
  // 新聞用フォント
  serif: ['Georgia', 'Times New Roman', 'serif'],
  
  // コード用フォント
  mono: ['Fira Code', 'monospace'],
};
```

**フォントサイズ:**
```typescript
const fontSize = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
};
```

### スペーシング

```typescript
const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
};
```

### UIコンポーネントライブラリ

**基本コンポーネント（`components/ui/`）:**

#### Button
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant, size, disabled, loading, children, onClick }: ButtonProps) {
  const baseStyles = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

#### Input
```typescript
// components/ui/Input.tsx
interface InputProps {
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function Input({ type = 'text', placeholder, value, onChange, error, disabled }: InputProps) {
  return (
    <div className="w-full">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-primary-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-error' : 'border-gray-300'}
        `}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
```

#### Card
```typescript
// components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
}
```

#### Checkbox
```typescript
// components/ui/Checkbox.tsx
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
      />
      <span className="text-gray-700">{label}</span>
    </label>
  );
}
```

#### Modal
```typescript
// components/ui/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

### Storybook設定

**セットアップ:**
```bash
# Storybookのインストール
npx storybook@latest init

# 依存関係
npm install --save-dev @storybook/react @storybook/addon-essentials @storybook/addon-a11y
```

**設定ファイル:**
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
};

export default config;
```

**Storybookストーリー例:**
```typescript
// components/ui/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    children: 'Secondary Button',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    loading: true,
    children: 'Loading Button',
  },
};
```

**実行コマンド:**
```json
// package.json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### デザインシステムのベストプラクティス

1. **一貫性**: すべてのUIコンポーネントは統一されたカラーパレットとスペーシングを使用
2. **再利用性**: 基本コンポーネントを組み合わせて複雑なUIを構築
3. **アクセシビリティ**: すべてのコンポーネントはWCAG 2.1 AA基準に準拠
4. **ドキュメント**: Storybookですべてのコンポーネントを文書化
5. **テスト**: 各コンポーネントにユニットテストとビジュアルリグレッションテストを実装

## コンポーネントとインターフェース

### フロントエンドコンポーネント

#### ThemeInputComponent
**目的:** ユーザーの興味トピックをキャプチャ

**Props:**
```typescript
interface ThemeInputProps {
  onSubmit: (theme: string) => void;
  isLoading: boolean;
}
```

**State:**
- `themeKeyword: string` - 現在の入力値
- `error: string | null` - 検証エラーメッセージ

**メソッド:**
- `handleSubmit()` - テーマを検証して送信
- `validateInput(input: string): boolean` - 空でない入力を保証

#### FeedSelectorComponent
**目的:** AI提案フィードを表示し、選択を許可

**Props:**
```typescript
interface FeedSelectorProps {
  suggestions: FeedSuggestion[];
  onSelectionChange: (selected: string[]) => void;
  onGenerate: () => void;
}

interface FeedSuggestion {
  url: string;
  title: string;
  reasoning: string;
}
```

**State:**
- `selectedFeeds: Set<string>` - 現在選択されているフィードURL

**メソッド:**
- `toggleFeed(url: string)` - 選択からフィードを追加/削除
- `isGenerateEnabled(): boolean` - 少なくとも1つのフィードが選択されているか確認

#### NewspaperRenderer
**目的:** 紙テクスチャを使用した新聞レイアウトで記事を表示

**Props:**
```typescript
interface NewspaperRendererProps {
  articles: Article[];
  newspaperName: string;
  userName?: string;
  createdAt: Date;
  onSave: (settings: NewspaperSettings) => void;
}

interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  imageUrl?: string;
  importance: number;
}

interface NewspaperSettings {
  newspaperName: string;
  userName: string;
  isPublic: boolean;
}
```

**State:**
- `isSaved: boolean` - 新聞が保存されているか
- `showSettingsModal: boolean` - 設定モーダルの表示状態

**メソッド:**
- `calculateLayout(articles: Article[]): LayoutGrid` - 記事の位置を決定（フロントエンドで実行）
- `handleSave(settings: NewspaperSettings): void` - 新聞設定を保存
- `renderArticle(article: Article, size: ArticleSize): JSX.Element` - 個別記事をレンダリング

**レイアウトアルゴリズム（記事数に応じて動的に変化）:**
```typescript
function calculateLayout(articles: Article[]): LayoutGrid {
  // 重要度でソート（降順）
  const sorted = [...articles].sort((a, b) => b.importance - a.importance);
  const totalArticles = sorted.length;
  
  // 記事数に応じてレイアウトを調整
  if (totalArticles <= 4) {
    // 少ない記事数（1-4記事）: すべて大きく表示
    return {
      lead: sorted[0],
      topStories: sorted.slice(1),
      remaining: [],
    };
  } else if (totalArticles <= 8) {
    // 中程度の記事数（5-8記事）: リード1 + トップ3 + 残り
    return {
      lead: sorted[0],
      topStories: sorted.slice(1, 4),
      remaining: sorted.slice(4),
    };
  } else {
    // 多い記事数（9記事以上）: リード1 + トップ4 + 残り
    return {
      lead: sorted[0],
      topStories: sorted.slice(1, 5),
      remaining: sorted.slice(5),
    };
  }
}
```

**記事数の決定（ランダム性を持たせる）:**
```typescript
function determineArticleCount(): number {
  // 8〜15記事の範囲でランダムに決定
  const min = 8;
  const max = 15;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchArticles(feedUrls: string[], theme: string): Promise<Article[]> {
  const minArticles = 8;
  const targetCount = determineArticleCount();
  
  // すべてのフィードから記事を取得
  const allArticles = await Promise.all(
    feedUrls.map(url => parseFeed(url))
  ).then(results => results.flat());
  
  // 公開日でソート（新しい順）
  const sortedByDate = allArticles.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  
  // ステップ1: 最新3日間の記事を取得
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  let recentArticles = sortedByDate.filter(
    article => new Date(article.pubDate) >= threeDaysAgo
  );
  
  // ステップ2: 最小記事数に満たない場合、7日間まで拡張
  if (recentArticles.length < minArticles) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    recentArticles = sortedByDate.filter(
      article => new Date(article.pubDate) >= sevenDaysAgo
    );
  }
  
  // ステップ3: それでも足りない場合は取得できた全記事を使用
  if (recentArticles.length < minArticles) {
    console.warn(`最小記事数（${minArticles}）に満たない: ${recentArticles.length}記事`);
    recentArticles = sortedByDate;
  }
  
  // ステップ4: 目標記事数まで選択（最新記事を優先）
  const selectedArticles = recentArticles.slice(0, Math.min(targetCount, recentArticles.length));
  
  // ステップ5: 選択された記事をランダムにシャッフル（レイアウトのバリエーション）
  const shuffled = selectedArticles.sort(() => Math.random() - 0.5);
  
  return shuffled;
}
```

**エラーハンドリング:**
```typescript
// 記事が極端に少ない場合の処理
if (articles.length < 3) {
  throw new Error(
    '記事数が不足しています。別のフィードを追加するか、後でもう一度お試しください。'
  );
}
```

**レイアウト実装（CSS Grid）:**

```typescript
// components/features/newspaper/NewspaperLayout.tsx
export function NewspaperLayout({ articles }: { articles: Article[] }) {
  const layout = calculateLayout(articles);
  
  return (
    <div className="newspaper-container">
      {/* ヘッダー */}
      <header className="newspaper-header">
        <h1 className="newspaper-title">MyRSSPress</h1>
        <div className="newspaper-date">{new Date().toLocaleDateString()}</div>
      </header>
      
      {/* リード記事（最も重要） */}
      <article className="lead-article">
        {layout.lead.imageUrl && (
          <img src={layout.lead.imageUrl} alt={layout.lead.title} />
        )}
        <h2 className="lead-title">{layout.lead.title}</h2>
        <p className="lead-description">{layout.lead.description}</p>
        <a href={layout.lead.link} target="_blank" rel="noopener noreferrer">
          続きを読む
        </a>
      </article>
      
      {/* トップストーリー（3カラム） */}
      <div className="top-stories">
        {layout.topStories.map((article) => (
          <article key={article.link} className="top-story">
            {article.imageUrl && (
              <img src={article.imageUrl} alt={article.title} />
            )}
            <h3 className="top-story-title">{article.title}</h3>
            <p className="top-story-description">{article.description}</p>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              続きを読む
            </a>
          </article>
        ))}
      </div>
      
      {/* 残りの記事（2カラム） */}
      <div className="remaining-articles">
        {layout.remainingArticles.map((article) => (
          <article key={article.link} className="article">
            <h4 className="article-title">{article.title}</h4>
            <p className="article-description">{article.description}</p>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              続きを読む
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
```

**CSS実装（Tailwind CSS）:**

```css
/* globals.css または newspaper.css */

.newspaper-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f5f5dc; /* 紙のような色 */
  background-image: url('/paper-texture.png'); /* 紙テクスチャ */
  font-family: 'Georgia', 'Times New Roman', serif; /* 新聞フォント */
}

.newspaper-header {
  text-align: center;
  border-bottom: 3px solid #000;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}

.newspaper-title {
  font-size: 3rem;
  font-weight: bold;
  font-family: 'Old English Text MT', serif; /* 新聞タイトル風 */
}

/* リード記事（全幅、大きく） */
.lead-article {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #333;
}

.lead-article img {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.lead-title {
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.lead-description {
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* トップストーリー（3カラム） */
.top-stories {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #666;
}

.top-story img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  margin-bottom: 0.5rem;
}

.top-story-title {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1.3;
  margin-bottom: 0.5rem;
}

.top-story-description {
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

/* 残りの記事（2カラム） */
.remaining-articles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  column-gap: 3rem;
}

.article {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ccc;
}

.article-title {
  font-size: 1.25rem;
  font-weight: bold;
  line-height: 1.3;
  margin-bottom: 0.5rem;
}

.article-description {
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .lead-article {
    grid-template-columns: 1fr;
  }
  
  .top-stories {
    grid-template-columns: 1fr;
  }
  
  .remaining-articles {
    grid-template-columns: 1fr;
  }
}
```

**Tailwind CSS版（推奨）:**

```tsx
// components/features/newspaper/NewspaperLayout.tsx
export function NewspaperLayout({ articles }: { articles: Article[] }) {
  const layout = calculateLayout(articles);
  
  return (
    <div className="max-w-7xl mx-auto p-8 bg-[#f5f5dc] font-serif">
      {/* 新聞のヘッダー（新聞レイアウト内） */}
      <header className="text-center border-b-4 border-black pb-4 mb-8">
        <h1 className="text-6xl font-bold">{newspaperName || 'MyRSSPress'}</h1>
        <div className="text-sm mt-2 space-y-1">
          <div>{new Date(createdAt).toLocaleDateString()}</div>
          {userName && <div className="text-gray-600">作成者: {userName}</div>}
        </div>
      </header>
      
      {/* リード記事 */}
      <article className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-gray-800">
        {layout.lead.imageUrl && (
          <img 
            src={layout.lead.imageUrl} 
            alt={layout.lead.title}
            className="w-full h-auto object-cover"
          />
        )}
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            {layout.lead.title}
          </h2>
          <p className="text-lg leading-relaxed mb-4">
            {layout.lead.description}
          </p>
          <a 
            href={layout.lead.link}
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            続きを読む →
          </a>
        </div>
      </article>
      
      {/* トップストーリー（記事数に応じて3または4カラム） */}
      <div className={`grid gap-8 mb-8 pb-8 border-b border-gray-600 ${
        layout.topStories.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'
      }`}>
        {layout.topStories.map((article) => (
          <article key={article.link} className="space-y-2">
            {article.imageUrl && (
              <img 
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
            )}
            <h3 className="text-2xl font-bold leading-tight">
              {article.title}
            </h3>
            <p className="text-sm leading-relaxed">
              {article.description}
            </p>
            <a 
              href={article.link}
              className="text-blue-600 hover:underline text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              続きを読む →
            </a>
          </article>
        ))}
      </div>
      
      {/* 残りの記事 */}
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
        {layout.remainingArticles.map((article) => (
          <article 
            key={article.link}
            className="pb-6 border-b border-gray-300"
          >
            <h4 className="text-xl font-bold leading-tight mb-2">
              {article.title}
            </h4>
            <p className="text-sm leading-relaxed mb-2">
              {article.description}
            </p>
            <a 
              href={article.link}
              className="text-blue-600 hover:underline text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              続きを読む →
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
```

### バックエンドサービス

#### AISuggesterService
**目的:** AIを使用してRSSフィード提案を生成

**インターフェース:**
```typescript
interface AISuggesterService {
  suggestFeeds(theme: string): Promise<FeedSuggestion[]>;
}
```

**メソッド:**
- `suggestFeeds(theme)` - Bedrock Runtime APIを呼び出してフィード提案を取得
- `buildPrompt(theme)` - フィード提案用のAIプロンプトを構築
- `parseAIResponse(response)` - 構造化されたフィードデータを抽出

**使用モデル:**
- **Claude 3.5 Haiku** (`anthropic.claude-3-5-haiku-20241022-v1:0`)
- コスト効率を重視した選択
- 高速なレスポンス時間
- フィード提案に十分な品質

**Bedrock Runtime API呼び出し例:**
```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

const prompt = `ユーザーが「${theme}」に興味があります。関連するRSSフィードを3つ提案してください。`;

const command = new InvokeModelCommand({
  modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  }),
});

const response = await client.send(command);
```

**依存関係:**
- `@aws-sdk/client-bedrock-runtime`

#### RSSFetcherService
**目的:** RSSフィードを並行して取得・解析

**インターフェース:**
```typescript
interface RSSFetcherService {
  fetchArticles(feedUrls: string[], daysBack: number): Promise<Article[]>;
}
```

**メソッド:**
- `fetchArticles(feedUrls, daysBack)` - Promise.allですべてのフィードを並行して取得
- `parseFeed(url)` - RSSパーサーライブラリで単一のRSSフィードを解析
- `filterByDate(articles, daysBack)` - 日付範囲で記事をフィルタリング

**依存関係:**
- `rss-parser` または同等のライブラリ
- `node-fetch` または標準fetch API

#### ImportanceCalculator
**目的:** レイアウト優先順位付けのための記事重要度を計算（バックエンドで実行）

**インターフェース:**
```typescript
interface ImportanceCalculator {
  calculateImportance(articles: Article[], userTheme: string): Promise<Article[]>;
}
```

**メソッド:**
- `calculateImportance(articles, userTheme)` - Bedrockを使用して記事に重要度スコアを付与
- `buildImportancePrompt(articles, userTheme)` - 重要度判定用のAIプロンプトを構築
- `parseImportanceResponse(response)` - Bedrockレスポンスから重要度スコアを抽出

**アルゴリズム（Bedrock使用）:**
```typescript
async function calculateImportance(articles: Article[], userTheme: string): Promise<Article[]> {
  // ランダム性を持たせるための要素
  const perspectives = [
    '今日の気分で',
    '新鮮な視点で',
    '異なる角度から',
    'ユニークな観点で',
    '多様な視点で',
  ];
  const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
  const timestamp = new Date().toISOString();
  
  // Bedrockに記事リストとユーザーテーマを送信
  const prompt = `
ユーザーは「${userTheme}」に興味があります。
${randomPerspective}、以下の記事リストからユーザーにとっての重要度を0-100のスコアで評価してください。

評価基準：
1. ユーザーのテーマとの関連性（最重要）
2. 画像の有無（画像付きは+10点）
3. タイトルの魅力度と新鮮さ

記事リスト：
${articles.map((a, i) => `${i + 1}. タイトル: ${a.title}, 説明: ${a.description}, 画像: ${a.imageUrl ? 'あり' : 'なし'}`).join('\n')}

注意: 同じような重要度の記事がある場合、少しバリエーションを持たせてください。
生成時刻: ${timestamp}

各記事の重要度スコア（0-100）をJSON形式で返してください：
{"scores": [85, 70, 60, ...]}
`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8, // ランダム性を高める（0.0-1.0、デフォルト1.0）
    }),
  });

  const response = await bedrockClient.send(command);
  const scores = parseImportanceResponse(response);
  
  // 記事に重要度スコアを付与
  return articles.map((article, index) => ({
    ...article,
    importance: scores[index] || 50, // デフォルト50
  }));
}
```

**フォールバック（Bedrock失敗時）:**
```typescript
function calculateImportanceFallback(article: Article): number {
  const titleLength = article.title.length;
  const hasImage = !!article.imageUrl;
  
  // シンプルなスコアリング
  const titleScore = Math.min(titleLength * 0.6, 60);
  const imageBonus = hasImage ? 40 : 0;
  
  return Math.min(100, titleScore + imageBonus);
}
```

**実装場所:** `backend/src/services/importanceCalculator.ts`

**ランダム性の実現:**
- `temperature: 0.8`を設定してAIの出力にバリエーションを持たせる
- プロンプトにランダムな視点（「今日の気分で」など）を追加
- タイムスタンプを含めて毎回異なるコンテキストを提供
- 同じ記事リストでも生成ごとに異なるレイアウトになる

**パフォーマンス考慮:**
- 記事数が多い場合（20件以上）は、バッチ処理または上位候補のみBedrockで評価
- タイムアウト: 5秒以内
- エラー時はフォールバックアルゴリズムを使用

#### NewspaperService
**目的:** 新聞のメタデータを管理

**インターフェース:**
```typescript
interface NewspaperService {
  saveNewspaper(newspaper: NewspaperData): Promise<string>;
  getNewspaper(newspaperId: string): Promise<NewspaperData>;
  getPublicNewspapers(sortBy: 'popular' | 'recent', limit: number): Promise<NewspaperData[]>;
  incrementViewCount(newspaperId: string): Promise<void>;
}

interface NewspaperData {
  newspaperId: string;
  name: string;
  userName: string;
  feedUrls: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isPublic: boolean;
}
```

**メソッド:**
- `saveNewspaper(newspaper)` - DynamoDBに新聞を保存
- `getNewspaper(newspaperId)` - IDで新聞を取得
- `getPublicNewspapers(sortBy, limit)` - 公開新聞を取得（人気順または新着順）
- `incrementViewCount(newspaperId)` - 閲覧数をインクリメント

**依存関係:**
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`

### APIエンドポイント

#### POST /api/suggest-feeds
**リクエスト:**
```json
{
  "theme": "Tech"
}
```

**レスポンス:**
```json
{
  "suggestions": [
    {
      "url": "https://techcrunch.com/feed/",
      "title": "TechCrunch",
      "reasoning": "スタートアップとイノベーションをカバーする主要なテクノロジーニュース"
    }
  ]
}
```

#### POST /api/generate-newspaper
**リクエスト:**
```json
{
  "feedUrls": ["https://techcrunch.com/feed/"],
  "daysBack": 3,
  "theme": "Tech"
}
```

**レスポンス:**
```json
{
  "articles": [
    {
      "title": "2025年のAIブレークスルー",
      "description": "...",
      "link": "https://...",
      "pubDate": "2025-11-26T10:00:00Z",
      "imageUrl": "https://...",
      "importance": 85
    }
  ]
}
```

**注:** `theme`パラメータは記事の重要度計算に使用されます。

#### POST /api/newspapers
**リクエスト:**
```json
{
  "name": "Tech Morning Digest",
  "userName": "John Doe",
  "feedUrls": ["https://techcrunch.com/feed/"],
  "isPublic": true
}
```

**レスポンス:**
```json
{
  "newspaperId": "uuid-1234",
  "createdAt": "2025-11-29T10:00:00Z"
}
```

#### GET /api/newspapers/:newspaperId
**レスポンス:**
```json
{
  "newspaperId": "uuid-1234",
  "name": "Tech Morning Digest",
  "userName": "John Doe",
  "feedUrls": ["https://techcrunch.com/feed/"],
  "createdAt": "2025-11-29T10:00:00Z",
  "updatedAt": "2025-11-29T10:00:00Z",
  "viewCount": 42,
  "isPublic": true
}
```

#### GET /api/newspapers?sort=popular&limit=10
**レスポンス:**
```json
{
  "newspapers": [
    {
      "newspaperId": "uuid-1234",
      "name": "Tech Morning Digest",
      "userName": "John Doe",
      "createdAt": "2025-11-29T10:00:00Z",
      "viewCount": 42,
      "thumbnailUrl": "https://...",
      "topics": ["Tech", "AI"]
    }
  ]
}
```

## DNS設定（Route53）

### ドメイン情報

**ドメイン名**: `my-rss-press.com`  
**レジストラ**: XServer  
**DNS管理**: AWS Route53

### Route53セットアップ手順

#### 1. Route53ホストゾーンの作成

```bash
# AWS CLIでホストゾーンを作成
aws route53 create-hosted-zone \
  --name my-rss-press.com \
  --caller-reference $(date +%s)
```

または、Terraformで：

```hcl
# infra/modules/route53/main.tf
resource "aws_route53_zone" "main" {
  name = "my-rss-press.com"
  
  tags = {
    Name        = "MyRSSPress"
    Environment = "production"
  }
}

output "name_servers" {
  value       = aws_route53_zone.main.name_servers
  description = "Route53ネームサーバー（XServerに設定する）"
}
```

#### 2. XServerでネームサーバーを変更

Route53ホストゾーン作成後、以下のネームサーバーが割り当てられます：

```
ns-xxxx.awsdns-xx.com
ns-xxxx.awsdns-xx.net
ns-xxxx.awsdns-xx.org
ns-xxxx.awsdns-xx.co.uk
```

**XServerでの設定手順：**
1. XServerのサーバーパネルにログイン
2. 「ドメイン設定」→「ネームサーバー設定」を選択
3. `my-rss-press.com` を選択
4. 「その他のネームサーバーを使用」を選択
5. Route53の4つのネームサーバーを入力
6. 設定を保存

**注意**: DNS変更の反映には最大48時間かかる場合があります（通常は数時間）。

#### 3. Route53 DNSレコードの設定

```hcl
# infra/modules/route53/records.tf

# Amplify Hostingへのルーティング（フロントエンド）
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "my-rss-press.com"
  type    = "A"
  
  alias {
    name                   = aws_amplify_app.main.default_domain
    zone_id                = aws_amplify_app.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.my-rss-press.com"
  type    = "CNAME"
  ttl     = 300
  records = [aws_amplify_app.main.default_domain]
}

# API Gateway（バックエンド）
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.my-rss-press.com"
  type    = "A"
  
  alias {
    name                   = aws_api_gateway_domain_name.api.cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.api.cloudfront_zone_id
    evaluate_target_health = false
  }
}

# メール認証用（オプション）
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "my-rss-press.com"
  type    = "MX"
  ttl     = 300
  records = [
    "10 mail.my-rss-press.com"
  ]
}

# SPFレコード（メール送信認証）
resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "my-rss-press.com"
  type    = "TXT"
  ttl     = 300
  records = [
    "v=spf1 include:_spf.google.com ~all"
  ]
}
```

### DNSレコード一覧

| レコードタイプ | 名前 | 値 | 用途 |
|--------------|------|-----|------|
| A (Alias) | my-rss-press.com | Amplify CloudFront | ルートドメイン（フロントエンド） |
| CNAME | www.my-rss-press.com | Amplify Domain | wwwサブドメイン |
| A (Alias) | api.my-rss-press.com | API Gateway CloudFront | バックエンドAPI |
| MX | my-rss-press.com | mail.my-rss-press.com | メールサーバー（オプション） |
| TXT | my-rss-press.com | SPFレコード | メール送信認証（オプション） |

### SSL/TLS証明書（ACM）

AWS Certificate Manager（ACM）で無料のSSL証明書を取得：

```hcl
# infra/modules/acm/main.tf
resource "aws_acm_certificate" "main" {
  domain_name               = "my-rss-press.com"
  subject_alternative_names = ["*.my-rss-press.com"]
  validation_method         = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "MyRSSPress SSL Certificate"
  }
}

# DNS検証レコードの自動作成
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
  
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# 証明書の検証完了を待機
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
```

### Amplifyカスタムドメイン設定

```hcl
# infra/modules/amplify/domain.tf
resource "aws_amplify_domain_association" "main" {
  app_id      = aws_amplify_app.main.id
  domain_name = "my-rss-press.com"
  
  # ルートドメイン
  sub_domain {
    branch_name = "main"
    prefix      = ""
  }
  
  # wwwサブドメイン
  sub_domain {
    branch_name = "main"
    prefix      = "www"
  }
  
  wait_for_verification = true
}
```

### API Gatewayカスタムドメイン設定

```hcl
# infra/modules/api-gateway/domain.tf
resource "aws_api_gateway_domain_name" "api" {
  domain_name              = "api.my-rss-press.com"
  regional_certificate_arn = aws_acm_certificate.main.arn
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_base_path_mapping" "api" {
  api_id      = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  domain_name = aws_api_gateway_domain_name.api.domain_name
}
```

### DNS伝播の確認

```bash
# ネームサーバーの確認
dig NS my-rss-press.com

# Aレコードの確認
dig A my-rss-press.com

# CNAMEレコードの確認
dig CNAME www.my-rss-press.com

# API エンドポイントの確認
dig A api.my-rss-press.com

# 全世界のDNS伝播状況を確認
# https://www.whatsmydns.net/ でmy-rss-press.comを検索
```

### コスト

- **Route53ホストゾーン**: $0.50/月
- **DNSクエリ**: 最初の10億クエリまで $0.40/100万クエリ
- **ACM証明書**: 無料

**月額合計**: 約$0.50（DNSクエリは無料枠内と想定）

## データモデル

### Article
```typescript
interface Article {
  title: string;        // 記事見出し
  description: string;  // 記事要約/コンテンツ
  link: string;         // 元記事URL
  pubDate: Date;        // 公開日
  imageUrl?: string;    // オプションの特集画像
  importance: number;   // 計算された重要度（0-100）
  feedSource: string;   // ソースRSSフィードURL
}
```

### FeedSuggestion
```typescript
interface FeedSuggestion {
  url: string;       // RSSフィードURL
  title: string;     // フィード名
  reasoning: string; // 提案のAI説明
}
```

### Newspaper
```typescript
interface Newspaper {
  newspaperId: string;  // UUID
  name: string;         // 新聞名
  userName: string;     // 作成者名
  feedUrls: string[];   // RSSフィードURLリスト
  createdAt: string;    // 作成日時（ISO 8601）
  updatedAt: string;    // 更新日時（ISO 8601）
  viewCount: number;    // 閲覧数
  isPublic: boolean;    // 公開/非公開
}
```

**DynamoDBテーブル設計:**

**Newspapersテーブル:**
- パーティションキー: `PK` = `NEWSPAPER#{newspaperId}` (String)
- ソートキー: `SK` = `METADATA` (String)
- 属性: `newspaperId`, `name`, `userName`, `feedUrls`, `createdAt`, `updatedAt`, `viewCount`, `isPublic`

**GSI: PublicNewspapers（人気順）:**
- パーティションキー: `PK` = `PUBLIC` (String)
- ソートキー: `SK` = `VIEWS#{viewCount}#{newspaperId}` (String)
- 用途: 人気順での新聞取得

**GSI: RecentNewspapers（新着順）:**
- パーティションキー: `PK` = `PUBLIC` (String)
- ソートキー: `SK` = `CREATED#{createdAt}#{newspaperId}` (String)
- 用途: 新着順での新聞取得

### LayoutGrid
```typescript
interface LayoutGrid {
  columns: number;        // グリッド列数（例：3）
  rows: number;          // グリッド行数
  cells: LayoutCell[];   // 記事配置
}

interface LayoutCell {
  article: Article;
  row: number;           // 開始行
  col: number;           // 開始列
  rowSpan: number;       // 占有行数
  colSpan: number;       // 占有列数
  fontSize: 'large' | 'medium' | 'small';
}
```

## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性または動作です。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証との橋渡しとして機能します。*

### プロパティ1: 空入力の拒否
*任意の*空文字列または空白のみの文字列に対して、テーマ入力検証はそれを拒否し、エラーを返すべきです
**検証: 要件 1.3**

### プロパティ2: 有効入力の受入
*任意の*少なくとも1つの非空白文字を含む文字列に対して、テーマ入力検証はそれを受け入れるべきです
**検証: 要件 1.2**

### プロパティ3: 提案生成の完全性
*任意の*有効なテーマキーワードに対して、AI提案サービスは少なくとも3つのフィード提案を返すべきです
**検証: 要件 2.1, 2.3**

### プロパティ4: 提案メタデータの完全性
*任意の*生成されたフィード提案に対して、それはタイトル、URL、理由フィールドをすべて含むべきです
**検証: 要件 2.2, 2.4**

### プロパティ5: 複数選択の許可
*任意の*フィード提案リストに対して、ユーザーは1つ以上のフィードを同時に選択できるべきです
**検証: 要件 3.2**

### プロパティ6: 選択状態の一貫性
*任意の*フィード選択操作に対して、選択状態は即座に更新され、UIに反映されるべきです
**検証: 要件 3.3**

### プロパティ7: 生成有効化条件
*任意の*フィード選択状態に対して、少なくとも1つのフィードが選択されている場合にのみ、生成ボタンが有効になるべきです
**検証: 要件 3.4**

### プロパティ8: 日付範囲フィルタリング
*任意の*RSSフィードから取得された記事に対して、すべての返される記事は過去1〜3日以内に公開されたものであるべきです
**検証: 要件 4.1**

### プロパティ9: RSS解析の完全性
*任意の*有効なRSSフィードに対して、解析された記事はタイトル、説明、リンクフィールドを含むべきです
**検証: 要件 4.2**

### プロパティ10: 重要度計算の決定性
*任意の*記事に対して、重要度計算は0〜100の範囲の数値を返すべきです
**検証: 要件 4.3**

### プロパティ11: 重要度計算の完全性
*任意の*記事リストに対して、重要度計算はすべての記事にスコアを付与するべきです（Bedrock失敗時はフォールバックを使用）
**検証: 要件 6.1**

### プロパティ12: テーマとの関連性
*任意の*記事リストとユーザーテーマに対して、Bedrockによる重要度計算はテーマとの関連性を考慮するべきです
**検証: 要件 6.2**

### プロパティ13: レイアウトの完全性
*任意の*記事セットに対して、生成されたレイアウトはすべての記事を含むべきです
**検証: 要件 6.5**

### プロパティ14: 重要度とフォントサイズの相関
*任意の*レイアウトされた記事セットに対して、より高い重要度の記事はより大きなフォントサイズを持つべきです
**検証: 要件 6.3**

### プロパティ15: 重要度と位置の相関
*任意の*レイアウトされた記事セットに対して、より高い重要度の記事はより目立つ位置（上部、左側）に配置されるべきです
**検証: 要件 6.4**

### プロパティ16: 新聞保存の完全性
*任意の*新聞設定に対して、それを保存した後、新聞IDで取得すると、同じ設定が返されるべきです
**検証: 要件 6.1, 6.5**

### プロパティ17: 公開新聞の並び替え
*任意の*公開新聞リストに対して、人気順でソートすると閲覧数の降順で返され、新着順でソートすると作成日時の降順で返されるべきです
**検証: 要件 4.2, 4.3, 4.4**

### プロパティ18: 多言語対応の一貫性
*任意の*ブラウザ言語設定に対して、日本語の場合は日本語UIが、それ以外の場合は英語UIが表示されるべきです
**検証: 要件 1.1, 1.2, 1.3**

## セキュリティ

### API保護戦略

**MVPでの方針**: CORS + レート制限による基本的な防御

#### 1. CORS設定

```typescript
// backend/src/middleware/cors.ts
import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: [
    'https://my-rss-press.com',
    'https://www.my-rss-press.com',
    // 開発環境
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24時間
});
```

**効果:**
- ブラウザからの不正なクロスオリジンリクエストを防ぐ
- 他のWebサイトからのJavaScript経由のアクセスを制限

**制限:**
- curl、Postman、カスタムアプリからのアクセスは防げない
- これはSPAの本質的な制限

#### 2. レート制限

```typescript
// backend/src/middleware/rateLimit.ts
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RateLimitRecord>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    
    const now = Date.now();
    const record = requestCounts.get(ip);
    
    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { 
        count: 1, 
        resetTime: now + windowMs 
      });
    } else {
      record.count++;
      if (record.count > maxRequests) {
        return c.json({ 
          error: 'Too many requests. Please try again later.' 
        }, 429);
      }
    }
    
    await next();
  };
};

// 使用例
app.use('/api/*', rateLimit(100, 60000)); // 1分間に100リクエストまで
```

**効果:**
- 大量のリクエストを防ぐ
- DDoS攻撃を軽減
- コストの急増を防ぐ

**設定値:**
- 一般的なエンドポイント: 100リクエスト/分
- AI提案エンドポイント: 10リクエスト/分（コスト高いため）
- 新聞生成エンドポイント: 20リクエスト/分

#### 3. 統合セキュリティミドルウェア

```typescript
// backend/src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { corsMiddleware } from './middleware/cors';
import { rateLimit } from './middleware/rateLimit';

export const app = new Hono();

// 1. ログ記録
app.use('*', logger());

// 2. CORS設定
app.use('*', corsMiddleware);

// 3. レート制限（エンドポイントごとに設定）
app.use('/api/suggest-feeds', rateLimit(10, 60000));
app.use('/api/generate-newspaper', rateLimit(20, 60000));
app.use('/api/*', rateLimit(100, 60000));

// ルート定義
app.get('/api/health', (c) => c.json({ status: 'ok' }));
// ... 他のルート
```

### セキュリティベストプラクティス

1. **環境変数の管理**
   - 機密情報は環境変数で管理
   - `.env`ファイルは`.gitignore`に追加
   - AWS Secrets Managerは使用しない（コスト削減）

2. **入力検証**
   - すべてのユーザー入力をZodで検証
   - SQLインジェクション対策（DynamoDBなので不要だが念のため）
   - XSS対策（Reactのデフォルト保護）

3. **HTTPSの強制**
   - すべての通信をHTTPSで暗号化
   - Amplify、API Gateway、CloudFrontがデフォルトで対応

4. **エラーメッセージ**
   - 本番環境では詳細なエラー情報を隠蔽
   - ログにのみ詳細を記録

### セキュリティの制限事項

**SPAの本質的な制限:**
- フロントエンドから叩けるAPI = 誰でも叩ける
- APIキーをJavaScriptに埋め込んでも、開発者ツールで見える
- 完全な保護は不可能

**実用的な対策:**
- CORS: ブラウザからの基本的な防御
- レート制限: 大量アクセスの防止
- コスト監視: CloudWatch Alarmsで異常検知

**将来の拡張（Phase 2以降）:**
- AWS WAF: より高度な防御（月額$5-10）
- API認証: ユーザーごとのトークン管理
- Captcha: ボット対策

## エラーハンドリング

### フロントエンドエラー

**入力検証エラー:**
- 空のテーマ入力 → ユーザーにエラーメッセージを表示
- ネットワークタイムアウト → 再試行オプション付きエラーメッセージ

**レンダリングエラー:**
- 画像読み込み失敗 → プレースホルダー画像を表示

### バックエンドエラー

**AI提案エラー:**
- Bedrock APIタイムアウト → デフォルトフィードリストにフォールバック
- APIレート制限 → 指数バックオフで再試行
- 無効なレスポンス → エラーログとクライアントへの500エラー

**RSS取得エラー:**
- フィードURL到達不可 → そのフィードをスキップし、他を続行
- 解析エラー → エラーログとそのフィードをスキップ
- タイムアウト（5秒） → そのフィードをスキップ
- 記事数不足（3記事未満） → ユーザーにエラーメッセージを表示し、フィード追加を促す

**DynamoDBエラー:**
- 接続失敗 → 再試行ロジック（最大3回、指数バックオフ）
- 重複新聞ID → 新しいUUIDを生成して再試行
- スロットリング → 指数バックオフで再試行
- クエリタイムアウト → エラーログとクライアントへの500エラー

### エラーログ

すべてのエラーはCloudWatch Logsに記録され、以下を含みます：
- タイムスタンプ
- エラータイプ
- スタックトレース
- リクエストコンテキスト（ユーザーID、テーマなど）

## テスト戦略

### ユニットテスト

**フロントエンド:**
- コンポーネントレンダリングテスト（React Testing Library）
- 入力検証ロジック
- レイアウト計算アルゴリズム
- 多言語対応（i18n）

**バックエンド:**
- 各サービスの個別機能（Vitest）
- API エンドポイントハンドラー（Hono）
- 重要度計算アルゴリズム
- データベースクエリ（AWS SDK Mock）
- エラーハンドリングパス

**カバレッジ目標:** 60%以上

### プロパティベーステスト

**テストフレームワーク:** fast-check（TypeScript用プロパティベーステストライブラリ）

**設定:**
- 各プロパティテストは最低100回の反復を実行
- 各テストは設計書の正確性プロパティを明示的に参照
- タグ形式: `**Feature: myrsspress, Property {number}: {property_text}**`

**テスト対象プロパティ:**
1. 入力検証（プロパティ1, 2）
2. AI提案生成（プロパティ3, 4）
3. フィード選択（プロパティ5, 6, 7）
4. 記事取得とフィルタリング（プロパティ8, 9）
5. 重要度計算（プロパティ10, 11, 12）
6. レイアウト生成（プロパティ13, 14, 15）
7. 新聞保存機能（プロパティ16）
8. 公開新聞の並び替え（プロパティ17）
9. 多言語対応（プロパティ18）

**ジェネレーター戦略:**
```typescript
import * as fc from 'fast-check';

// テーマキーワード用
fc.string({ minLength: 1 });

// フィードURL用
fc.array(fc.webUrl(), { minLength: 1, maxLength: 10 });

// 記事構造体用
fc.record({
  title: fc.string({ minLength: 1 }),
  description: fc.string(),
  link: fc.webUrl(),
  pubDate: fc.date(),
  imageUrl: fc.option(fc.webUrl()),
  importance: fc.integer({ min: 0, max: 100 }),
  feedSource: fc.webUrl(),
});
```

### 統合テスト

- API統合：Bedrock、RSSフィード、DynamoDB
- Lambda関数のローカルテスト（Honoローカルサーバー）
- バックエンドサービス間の連携テスト

### E2Eテスト（Playwright）

**テストシナリオ:**
- 新聞作成フロー：テーマ入力 → フィード提案 → 選択 → 生成 → 保存
- 手動フィード追加と削除
- 新聞設定の保存
- 人気の新聞の閲覧と並び替え
- レスポンシブデザインの動作確認
- 多言語対応の切り替え

**テスト構成:**
- Page Object Modelパターンを使用
- 複数ブラウザでテスト（Chrome、Firefox、Safari）
- モバイルデバイスのエミュレーション

### パフォーマンステスト

- 5秒以内の新聞生成時間を測定
- 複数フィードの並行取得を検証

### テスト実行

すべてのテストはMakefileコマンドからアクセス可能：
```makefile
test:           # すべてのテストを実行
test-unit:      # ユニットテストのみ
test-property:  # プロパティベーステストのみ
test-integration: # 統合テストのみ
```
