# Design Document MVP

## Overview

MyRSSPress is a web application that transforms RSS feeds into visually appealing newspaper-style layouts. The system consists of a Next.js-based frontend (Amplify Hosting), TypeScript/Hono backend API (Lambda), AI feed suggestions via AWS Bedrock, and newspaper data storage in DynamoDB. The architecture prioritizes fast generation times (under 5 seconds) and cost efficiency through serverless composition and parallel feed fetching.

The application flow follows four main stages:
1. Theme input and AI-driven feed suggestions (Bedrock)
2. User feed selection
3. Article collection and importance calculation (Lambda)
4. Newspaper layout generation with paper texture styling (Frontend)

Project structure:
- `backend/` - TypeScript/Hono API server (for Lambda)
- `frontend/` - Next.js + TailwindCSS (for Amplify Hosting)
- `infra/` - Terraform IaC code
- `prototype/` - Prototype implementation (Next.js)

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js + TailwindCSS)                │
│                    [Amplify Hosting]                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Unified Home │  │ Newspaper    │  │ Layout       │      │
│  │ Screen       │→ │ Renderer     │→ │ Calculator   │      │
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
│           Backend API (TypeScript/Hono on Lambda)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Bedrock      │  │ RSS Fetcher  │  │ Importance   │      │
│  │ Suggester    │  │ Service      │  │ Calculator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   AWS Bedrock    │  │   RSS Feeds      │  │  DynamoDB    │
│   (Claude 3      │  │   (External)     │  │  (Newspaper  │
│    Haiku)        │  │                  │  │   Storage)   │
└──────────────────┘  └──────────────────┘  └──────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 15.x (App Router)
- Node.js 24.x LTS (Active LTS) or 22.x LTS (Maintenance LTS)
- TypeScript 5.9.x
- TailwindCSS 3.x for paper texture styling
- Storybook 8.x (UI component development & documentation)
- API communication via fetch

**Backend:**
- AWS Lambda (Node.js 24.x or 22.x)
- Hono 4.x framework
- TypeScript 5.9.x
- AWS Bedrock Runtime API (Claude 3 Haiku) for feed suggestions
- RSS feed parsing library
- Zod 3.x for validation

**Database:**
- DynamoDB (newspaper metadata, feed URL storage)

**Infrastructure (Terraform 1.10.x):**
- AWS Amplify Hosting (frontend)
- Route53 (DNS hosted zone, domain: my-rss-press.com)
- API Gateway REST (API endpoints)
- AWS Lambda (TypeScript/Hono backend, using ECR images)
- Amazon ECR (container registry)
- AWS Bedrock Runtime API (Claude 3 Haiku)
- DynamoDB (data storage)
- CloudWatch Logs (logging)
- CloudFront (CDN)

## Design System

### Color Palette

**Primary Colors:**
```typescript
const colors = {
  // Brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',  // Main color
    600: '#0284c7',
    700: '#0369a1',
  },
  
  // Newspaper theme colors
  newspaper: {
    paper: '#f5f5dc',      // Paper color (beige)
    ink: '#1a1a1a',        // Ink color (dark gray)
    border: '#333333',     // Border
    accent: '#8b4513',     // Accent (brown)
  },
  
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Grayscale
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

**Tailwind Configuration:**
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

### Typography

**Font Families:**
```typescript
const fonts = {
  // UI fonts
  sans: ['Inter', 'system-ui', 'sans-serif'],
  
  // Newspaper fonts
  serif: ['Georgia', 'Times New Roman', 'serif'],
  
  // Code fonts
  mono: ['Fira Code', 'monospace'],
};
```

**Font Sizes:**
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

### Spacing

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

### UI Component Library

**Basic Components (`components/ui/`):**

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

### Storybook Configuration

**Setup:**
```bash
# Install Storybook
npx storybook@latest init

# Dependencies
npm install --save-dev @storybook/react @storybook/addon-essentials @storybook/addon-a11y
```

**Configuration File:**
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

**Storybook Story Example:**
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

**Run Commands:**
```json
// package.json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Design System Best Practices

1. **Consistency**: All UI components use unified color palette and spacing
2. **Reusability**: Build complex UIs by combining basic components
3. **Accessibility**: All components comply with WCAG 2.1 AA standards
4. **Documentation**: Document all components in Storybook
5. **Testing**: Implement unit tests and visual regression tests for each component


## Components and Interfaces

### Frontend Components

#### TopicMarqueeComponent
**Purpose:** Display popular topic keywords scrolling from left to right, auto-fill on click

**Props:**
```typescript
interface TopicMarqueeProps {
  keywords: string[];
  onKeywordClick: (keyword: string) => void;
}
```

**Features:**
- Infinite scroll of 50 topic keywords from left to right
- Auto-fill theme input field on keyword click/tap
- Automatically fetch feed suggestions
- Newspaper-style design (black border, white-black inversion on hover)
- 60-second loop animation

**Keyword Examples:**
- English: Technology, Sports, Business, Politics, Entertainment...
- Japanese: テクノロジー、スポーツ、ビジネス、政治、エンタメ...

#### ThemeInputComponent
**Purpose:** Capture user's interest topic

**Props:**
```typescript
interface ThemeInputProps {
  onSubmit: (theme: string) => void;
  isLoading: boolean;
}
```

**State:**
- `themeKeyword: string` - Current input value
- `error: string | null` - Validation error message

**Methods:**
- `handleSubmit()` - Validate and submit theme
- `validateInput(input: string): boolean` - Ensure non-empty input

#### FeedSelectorComponent
**Purpose:** Display AI-suggested feeds and allow selection

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
- `selectedFeeds: Set<string>` - Currently selected feed URLs

**Methods:**
- `toggleFeed(url: string)` - Add/remove feed from selection
- `isGenerateEnabled(): boolean` - Check if at least one feed is selected

#### NewspaperRenderer
**Purpose:** Display articles in newspaper layout with paper texture

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
- `isSaved: boolean` - Whether newspaper is saved
- `showSettingsModal: boolean` - Settings modal display state

**Methods:**
- `calculateLayout(articles: Article[]): LayoutGrid` - Determine article positions (executed on frontend)
- `handleSave(settings: NewspaperSettings): void` - Save newspaper settings
- `renderArticle(article: Article, size: ArticleSize): JSX.Element` - Render individual article

**Layout Algorithm (dynamically changes based on article count):**
```typescript
function calculateLayout(articles: Article[]): LayoutGrid {
  // Sort by importance (descending)
  const sorted = [...articles].sort((a, b) => b.importance - a.importance);
  const totalArticles = sorted.length;
  
  // Adjust layout based on article count
  if (totalArticles <= 4) {
    // Few articles (1-4): Display all large
    return {
      lead: sorted[0],
      topStories: sorted.slice(1),
      remaining: [],
    };
  } else if (totalArticles <= 8) {
    // Medium articles (5-8): Lead 1 + Top 3 + Remaining
    return {
      lead: sorted[0],
      topStories: sorted.slice(1, 4),
      remaining: sorted.slice(4),
    };
  } else {
    // Many articles (9+): Lead 1 + Top 4 + Remaining
    return {
      lead: sorted[0],
      topStories: sorted.slice(1, 5),
      remaining: sorted.slice(5),
    };
  }
}
```

**Article Count Determination (with randomness):**
```typescript
function determineArticleCount(): number {
  // Randomly determine between 8-15 articles
  const min = 8;
  const max = 15;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchArticles(feedUrls: string[], theme: string): Promise<Article[]> {
  const minArticles = 8;
  const targetCount = determineArticleCount();
  
  // Fetch articles from all feeds
  const allArticles = await Promise.all(
    feedUrls.map(url => parseFeed(url))
  ).then(results => results.flat());
  
  // Sort by publication date (newest first)
  const sortedByDate = allArticles.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  
  // Step 1: Get articles from last 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  let recentArticles = sortedByDate.filter(
    article => new Date(article.pubDate) >= threeDaysAgo
  );
  
  // Step 2: If below minimum, extend to 7 days
  if (recentArticles.length < minArticles) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    recentArticles = sortedByDate.filter(
      article => new Date(article.pubDate) >= sevenDaysAgo
    );
  }
  
  // Step 3: If still insufficient, use all fetched articles
  if (recentArticles.length < minArticles) {
    console.warn(`Below minimum articles (${minArticles}): ${recentArticles.length} articles`);
    recentArticles = sortedByDate;
  }
  
  // Step 4: Select up to target count (prioritize newest)
  const selectedArticles = recentArticles.slice(0, Math.min(targetCount, recentArticles.length));
  
  // Step 5: Randomly shuffle selected articles (for layout variation)
  const shuffled = selectedArticles.sort(() => Math.random() - 0.5);
  
  return shuffled;
}
```

**Error Handling:**
```typescript
// Handle extremely low article count
if (articles.length < 3) {
  throw new Error(
    'Insufficient articles. Please add more feeds or try again later.'
  );
}
```

**Layout Implementation (CSS Grid):**

```typescript
// components/features/newspaper/NewspaperLayout.tsx
export function NewspaperLayout({ articles }: { articles: Article[] }) {
  const layout = calculateLayout(articles);
  
  return (
    <div className="newspaper-container">
      {/* Header */}
      <header className="newspaper-header">
        <h1 className="newspaper-title">MyRSSPress</h1>
        <div className="newspaper-date">{new Date().toLocaleDateString()}</div>
      </header>
      
      {/* Lead article (most important) */}
      <article className="lead-article">
        {layout.lead.imageUrl && (
          <img src={layout.lead.imageUrl} alt={layout.lead.title} />
        )}
        <h2 className="lead-title">{layout.lead.title}</h2>
        <p className="lead-description">{layout.lead.description}</p>
        <a href={layout.lead.link} target="_blank" rel="noopener noreferrer">
          Read more
        </a>
      </article>
      
      {/* Top stories (3 columns) */}
      <div className="top-stories">
        {layout.topStories.map((article) => (
          <article key={article.link} className="top-story">
            {article.imageUrl && (
              <img src={article.imageUrl} alt={article.title} />
            )}
            <h3 className="top-story-title">{article.title}</h3>
            <p className="top-story-description">{article.description}</p>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              Read more
            </a>
          </article>
        ))}
      </div>
      
      {/* Remaining articles (2 columns) */}
      <div className="remaining-articles">
        {layout.remainingArticles.map((article) => (
          <article key={article.link} className="article">
            <h4 className="article-title">{article.title}</h4>
            <p className="article-description">{article.description}</p>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              Read more
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
```

**CSS Implementation (Tailwind CSS):**

```css
/* globals.css or newspaper.css */

.newspaper-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f5f5dc; /* Paper-like color */
  background-image: url('/paper-texture.png'); /* Paper texture */
  font-family: 'Georgia', 'Times New Roman', serif; /* Newspaper font */
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
  font-family: 'Old English Text MT', serif; /* Newspaper title style */
}

/* Lead article (full width, large) */
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

/* Top stories (3 columns) */
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

/* Remaining articles (2 columns) */
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

/* Responsive design */
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

**Tailwind CSS Version (Recommended):**

```tsx
// components/features/newspaper/NewspaperLayout.tsx
export function NewspaperLayout({ articles }: { articles: Article[] }) {
  const layout = calculateLayout(articles);
  
  return (
    <div className="max-w-7xl mx-auto p-8 bg-[#f5f5dc] font-serif">
      {/* Newspaper header (within newspaper layout) */}
      <header className="text-center border-b-4 border-black pb-4 mb-8">
        <h1 className="text-6xl font-bold">{newspaperName || 'MyRSSPress'}</h1>
        <div className="text-sm mt-2 space-y-1">
          <div>{new Date(createdAt).toLocaleDateString()}</div>
          {userName && <div className="text-gray-600">Created by: {userName}</div>}
        </div>
      </header>
      
      {/* Lead article */}
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
            Read more →
          </a>
        </div>
      </article>
      
      {/* Top stories (3 or 4 columns based on article count) */}
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
              Read more →
            </a>
          </article>
        ))}
      </div>
      
      {/* Remaining articles */}
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
              Read more →
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
```

### Backend Services

#### AISuggesterService
**Purpose:** Generate RSS feed suggestions using AI

**Interface:**
```typescript
interface AISuggesterService {
  suggestFeeds(theme: string): Promise<FeedSuggestion[]>;
}
```

**Methods:**
- `suggestFeeds(theme)` - Call Bedrock Runtime API to get feed suggestions
- `buildPrompt(theme)` - Build AI prompt for feed suggestions
- `parseAIResponse(response)` - Extract structured feed data
- `validateFeedUrl(url)` - Verify feed URL existence (HEAD request)

**Feed Suggestion Flow:**
```
1. User enters theme
   ↓
2. buildPrompt(theme) generates prompt
   - Request 10 feed suggestions
   - Include constraint to suggest only real feeds
   ↓
3. Request to Bedrock (Claude 3 Haiku)
   ↓
4. parseAIResponse() parses JSON
   - Extract up to 10 feeds
   ↓
5. Execute validateFeedUrl() for each feed URL
   - HEAD request to verify existence (5 second timeout)
   - Only valid if 200 OK
   ↓
6. Filter to valid feeds only
   ↓
7. If 0 valid feeds
   - Return default feeds (BBC, NYT, etc.)
   ↓
8. Return to frontend
```

**Feed URL Validation Details:**
- **Timing**: After Bedrock response, before returning to frontend
- **Method**: HTTP HEAD request
- **Timeout**: 5 seconds
- **Criteria**: HTTP status 200 OK
- **On failure**: Skip that feed, return only valid feeds
- **All fail**: Fallback to default feeds (10)

**Model Used:**
- **Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`)
- Cost-efficient choice
- Fast response time
- Sufficient quality for feed suggestions

**Bedrock Runtime API Call Example:**
```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

const prompt = `User is interested in "${theme}". Please suggest 3 related RSS feeds.`;

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

**Dependencies:**
- `@aws-sdk/client-bedrock-runtime`

#### RSSFetcherService
**Purpose:** Fetch and parse RSS feeds in parallel

**Interface:**
```typescript
interface RSSFetcherService {
  fetchArticles(feedUrls: string[], daysBack: number): Promise<Article[]>;
}
```

**Methods:**
- `fetchArticles(feedUrls, daysBack)` - Fetch all feeds in parallel with Promise.all
- `parseFeed(url)` - Parse single RSS feed with RSS parser library
- `filterByDate(articles, daysBack)` - Filter articles by date range

**Dependencies:**
- `rss-parser` or equivalent library
- `node-fetch` or standard fetch API

#### ImportanceCalculator
**Purpose:** Calculate article importance for layout prioritization (executed on backend)

**Interface:**
```typescript
interface ImportanceCalculator {
  calculateImportance(articles: Article[], userTheme: string): Promise<Article[]>;
}
```

**Methods:**
- `calculateImportance(articles, userTheme)` - Assign importance scores to articles using Bedrock
- `buildImportancePrompt(articles, userTheme)` - Build AI prompt for importance judgment
- `parseImportanceResponse(response)` - Extract importance scores from Bedrock response

**Algorithm (Using Bedrock):**
```typescript
async function calculateImportance(articles: Article[], userTheme: string): Promise<Article[]> {
  // Elements for randomness
  const perspectives = [
    'with today\'s mood',
    'from a fresh perspective',
    'from a different angle',
    'with a unique viewpoint',
    'from diverse perspectives',
  ];
  const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
  const timestamp = new Date().toISOString();
  
  // Send article list and user theme to Bedrock
  const prompt = `
User is interested in "${userTheme}".
${randomPerspective}, please evaluate the importance of the following articles for the user with a score from 0-100.

Evaluation criteria:
1. Relevance to user's theme (highest priority)
2. Presence of image (+10 point bonus)
3. Title attractiveness and freshness

Article list:
${articles.map((a, i) => `${i + 1}. Title: ${a.title}, Description: ${a.description}, Image: ${a.imageUrl ? 'Yes' : 'No'}`).join('\n')}

Note: If articles have similar importance, please add some variation.
Generation time: ${timestamp}

Return importance scores (0-100) for each article in JSON format:
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
      temperature: 0.8, // Increase randomness (0.0-1.0, default 1.0)
    }),
  });

  const response = await bedrockClient.send(command);
  const scores = parseImportanceResponse(response);
  
  // Assign importance scores to articles
  return articles.map((article, index) => ({
    ...article,
    importance: scores[index] || 50, // Default 50
  }));
}
```

**Fallback (When Bedrock Fails):**
```typescript
function calculateImportanceFallback(article: Article): number {
  const titleLength = article.title.length;
  const hasImage = !!article.imageUrl;
  
  // Simple scoring
  const titleScore = Math.min(titleLength * 0.6, 60);
  const imageBonus = hasImage ? 40 : 0;
  
  return Math.min(100, titleScore + imageBonus);
}
```

**Implementation Location:** `backend/src/services/importanceCalculator.ts`

**Achieving Randomness:**
- Set `temperature: 0.8` to add variation to AI output
- Add random perspective to prompt ("with today's mood", etc.)
- Include timestamp to provide different context each time
- Same article list produces different layouts each generation

**Performance Considerations:**
- For many articles (20+), use batch processing or evaluate only top candidates with Bedrock
- Timeout: Within 5 seconds
- Use fallback algorithm on error

#### NewspaperService
**Purpose:** Manage newspaper metadata

**Interface:**
```typescript
interface NewspaperService {
  saveNewspaper(newspaper: NewspaperData): Promise<string>;
  getNewspaper(newspaperId: string): Promise<NewspaperData>;
  getPublicNewspapers(sortBy: 'popular' | 'recent', limit: number): Promise<NewspaperData[]>;
  getUserNewspapers(userId: string, limit: number): Promise<NewspaperData[]>;
  incrementViewCount(newspaperId: string): Promise<void>;
}

interface NewspaperData {
  newspaperId: string;
  name: string;
  userName: string;
  userId?: string;      // For future login feature (optional)
  feedUrls: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isPublic: boolean;
}
```

**Methods:**
- `saveNewspaper(newspaper)` - Save newspaper to DynamoDB
- `getNewspaper(newspaperId)` - Get newspaper by ID
- `getPublicNewspapers(sortBy, limit)` - Get public newspapers (by popularity or recency)
- `getUserNewspapers(userId, limit)` - Get newspapers created by user (for future login feature)
- `incrementViewCount(newspaperId)` - Increment view count

**Dependencies:**
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`

### API Endpoints

#### POST /api/suggest-feeds
**Request:**
```json
{
  "theme": "Tech"
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "url": "https://example.com/tech-feed",
      "title": "Tech News Feed",
      "reasoning": "Major technology news covering startups and innovation"
    }
  ]
}
```

#### POST /api/generate-newspaper
**Request:**
```json
{
  "feedUrls": ["https://example.com/tech-feed"],
  "daysBack": 3,
  "theme": "Tech"
}
```

**Response:**
```json
{
  "articles": [
    {
      "title": "AI Breakthroughs in 2025",
      "description": "...",
      "link": "https://...",
      "pubDate": "2025-11-26T10:00:00Z",
      "imageUrl": "https://...",
      "importance": 85
    }
  ]
}
```

**Note:** The `theme` parameter is used for article importance calculation.

#### POST /api/newspapers
**Request:**
```json
{
  "name": "Tech Morning Digest",
  "userName": "John Doe",
  "userId": null,
  "feedUrls": ["https://example.com/tech-feed"],
  "isPublic": true
}
```

**Note:** In MVP, `userId` is always `null`. Will be used when login feature is implemented.

**Response:**
```json
{
  "newspaperId": "uuid-1234",
  "createdAt": "2025-11-29T10:00:00Z"
}
```

#### GET /api/newspapers/:newspaperId
**Response:**
```json
{
  "newspaperId": "uuid-1234",
  "name": "Tech Morning Digest",
  "userName": "John Doe",
  "userId": null,
  "feedUrls": ["https://example.com/tech-feed"],
  "createdAt": "2025-11-29T10:00:00Z",
  "updatedAt": "2025-11-29T10:00:00Z",
  "viewCount": 42,
  "isPublic": true
}
```

#### GET /api/newspapers?sort=popular&limit=10
**Response:**
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


## DNS Configuration (Route53)

### Domain Information

**Domain Name**: `my-rss-press.com`  
**Registrar**: XServer  
**DNS Management**: AWS Route53

### Route53 Setup Procedure

#### 1. Create Route53 Hosted Zone

```bash
# Create hosted zone with AWS CLI
aws route53 create-hosted-zone \
  --name my-rss-press.com \
  --caller-reference $(date +%s)
```

Or with Terraform:

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
  description = "Route53 name servers (configure in XServer)"
}
```

#### 2. Change Name Servers in XServer

After creating Route53 hosted zone, the following name servers will be assigned:

```
ns-xxxx.awsdns-xx.com
ns-xxxx.awsdns-xx.net
ns-xxxx.awsdns-xx.org
ns-xxxx.awsdns-xx.co.uk
```

**XServer Configuration Steps:**
1. Log in to XServer control panel
2. Select "Domain Settings" → "Name Server Settings"
3. Select `my-rss-press.com`
4. Select "Use other name servers"
5. Enter the 4 Route53 name servers
6. Save settings

**Note**: DNS changes can take up to 48 hours to propagate (usually a few hours).

#### 3. Configure Route53 DNS Records

```hcl
# infra/modules/route53/records.tf

# Route to Amplify Hosting (frontend)
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

# API Gateway (backend)
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

# Email verification (optional)
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "my-rss-press.com"
  type    = "MX"
  ttl     = 300
  records = [
    "10 mail.my-rss-press.com"
  ]
}

# SPF record (email sending verification)
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

### DNS Record List

| Record Type | Name | Value | Purpose |
|------------|------|-------|---------|
| A (Alias) | my-rss-press.com | Amplify CloudFront | Root domain (frontend) |
| CNAME | www.my-rss-press.com | Amplify Domain | www subdomain |
| A (Alias) | api.my-rss-press.com | API Gateway CloudFront | Backend API |
| MX | my-rss-press.com | mail.my-rss-press.com | Mail server (optional) |
| TXT | my-rss-press.com | SPF record | Email sending verification (optional) |

### SSL/TLS Certificate (ACM)

Obtain free SSL certificate with AWS Certificate Manager (ACM):

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

# Auto-create DNS validation records
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

# Wait for certificate validation completion
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
```

### Amplify Custom Domain Configuration

```hcl
# infra/modules/amplify/domain.tf
resource "aws_amplify_domain_association" "main" {
  app_id      = aws_amplify_app.main.id
  domain_name = "my-rss-press.com"
  
  # Root domain
  sub_domain {
    branch_name = "main"
    prefix      = ""
  }
  
  # www subdomain
  sub_domain {
    branch_name = "main"
    prefix      = "www"
  }
  
  wait_for_verification = true
}
```

### API Gateway Custom Domain Configuration

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

### Verify DNS Propagation

```bash
# Check name servers
dig NS my-rss-press.com

# Check A record
dig A my-rss-press.com

# Check CNAME record
dig CNAME www.my-rss-press.com

# Check API endpoint
dig A api.my-rss-press.com

# Check global DNS propagation status
# Visit https://www.whatsmydns.net/ and search for my-rss-press.com
```

### Cost

- **Route53 Hosted Zone**: $0.50/month
- **DNS Queries**: $0.40/million queries for first 1 billion queries
- **ACM Certificate**: Free

**Monthly Total**: Approximately $0.50 (assuming DNS queries within free tier)

## Data Models

### Article
```typescript
interface Article {
  title: string;        // Article headline
  description: string;  // Article summary/content
  link: string;         // Original article URL
  pubDate: Date;        // Publication date
  imageUrl?: string;    // Optional featured image
  importance: number;   // Calculated importance (0-100)
  feedSource: string;   // Source RSS feed URL
}
```

### FeedSuggestion
```typescript
interface FeedSuggestion {
  url: string;       // RSS feed URL
  title: string;     // Feed name
  reasoning: string; // AI explanation for suggestion
}
```

### Newspaper
```typescript
interface Newspaper {
  newspaperId: string;  // UUID
  name: string;         // Newspaper name
  userName: string;     // Creator name (for display)
  userId?: string;      // User ID (for future login feature, optional)
  feedUrls: string[];   // RSS feed URL list
  createdAt: string;    // Creation date (ISO 8601)
  updatedAt: string;    // Update date (ISO 8601)
  viewCount: number;    // View count
  isPublic: boolean;    // Public/private
}
```

**DynamoDB Table Design:**

**Newspapers Table:**
- Partition Key: `PK` = `NEWSPAPER#{newspaperId}` (String)
- Sort Key: `SK` = `METADATA` (String)
- Attributes: `newspaperId`, `name`, `userName`, `userId`, `feedUrls`, `createdAt`, `updatedAt`, `viewCount`, `isPublic`

**GSI: UserNewspapers (for future login feature):**
- Partition Key: `PK` = `USER#{userId}` (String)
- Sort Key: `SK` = `CREATED#{createdAt}#{newspaperId}` (String)
- Purpose: Get list of newspapers created by user (after login)

**GSI: PublicNewspapers (by popularity):**
- Partition Key: `PK` = `PUBLIC` (String)
- Sort Key: `SK` = `VIEWS#{viewCount}#{newspaperId}` (String)
- Purpose: Get newspapers sorted by popularity

**GSI: RecentNewspapers (by recency):**
- Partition Key: `PK` = `PUBLIC` (String)
- Sort Key: `SK` = `CREATED#{createdAt}#{newspaperId}` (String)
- Purpose: Get newspapers sorted by recency

### LayoutGrid
```typescript
interface LayoutGrid {
  columns: number;        // Grid column count (e.g., 3)
  rows: number;          // Grid row count
  cells: LayoutCell[];   // Article placement
}

interface LayoutCell {
  article: Article;
  row: number;           // Starting row
  col: number;           // Starting column
  rowSpan: number;       // Rows occupied
  colSpan: number;       // Columns occupied
  fontSize: 'large' | 'medium' | 'small';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should be true across all valid executions of the system. Essentially, it's a formal description of what the system should do. Properties serve as a bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Empty Input Rejection
*For any* empty string or whitespace-only string, theme input validation should reject it and return an error
**Verifies: Requirement 1.3**

### Property 2: Valid Input Acceptance
*For any* string containing at least one non-whitespace character, theme input validation should accept it
**Verifies: Requirement 1.2**

### Property 3: Suggestion Generation Completeness
*For any* valid theme keyword, the AI suggestion service should return at least 3 feed suggestions
**Verifies: Requirements 2.1, 2.3**

### Property 4: Suggestion Metadata Completeness
*For any* generated feed suggestion, it should contain all of title, URL, and reasoning fields
**Verifies: Requirements 2.2, 2.4**

### Property 5: Multiple Selection Allowance
*For any* feed suggestion list, users should be able to select one or more feeds simultaneously
**Verifies: Requirement 3.2**

### Property 6: Selection State Consistency
*For any* feed selection operation, the selection state should update immediately and be reflected in the UI
**Verifies: Requirement 3.3**

### Property 7: Generation Enable Condition
*For any* feed selection state, the generate button should only be enabled when at least one feed is selected
**Verifies: Requirement 3.4**

### Property 8: Date Range Filtering
*For any* articles fetched from RSS feeds, all returned articles should be published within the past 1-3 days
**Verifies: Requirement 4.1**

### Property 9: RSS Parsing Completeness
*For any* valid RSS feed, parsed articles should contain title, description, and link fields
**Verifies: Requirement 4.2**

### Property 10: Importance Calculation Determinism
*For any* article, importance calculation should return a numeric value in the range 0-100
**Verifies: Requirement 4.3**

### Property 11: Importance Calculation Completeness
*For any* article list, importance calculation should assign scores to all articles (using fallback if Bedrock fails)
**Verifies: Requirement 6.1**

### Property 12: Theme Relevance
*For any* article list and user theme, Bedrock importance calculation should consider theme relevance
**Verifies: Requirement 6.2**

### Property 13: Layout Completeness
*For any* article set, the generated layout should include all articles
**Verifies: Requirement 6.5**

### Property 14: Importance-Font Size Correlation
*For any* laid-out article set, articles with higher importance should have larger font sizes
**Verifies: Requirement 6.3**

### Property 15: Importance-Position Correlation
*For any* laid-out article set, articles with higher importance should be placed in more prominent positions (top, left)
**Verifies: Requirement 6.4**

### Property 16: Newspaper Save Completeness
*For any* newspaper settings, after saving them, retrieving by newspaper ID should return the same settings
**Verifies: Requirements 6.1, 6.5**

### Property 17: Public Newspaper Sorting
*For any* public newspaper list, sorting by popularity should return in descending order of view count, and sorting by recency should return in descending order of creation date
**Verifies: Requirements 4.2, 4.3, 4.4**

### Property 18: Multi-language Consistency
*For any* browser language setting, Japanese should display Japanese UI, and all others should display English UI
**Verifies: Requirements 1.1, 1.2, 1.3**

## Security

### API Protection Strategy

**MVP Approach**: Basic defense with CORS + rate limiting

#### 1. CORS Configuration

```typescript
// backend/src/middleware/cors.ts
import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: [
    'https://my-rss-press.com',
    'https://www.my-rss-press.com',
    // Development environment
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
});
```

**Effect:**
- Prevent unauthorized cross-origin requests from browsers
- Restrict access via JavaScript from other websites

**Limitations:**
- Cannot prevent access from curl, Postman, or custom apps
- This is an inherent limitation of SPAs

#### 2. Rate Limiting

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

// Usage example
app.use('/api/*', rateLimit(100, 60000)); // 100 requests per minute
```

**Effect:**
- Prevent mass requests
- Mitigate DDoS attacks
- Prevent cost spikes

**Configuration Values:**
- General endpoints: 100 requests/minute
- AI suggestion endpoint: 10 requests/minute (high cost)
- Newspaper generation endpoint: 20 requests/minute

#### 3. Integrated Security Middleware

```typescript
// backend/src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { corsMiddleware } from './middleware/cors';
import { rateLimit } from './middleware/rateLimit';

export const app = new Hono();

// 1. Logging
app.use('*', logger());

// 2. CORS configuration
app.use('*', corsMiddleware);

// 3. Rate limiting (per endpoint)
app.use('/api/suggest-feeds', rateLimit(10, 60000));
app.use('/api/generate-newspaper', rateLimit(20, 60000));
app.use('/api/*', rateLimit(100, 60000));

// Route definitions
app.get('/api/health', (c) => c.json({ status: 'ok' }));
// ... other routes
```

### Security Best Practices

1. **Environment Variable Management**
   - Manage sensitive information with environment variables
   - Add `.env` files to `.gitignore`
   - Don't use AWS Secrets Manager (cost reduction)

2. **Input Validation**
   - Validate all user input with Zod
   - SQL injection protection (not needed for DynamoDB but just in case)
   - XSS protection (React default protection)

3. **Force HTTPS**
   - Encrypt all communication with HTTPS
   - Amplify, API Gateway, CloudFront support by default

4. **Error Messages**
   - Hide detailed error information in production
   - Log details only

### Security Limitations

**Inherent SPA Limitations:**
- API callable from frontend = callable by anyone
- API keys embedded in JavaScript are visible in developer tools
- Complete protection is impossible

**Practical Countermeasures:**
- CORS: Basic defense from browsers
- Rate limiting: Prevent mass access
- Cost monitoring: Detect anomalies with CloudWatch Alarms

**Future Enhancements (Phase 2+):**
- AWS WAF: More advanced defense ($5-10/month)
- API authentication: Per-user token management
- Captcha: Bot protection

## Error Handling

### Frontend Errors

**Input Validation Errors:**
- Empty theme input → Display error message to user
- Network timeout → Error message with retry option

**Rendering Errors:**
- Image load failure → Display placeholder image

### Backend Errors

**AI Suggestion Errors:**
- Bedrock API timeout → Fallback to default feed list
- API rate limit → Retry with exponential backoff
- Invalid response → Error log and 500 error to client

**RSS Fetch Errors:**
- Feed URL unreachable → Skip that feed and continue with others
- Parse error → Error log and skip that feed
- Timeout (5 seconds) → Skip that feed
- Insufficient articles (< 3) → Display error message to user and prompt to add feeds

**DynamoDB Errors:**
- Connection failure → Retry logic (max 3 times, exponential backoff)
- Duplicate newspaper ID → Generate new UUID and retry
- Throttling → Retry with exponential backoff
- Query timeout → Error log and 500 error to client

### Error Logging

All errors are logged to CloudWatch Logs and include:
- Timestamp
- Error type
- Stack trace
- Request context (user ID, theme, etc.)

## Testing Strategy

### Unit Tests

**Frontend:**
- Component rendering tests (React Testing Library)
- Input validation logic
- Layout calculation algorithm
- Multi-language support (i18n)

**Backend:**
- Individual service functions (Vitest)
- API endpoint handlers (Hono)
- Importance calculation algorithm
- Database queries (AWS SDK Mock)
- Error handling paths

**Coverage Goal:** 60% or higher

### Property-Based Testing

**Test Framework:** fast-check (property-based testing library for TypeScript)

**Configuration:**
- Each property test runs minimum 100 iterations
- Each test explicitly references correctness properties from design document
- Tag format: `**Feature: myrsspress, Property {number}: {property_text}**`

**Properties to Test:**
1. Input validation (Properties 1, 2)
2. AI suggestion generation (Properties 3, 4)
3. Feed selection (Properties 5, 6, 7)
4. Article fetching and filtering (Properties 8, 9)
5. Importance calculation (Properties 10, 11, 12)
6. Layout generation (Properties 13, 14, 15)
7. Newspaper save functionality (Property 16)
8. Public newspaper sorting (Property 17)
9. Multi-language support (Property 18)

**Generator Strategy:**
```typescript
import * as fc from 'fast-check';

// For theme keywords
fc.string({ minLength: 1 });

// For feed URLs
fc.array(fc.webUrl(), { minLength: 1, maxLength: 10 });

// For article structures
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

### Integration Tests

- API integration: Bedrock, RSS feeds, DynamoDB
- Local Lambda function testing (Hono local server)
- Backend service interaction tests

### E2E Tests (Playwright)

**Test Scenarios:**
- Newspaper creation flow: Theme input → Feed suggestions → Selection → Generation → Save
- Manual feed addition and deletion
- Newspaper settings save
- Popular newspapers browsing and sorting
- Responsive design verification
- Multi-language switching

**Test Structure:**
- Use Page Object Model pattern
- Test on multiple browsers (Chrome, Firefox, Safari)
- Mobile device emulation

### Performance Tests

- Measure newspaper generation time within 5 seconds
- Verify parallel fetching of multiple feeds

### Test Execution

All tests accessible from Makefile commands:
```makefile
test:           # Run all tests
test-unit:      # Unit tests only
test-property:  # Property-based tests only
test-integration: # Integration tests only
```
