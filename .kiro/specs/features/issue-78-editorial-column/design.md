# Design Document - Issue #78: Editorial Column

**Related Documents:**
- [Requirements Document](./requirements.md)
- [Tasks Document](./tasks.md)
- [Issue #78](https://github.com/kumagaias/my-rss-press/issues/78)

## Overview

This document describes the technical design for implementing an AI-generated editorial column (Tensei Jingo style) in the newspaper layout.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  NewspaperLayout.tsx                                 │   │
│  │  - Displays articles                                 │   │
│  │  - Displays editorial column (if exists)            │   │
│  │                                                      │   │
│  │  EditorialColumn.tsx (NEW)                          │   │
│  │  - Styled column box                                │   │
│  │  - Multi-language title                             │   │
│  │  - Responsive design                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│           Backend API (Hono on Lambda)                       │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Newspaper Routes │  │ Editorial Column │                │
│  │ - Generate       │──│ Service (NEW)    │                │
│  │ - Historical     │  │ - Bedrock call   │                │
│  │                  │  │ - Prompt eng.    │                │
│  └──────────────────┘  └──────────────────┘                │
│           │                      │                           │
│           ↓                      ↓                           │
│  ┌──────────────────────────────────────────┐               │
│  │ AWS Bedrock (Claude 3 Haiku)             │               │
│  │ - Generate editorial column              │               │
│  │ - Multi-language support                 │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    DynamoDB                                  │
│  - Newspapers (with editorialColumn field)                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Editorial Column Service

**File:** `backend/src/services/editorialColumnService.ts`

**Purpose:** Generate editorial column using Bedrock

**Interface:**

```typescript
import { Article } from '../models/newspaper.js';

export interface EditorialColumnOptions {
  articles: Article[];
  theme: string;
  locale: 'en' | 'ja';
  maxRetries?: number;
}

export interface EditorialColumnResult {
  column: string;
  title: string;
}

/**
 * Generate editorial column using Bedrock
 * @param options - Column generation options
 * @returns Editorial column text and title
 */
export async function generateEditorialColumn(
  options: EditorialColumnOptions
): Promise<EditorialColumnResult | null>;

/**
 * Build prompt for editorial column generation
 * @param articles - Articles to summarize
 * @param theme - Newspaper theme
 * @param locale - Language locale
 * @returns Prompt string
 */
function buildEditorialPrompt(
  articles: Article[],
  theme: string,
  locale: 'en' | 'ja'
): string;
```

**Implementation Details:**

```typescript
// Prompt template for English
const ENGLISH_PROMPT = `You are a thoughtful editorial columnist writing in the style of traditional newspaper editorials like "Tensei Jingo" from Asahi Shimbun.

Your task is to write a brief editorial column (150-200 words) that:
1. Weaves together the themes from today's articles
2. Includes a relevant historical anecdote or philosophical reference
3. Connects the technology/news to broader human themes
4. Maintains a thoughtful, reflective tone
5. Ends with a memorable insight or observation

Theme: {theme}

Articles:
{article_summaries}

Write the editorial column in English. Start with a compelling opening that references history or philosophy, then connect it to today's news, and end with a thought-provoking conclusion.

Format:
Title: [A poetic or thought-provoking title]
Column: [150-200 words of editorial content]`;

// Prompt template for Japanese
const JAPANESE_PROMPT = `あなたは朝日新聞の「天声人語」のような、伝統的な新聞コラムを書く思慮深いコラムニストです。

以下の記事をもとに、簡潔なコラム（150-200文字）を書いてください：
1. 今日の記事のテーマを織り交ぜる
2. 関連する歴史的逸話や哲学的な引用を含める
3. テクノロジー/ニュースを、より広い人間のテーマに結びつける
4. 思慮深く、内省的なトーンを保つ
5. 印象的な洞察や観察で締めくくる

テーマ: {theme}

記事:
{article_summaries}

日本語でコラムを書いてください。歴史や哲学に言及する魅力的な書き出しで始め、今日のニュースと結びつけ、考えさせられる結論で終わってください。

形式:
タイトル: [詩的または示唆に富むタイトル]
コラム: [150-200文字のコラム内容]`;
```

**Error Handling:**

```typescript
try {
  const response = await bedrockClient.send(command);
  // Parse response
  return { column, title };
} catch (error) {
  console.error('[Editorial Column] Generation failed:', error);
  return null; // Graceful degradation
}
```

### 2. API Integration

**File:** `backend/src/routes/newspapers.ts`

**Changes:**

```typescript
// In POST /api/newspapers/generate
async (c) => {
  // ... existing code ...

  // Step 8: Generate editorial column (parallel with summary)
  console.log('[OneClick] Step 8: Generating editorial column...');
  let editorialColumn: string | null = null;
  try {
    const columnResult = await generateEditorialColumn({
      articles: articlesWithImportance,
      theme: validated.theme,
      locale: validated.locale,
      maxRetries: 2,
    });
    if (columnResult) {
      editorialColumn = `${columnResult.title}\n\n${columnResult.column}`;
      console.log(`[OneClick] Generated editorial column: ${columnResult.title}`);
    }
  } catch (error) {
    console.error('[OneClick] Error generating editorial column:', error);
    // Continue without column
  }

  // Return complete newspaper data
  return c.json({
    articles: articlesWithImportance,
    feedUrls,
    feedMetadata: enrichedFeedMetadata,
    newspaperName: feedSuggestions.newspaperName,
    summary,
    languages,
    editorialColumn, // NEW
  });
}
```

**Historical Newspaper Integration:**

```typescript
// In historicalNewspaperService.ts
export async function getOrCreateNewspaper(
  newspaperId: string,
  date: string,
  // ... other params
): Promise<NewspaperData> {
  // ... existing code ...

  // Generate editorial column
  let editorialColumn: string | null = null;
  try {
    const columnResult = await generateEditorialColumn({
      articles: selectedArticles,
      theme,
      locale,
    });
    if (columnResult) {
      editorialColumn = `${columnResult.title}\n\n${columnResult.column}`;
    }
  } catch (error) {
    console.error('[Historical Newspaper] Editorial column generation failed:', error);
  }

  // Save newspaper with editorial column
  const newspaperData: NewspaperData = {
    // ... existing fields
    editorialColumn,
  };

  await saveHistoricalNewspaper(newspaperData);
  return newspaperData;
}
```

### 3. Database Schema

**File:** `backend/src/models/newspaper.ts`

**Changes:**

```typescript
export interface NewspaperData {
  newspaperId: string;
  name: string;
  userName: string;
  feedUrls: string[];
  articles: Article[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isPublic: boolean;
  locale: Locale;
  languages?: string[];
  summary?: string;
  newspaperDate?: string;
  editorialColumn?: string; // NEW: AI-generated editorial column
}
```

### 4. Frontend Component

**File:** `frontend/components/features/newspaper/EditorialColumn.tsx`

**Implementation:**

```typescript
'use client';

import { useTranslations, type Locale } from '@/lib/i18n';

interface EditorialColumnProps {
  content: string;
  locale: Locale;
}

/**
 * Editorial Column Component
 * 
 * Displays an AI-generated editorial column in the style of
 * traditional newspaper editorials (e.g., Tensei Jingo).
 * 
 * Features:
 * - Styled box with border and background
 * - Multi-language title
 * - Responsive design
 * - Serif font for traditional feel
 */
export function EditorialColumn({ content, locale }: EditorialColumnProps) {
  const t = useTranslations(locale);

  // Parse title and column from content
  // Format: "Title\n\nColumn content"
  const [title, ...columnParts] = content.split('\n\n');
  const column = columnParts.join('\n\n');

  return (
    <div className="mt-12 pt-8 border-t-2 border-gray-800">
      <div className="bg-amber-50 border-2 border-gray-800 p-6 md:p-8 rounded shadow-sm">
        {/* Section Label */}
        <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4 border-b border-gray-400 pb-2">
          {locale === 'ja' ? '天声人語' : "Editor's Note"}
        </div>

        {/* Column Title */}
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 font-serif">
          {title}
        </h2>

        {/* Column Content */}
        <div className="text-base md:text-lg leading-relaxed text-gray-800 font-serif whitespace-pre-line">
          {column}
        </div>
      </div>
    </div>
  );
}
```

**Integration in NewspaperLayout:**

```typescript
// In NewspaperLayout.tsx
export function NewspaperLayout({
  articles,
  newspaperName,
  userName,
  createdAt,
  locale,
  summary,
  editorialColumn, // NEW
}: NewspaperLayoutProps) {
  // ... existing code ...

  return (
    <div className="max-w-7xl mx-auto p-8 bg-[#f5f5dc] font-serif min-h-screen">
      {/* Header */}
      {/* Summary */}
      {/* Lead Article */}
      {/* Top Stories */}
      {/* Remaining Articles */}

      {/* Editorial Column - NEW */}
      {editorialColumn && (
        <EditorialColumn content={editorialColumn} locale={locale} />
      )}
    </div>
  );
}
```

### 5. Translations

**File:** `frontend/lib/i18n.ts`

**Additions:**

```typescript
const translations = {
  en: {
    // ... existing translations
    editorialColumn: "Editor's Note",
    dailyReflection: "Daily Reflection",
    tenseiJingo: "Tensei Jingo",
  },
  ja: {
    // ... existing translations
    editorialColumn: "編集後記",
    dailyReflection: "今日の一言",
    tenseiJingo: "天声人語",
  },
};
```

## Data Flow

### Newspaper Generation Flow

```
1. User creates newspaper
   ↓
2. Backend generates articles
   ↓
3. Backend calculates importance
   ↓
4. Backend generates summary (parallel)
   ↓
5. Backend generates editorial column (parallel) ← NEW
   ↓
6. Backend saves to DynamoDB (with editorialColumn)
   ↓
7. Frontend displays newspaper with editorial column
```

### Historical Newspaper Flow

```
1. User navigates to past date
   ↓
2. Backend checks if newspaper exists
   ↓
3. If not exists:
   a. Fetch articles for date
   b. Generate editorial column ← NEW
   c. Save historical newspaper
   ↓
4. Return newspaper with editorial column
   ↓
5. Frontend displays with editorial column
```

## Performance Considerations

### Parallel Generation

```typescript
// Generate summary and editorial column in parallel
const [summary, columnResult] = await Promise.all([
  generateSummaryWithRetry(articles, theme, languages, 3),
  generateEditorialColumn({ articles, theme, locale }),
]);
```

### Timeout Handling

```typescript
// Set timeout for editorial column generation
const EDITORIAL_TIMEOUT = 5000; // 5 seconds

const columnPromise = Promise.race([
  generateEditorialColumn(options),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), EDITORIAL_TIMEOUT)
  ),
]);
```

### Caching Strategy

- Editorial columns are generated once and stored in DynamoDB
- No need for separate caching layer
- Historical newspapers reuse stored columns

## Error Handling

### Graceful Degradation

```typescript
// If editorial column generation fails, newspaper still works
try {
  const columnResult = await generateEditorialColumn(options);
  editorialColumn = columnResult ? formatColumn(columnResult) : null;
} catch (error) {
  console.error('[Editorial] Generation failed:', error);
  editorialColumn = null; // Continue without column
}
```

### User Experience

- Newspaper displays normally without editorial column
- No error message shown to user
- Error logged for debugging

## Testing Strategy

### Unit Tests

1. **Editorial Column Service**
   - Test prompt generation
   - Test Bedrock integration
   - Test error handling
   - Test multi-language support

2. **API Integration**
   - Test newspaper generation with column
   - Test historical newspaper with column
   - Test graceful degradation

### Integration Tests

1. **End-to-End Flow**
   - Generate newspaper → Verify column exists
   - Generate historical newspaper → Verify column exists
   - Bedrock failure → Verify newspaper still works

### Manual Testing

1. **Content Quality**
   - Review generated columns for coherence
   - Verify historical/philosophical references
   - Check tone and style
   - Test both English and Japanese

2. **Visual Design**
   - Verify layout on desktop
   - Verify layout on mobile
   - Check styling consistency
   - Test with/without column

## Security Considerations

- No new security concerns (uses existing Bedrock infrastructure)
- Input validation on articles array
- Sanitize output before storing in DynamoDB
- No user-generated content in prompts

## Deployment Plan

### Phase 1: Backend Implementation
1. Create editorial column service
2. Add unit tests
3. Deploy to staging
4. Test with sample newspapers

### Phase 2: API Integration
1. Update newspaper generation endpoint
2. Update historical newspaper service
3. Deploy to staging
4. Integration testing

### Phase 3: Frontend Implementation
1. Create EditorialColumn component
2. Update NewspaperLayout
3. Add translations
4. Deploy to staging
5. Visual testing

### Phase 4: Production Deployment
1. Deploy backend to production
2. Deploy frontend to production
3. Monitor CloudWatch logs
4. Collect user feedback

## Rollback Plan

- Feature is optional (backward compatible)
- If issues occur, can disable column generation
- Existing newspapers continue to work
- No data migration needed

## Monitoring & Metrics

### CloudWatch Metrics

- Editorial column generation success rate
- Editorial column generation duration
- Bedrock API errors
- Column length distribution

### Logs

```typescript
console.log('[Editorial] Generating column for theme:', theme);
console.log('[Editorial] Generated column:', title);
console.error('[Editorial] Generation failed:', error);
```

## Future Enhancements

- User customization of column style
- Multiple column styles (opinion, analysis, etc.)
- Column archives/history
- Social sharing of columns
- Column quality feedback mechanism

## Related Documents

- [Requirements Document](./requirements.md)
- [Tasks Document](./tasks.md)
- Issue #46: AI Summary Generation (reference implementation)
