# Design Document - Issue #75: Default Feed Management

## Overview

This document describes the design for centralizing default feed management in MyRSSPress. The solution creates a single source of truth for default feeds, provides a dedicated API for fetching default feed articles, and ensures consistent article balancing across all newspaper types.

**Related Documents:**
- [Requirements Document](./requirements.md)
- [Tasks Document](./tasks.md)
- [Issue #75](https://github.com/kumagaias/my-rss-press/issues/75)

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Newspaper Display Component                         │   │
│  │  - Fetches user-selected feed articles              │   │
│  │  - Fetches default feed articles (if needed)        │   │
│  │  - Merges and displays all articles                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│           Backend API (Hono on Lambda)                       │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Newspaper Routes │  │ Default Feed API │                │
│  │ - Create         │  │ GET /api/        │                │
│  │ - Get            │  │   default-feeds  │                │
│  │ - Update         │  │ ?locale=en       │                │
│  │                  │  │ &date=2026-01-13 │                │
│  └──────────────────┘  └──────────────────┘                │
│           │                      │                           │
│           ↓                      ↓                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Newspaper Service│  │ Default Feed     │                │
│  │ - Filter default │  │ Service          │                │
│  │   feeds before   │  │ - Central config │                │
│  │   saving         │  │ - Fetch articles │                │
│  │ - Apply balancing│  │ - Apply limits   │                │
│  └──────────────────┘  └──────────────────┘                │
│           │                      │                           │
│           ↓                      ↓                           │
│  ┌──────────────────────────────────────────┐               │
│  │ Article Balancing & Limiting             │               │
│  │ - balanceArticlesAcrossFeed              │               │
│  │ - articleLimiter                         │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    DynamoDB                                  │
│  - Newspapers (without default feeds in feedUrls)           │
│  - Historical newspapers (date-based)                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Default Feed Service

**File:** `backend/src/services/defaultFeedService.ts`

**Purpose:** Centralized management of default feeds and article fetching

**Interface:**

```typescript
// Default feed configuration
interface DefaultFeed {
  url: string;
  title: string;
  language: 'EN' | 'JP';
}

// Default feed article response
interface DefaultFeedArticlesResponse {
  articles: Article[];
  totalFeeds: number;
  successfulFeeds: number;
}

// Get default feeds for a locale
export function getDefaultFeeds(locale: 'en' | 'ja'): DefaultFeed[];

// Check if a URL is a default feed
export function isDefaultFeed(url: string): boolean;

// Fetch articles from default feeds
export async function fetchDefaultFeedArticles(
  locale: 'en' | 'ja',
  date?: string,
  articlesPerFeed?: number
): Promise<DefaultFeedArticlesResponse>;
```

**Implementation:**

```typescript
// backend/src/services/defaultFeedService.ts

import Parser from 'rss-parser';
import { Article } from '../models/newspaper';

const parser = new Parser();

// Central configuration
const DEFAULT_FEEDS_EN: DefaultFeed[] = [
  { url: 'https://www.bbc.com/news/world/rss.xml', title: 'BBC News', language: 'EN' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', title: 'New York Times', language: 'EN' },
  { url: 'https://www.theguardian.com/world/rss', title: 'The Guardian', language: 'EN' },
  { url: 'https://www.reuters.com/rssFeed/worldNews', title: 'Reuters', language: 'EN' },
];

const DEFAULT_FEEDS_JP: DefaultFeed[] = [
  { url: 'https://www.nhk.or.jp/rss/news/cat0.xml', title: 'NHK News', language: 'JP' },
  { url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml', title: 'Yahoo News', language: 'JP' },
  { url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf', title: 'Asahi Shimbun', language: 'JP' },
  { url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml', title: 'ITmedia', language: 'JP' },
];

export function getDefaultFeeds(locale: 'en' | 'ja'): DefaultFeed[] {
  return locale === 'ja' ? DEFAULT_FEEDS_JP : DEFAULT_FEEDS_EN;
}

export function isDefaultFeed(url: string): boolean {
  const allDefaultFeeds = [...DEFAULT_FEEDS_EN, ...DEFAULT_FEEDS_JP];
  return allDefaultFeeds.some(feed => feed.url === url);
}

export async function fetchDefaultFeedArticles(
  locale: 'en' | 'ja',
  date?: string,
  articlesPerFeed: number = 2
): Promise<DefaultFeedArticlesResponse> {
  const defaultFeeds = getDefaultFeeds(locale);
  const results: Article[] = [];
  let successfulFeeds = 0;

  console.log(`[Default Feed] Fetching articles for locale: ${locale}, date: ${date || 'last 7 days'}`);

  // Fetch articles from all default feeds in parallel
  const fetchPromises = defaultFeeds.map(async (feed) => {
    try {
      const articles = await fetchArticlesFromFeed(feed, date, articlesPerFeed);
      if (articles.length > 0) {
        successfulFeeds++;
        return articles;
      }
      return [];
    } catch (error) {
      console.error(`[Default Feed] Failed to fetch from ${feed.title}:`, error);
      return [];
    }
  });

  const allResults = await Promise.all(fetchPromises);
  allResults.forEach(articles => results.push(...articles));

  console.log(`[Default Feed] Fetched ${results.length} articles from ${successfulFeeds}/${defaultFeeds.length} feeds`);

  return {
    articles: results,
    totalFeeds: defaultFeeds.length,
    successfulFeeds,
  };
}

async function fetchArticlesFromFeed(
  feed: DefaultFeed,
  date?: string,
  limit: number = 2
): Promise<Article[]> {
  const rssFeed = await parser.parseURL(feed.url);
  let articles = rssFeed.items.map(item => ({
    title: item.title || '',
    description: item.contentSnippet || item.content || '',
    link: item.link || '',
    pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
    imageUrl: extractImageUrl(item),
    feedSource: feed.url,
    feedTitle: feed.title,
    importance: 0, // Will be calculated later
  }));

  // Filter by date if specified
  if (date) {
    articles = filterArticlesByDate(articles, date);
  } else {
    // Default: last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    articles = articles.filter(a => new Date(a.pubDate) >= sevenDaysAgo);
  }

  // Sort by date (newest first) and limit
  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return articles.slice(0, limit);
}

function filterArticlesByDate(articles: Article[], dateStr: string): Article[] {
  // All dates in JST
  const targetDate = new Date(dateStr + 'T00:00:00+09:00');
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayJST = new Date(nowJST);
  todayJST.setHours(0, 0, 0, 0);

  const endTime = targetDate.getTime() === todayJST.getTime()
    ? nowJST
    : new Date(targetDate.setHours(23, 59, 59, 999));

  let filtered = articles.filter(article => {
    const pubDate = new Date(article.pubDate);
    return pubDate >= startOfDay && pubDate <= endTime;
  });

  // If insufficient, expand to 7 days prior
  if (filtered.length < 2) {
    const sevenDaysAgo = new Date(startOfDay);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    filtered = articles.filter(article => {
      const pubDate = new Date(article.pubDate);
      return pubDate >= sevenDaysAgo && pubDate <= endTime;
    });
  }

  return filtered;
}

function extractImageUrl(item: any): string | undefined {
  // Same logic as rssFetcherService.ts
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;
  
  const content = item.content || item['content:encoded'] || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];
  
  return undefined;
}
```

### 2. Default Feed API Route

**File:** `backend/src/routes/defaultFeeds.ts`

**Purpose:** API endpoint for fetching default feed articles

**Implementation:**

```typescript
// backend/src/routes/defaultFeeds.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { fetchDefaultFeedArticles } from '../services/defaultFeedService';

const app = new Hono();

// Query parameter schema
const QuerySchema = z.object({
  locale: z.enum(['en', 'ja']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * GET /api/default-feeds
 * Fetch articles from default feeds
 */
app.get('/', async (c) => {
  try {
    // Validate query parameters
    const query = QuerySchema.parse({
      locale: c.req.query('locale'),
      date: c.req.query('date'),
    });

    // Validate date if provided
    if (query.date) {
      const validation = validateDate(query.date);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }
    }

    // Fetch articles
    const result = await fetchDefaultFeedArticles(query.locale, query.date);

    return c.json(result);
  } catch (error) {
    console.error('[Default Feed API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
    }
    
    return c.json({ error: 'Failed to fetch default feed articles' }, 500);
  }
});

function validateDate(date: string): { valid: boolean; error?: string } {
  const targetDate = new Date(date + 'T00:00:00+09:00');
  const todayJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  todayJST.setHours(0, 0, 0, 0);

  if (targetDate > todayJST) {
    return { valid: false, error: 'Future dates are not allowed' };
  }

  const sevenDaysAgo = new Date(todayJST);
  sevenDaysAgo.setDate(todayJST.getDate() - 7);

  if (targetDate < sevenDaysAgo) {
    return { valid: false, error: 'Dates older than 7 days are not allowed' };
  }

  return { valid: true };
}

export default app;
```

**Register route in app.ts:**

```typescript
// backend/src/app.ts

import defaultFeedsRoutes from './routes/defaultFeeds';

// ... existing code ...

app.route('/api/default-feeds', defaultFeedsRoutes);
```

### 3. Update Newspaper Service

**File:** `backend/src/services/newspaperService.ts`

**Purpose:** Filter default feeds before saving newspapers

**Changes:**

```typescript
// backend/src/services/newspaperService.ts

import { isDefaultFeed } from './defaultFeedService';

export async function createNewspaper(data: CreateNewspaperInput): Promise<Newspaper> {
  // Filter out default feeds before saving
  const userFeedUrls = data.feedUrls.filter(url => !isDefaultFeed(url));
  
  console.log(`[Newspaper Service] Filtered feeds: ${data.feedUrls.length} -> ${userFeedUrls.length}`);
  
  const newspaper: Newspaper = {
    newspaperId: generateId(),
    name: data.name,
    userName: data.userName,
    feedUrls: userFeedUrls, // Only user-selected feeds
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0,
    isPublic: data.isPublic,
    // ... other fields
  };

  await saveNewspaper(newspaper);
  return newspaper;
}
```

### 4. Update Historical Newspaper Service

**File:** `backend/src/services/historicalNewspaperService.ts`

**Purpose:** Apply consistent article balancing and use default feed API

**Changes:**

```typescript
// backend/src/services/historicalNewspaperService.ts

import { fetchDefaultFeedArticles } from './defaultFeedService';
import { balanceArticlesAcrossFeed } from './rssFetcherService';
import { limitDefaultFeedArticles } from './articleLimiter';

export async function getOrCreateNewspaper(
  newspaperId: string,
  date: string,
  feedUrls: string[],
  theme: string,
  locale: 'en' | 'ja'
): Promise<NewspaperData> {
  // ... existing validation ...

  // Check if newspaper exists
  const existing = await getNewspaperByDate(newspaperId, date);
  if (existing) {
    return existing;
  }

  // Fetch articles from user-selected feeds
  const userArticles = await fetchArticlesForDate(feedUrls, date);
  
  // Fetch articles from default feeds
  const defaultFeedResult = await fetchDefaultFeedArticles(locale, date, 2);
  const defaultArticles = defaultFeedResult.articles;
  
  console.log(`[Historical Newspaper] User articles: ${userArticles.length}, Default articles: ${defaultArticles.length}`);
  
  // Merge articles
  const allArticles = [...userArticles, ...defaultArticles];
  
  // Apply article balancing (same as regular newspaper generation)
  const balancedArticles = balanceArticlesAcrossFeed(allArticles);
  
  // Apply article limits (including default feed limits)
  const limitedArticles = limitDefaultFeedArticles(balancedArticles);
  
  // Calculate importance
  const articlesWithImportance = await calculateImportance(limitedArticles, theme);
  
  // Select 8-15 articles
  const targetCount = Math.floor(Math.random() * 8) + 8;
  const selectedArticles = articlesWithImportance
    .sort((a, b) => b.importance - a.importance)
    .slice(0, targetCount);
  
  // ... rest of the logic (languages, summary, save) ...
  
  return newspaper;
}
```

### 5. Frontend Integration

**File:** `frontend/lib/api.ts`

**Purpose:** Add API client for default feeds

**Changes:**

```typescript
// frontend/lib/api.ts

export interface DefaultFeedArticlesResponse {
  articles: Article[];
  totalFeeds: number;
  successfulFeeds: number;
}

export async function fetchDefaultFeedArticles(
  locale: 'en' | 'ja',
  date?: string
): Promise<DefaultFeedArticlesResponse> {
  const params = new URLSearchParams({ locale });
  if (date) params.append('date', date);
  
  const response = await fetch(`${API_BASE_URL}/api/default-feeds?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch default feed articles');
  }
  
  return response.json();
}
```

**Note:** Frontend changes are minimal since default feed articles are now fetched and merged on the backend.

## Data Flow

### Regular Newspaper Creation

```
1. User enters theme and selects feeds
   ↓
2. AI suggests feeds (may include default feeds)
   ↓
3. User clicks "Generate Newspaper"
   ↓
4. Backend fetches articles from all feeds
   ↓
5. Backend applies balancing and limits
   ↓
6. Backend filters out default feeds before saving
   ↓
7. Newspaper saved with only user-selected feeds
   ↓
8. Frontend displays newspaper
```

### Historical Newspaper Generation

```
1. User navigates to past date
   ↓
2. Frontend requests historical newspaper
   ↓
3. Backend checks if newspaper exists for that date
   ↓
4. If not exists:
   a. Fetch articles from user-selected feeds
   b. Fetch articles from default feeds (via API)
   c. Merge articles
   d. Apply balancing and limits
   e. Calculate importance
   f. Select 8-15 articles
   g. Save historical newspaper
   ↓
5. Return newspaper to frontend
   ↓
6. Frontend displays newspaper
```

## Backward Compatibility

### Handling Existing Newspapers

Existing newspapers may have default feeds in their `feedUrls`. The system handles this gracefully:

1. **Display**: Existing newspapers display correctly (no changes needed)
2. **Historical generation**: System detects default feeds and handles them appropriately
3. **No migration**: No need to update existing newspaper records
4. **Gradual transition**: New newspapers won't include default feeds

**Implementation:**

```typescript
// When generating historical newspaper from existing newspaper
export async function getOrCreateNewspaper(
  newspaperId: string,
  date: string,
  feedUrls: string[],
  theme: string,
  locale: 'en' | 'ja'
): Promise<NewspaperData> {
  // Separate user feeds and default feeds
  const userFeeds = feedUrls.filter(url => !isDefaultFeed(url));
  const hasDefaultFeeds = userFeeds.length < feedUrls.length;
  
  // Fetch user feed articles
  const userArticles = await fetchArticlesForDate(userFeeds, date);
  
  // Fetch default feed articles (always, for consistency)
  const defaultFeedResult = await fetchDefaultFeedArticles(locale, date, 2);
  const defaultArticles = defaultFeedResult.articles;
  
  // Merge and process
  const allArticles = [...userArticles, ...defaultArticles];
  // ... rest of the logic ...
}
```

## Error Handling

### Default Feed API Errors

```typescript
// If all default feeds fail
if (result.successfulFeeds === 0) {
  console.warn('[Default Feed] All default feeds failed, continuing without them');
  return { articles: [], totalFeeds: result.totalFeeds, successfulFeeds: 0 };
}

// If some default feeds fail
if (result.successfulFeeds < result.totalFeeds) {
  console.warn(`[Default Feed] ${result.totalFeeds - result.successfulFeeds} feeds failed`);
}
```

### Newspaper Generation Errors

```typescript
// If default feed fetch fails during newspaper generation
try {
  const defaultFeedResult = await fetchDefaultFeedArticles(locale, date, 2);
  defaultArticles = defaultFeedResult.articles;
} catch (error) {
  console.error('[Historical Newspaper] Failed to fetch default feeds:', error);
  // Continue without default feed articles
  defaultArticles = [];
}
```

## Performance Considerations

### Parallel Fetching

- All default feeds fetched in parallel using `Promise.all`
- Individual feed timeout: 2 seconds
- Total default feed fetch time: ~2-3 seconds (for 4 feeds)

### Caching (Future Enhancement)

Consider caching default feed articles:
- Cache key: `default-feeds:{locale}:{date}`
- TTL: 1 hour
- Reduces API calls and improves performance

### Article Limits

- Default feeds: 2 articles per feed (8 articles total for 4 feeds)
- User feeds: Existing limits apply
- Total articles: 8-15 (balanced across all feeds)

## Testing Strategy

### Unit Tests

1. **Default Feed Service**:
   - `getDefaultFeeds()` returns correct feeds for locale
   - `isDefaultFeed()` correctly identifies default feeds
   - `fetchDefaultFeedArticles()` fetches and limits articles
   - Date filtering works correctly
   - Error handling for failed feeds

2. **Default Feed API**:
   - Valid requests return articles
   - Invalid locale returns 400
   - Invalid date returns 400
   - Future date returns 400
   - Date older than 7 days returns 400

3. **Newspaper Service**:
   - Default feeds filtered before saving
   - User feeds preserved
   - Backward compatibility maintained

4. **Historical Newspaper Service**:
   - Default feed articles fetched and merged
   - Balancing applied correctly
   - Article limits enforced

### Integration Tests

1. Create newspaper with default feeds → Verify they're not saved
2. Generate historical newspaper → Verify default feed articles included
3. Fetch default feed API → Verify response format and limits
4. Existing newspaper with default feeds → Verify still works

## Security Considerations

### Input Validation

- Locale: Must be 'en' or 'ja'
- Date: Must match YYYY-MM-DD format
- Date range: Must be within last 7 days

### Error Messages

- All error messages in English
- No sensitive information exposed
- Generic error messages for external users

### Rate Limiting

- Consider rate limiting default feed API
- Prevent abuse of free default feed fetching

## Deployment Plan

### Phase 1: Backend Implementation

1. Create default feed service
2. Create default feed API route
3. Update newspaper service
4. Update historical newspaper service
5. Add unit tests

### Phase 2: Testing

1. Run unit tests
2. Run integration tests
3. Manual testing in development

### Phase 3: Deployment

1. Deploy backend changes
2. Monitor CloudWatch logs
3. Verify default feed API works
4. Verify newspaper generation works
5. Verify historical newspapers work

### Phase 4: Monitoring

1. Monitor default feed API usage
2. Monitor default feed fetch success rate
3. Monitor newspaper generation performance
4. Monitor error rates

## Rollback Plan

If issues occur:

1. Revert backend deployment
2. Existing newspapers continue to work (backward compatible)
3. No data migration needed
4. No frontend changes needed

## Future Enhancements

1. **Caching**: Cache default feed articles for better performance
2. **User preferences**: Allow users to select preferred default feeds
3. **Dynamic selection**: Select default feeds based on theme
4. **Feed health monitoring**: Track and replace unhealthy default feeds
5. **Feed quality scoring**: Prioritize high-quality default feeds
6. **Configurable limits**: Allow admins to configure article limits per feed

## Related Documents

- [Requirements Document](./requirements.md)
- [Tasks Document](./tasks.md)
- [Issue #75](https://github.com/kumagaias/my-rss-press/issues/75)
