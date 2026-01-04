# Design Document: One-Click Newspaper Generation

## Overview

This document describes the design for simplifying the newspaper generation flow by combining feed suggestion and newspaper generation into a single action. The design focuses on improving user experience by reducing steps, moving feed editing to the save modal, and prioritizing theme-relevant articles over default feed articles.

## Architecture

### High-Level Flow

```
User enters theme → Clicks "Generate Newspaper"
    ↓
Frontend: Show loading animation
    ↓
Backend: Suggest feeds (Bedrock + DynamoDB + Popular)
    ↓
Backend: Mark default feeds
    ↓
Backend: Fetch articles from all feeds
    ↓
Backend: Limit default feed articles (max 2 per feed)
    ↓
Backend: Calculate importance and generate newspaper
    ↓
Frontend: Store data in session storage
    ↓
Frontend: Navigate to newspaper page
    ↓
User clicks "Save" → Modal shows feeds for editing
```

### Component Changes

**Frontend:**
- Home page: Remove feed list, change button text
- Newspaper page: Add feed editing to save modal
- Loading animation: Reuse existing component

**Backend:**
- New endpoint or modify existing flow
- Default feed marking logic
- Article selection with default feed limits

## Components and Interfaces

### Frontend Components

#### 1. Home Page (`frontend/app/page.tsx`)

**Changes:**
- Remove `FeedSelector` component display
- Change button text: "Get Feed Suggestions" → "Generate Newspaper"
- Remove `handleGetSuggestions` function
- Modify `handleGenerateNewspaper` to call combined endpoint
- Add loading state management

**New State:**
```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [generationError, setGenerationError] = useState<string | null>(null);
```

**New Function:**
```typescript
async function handleGenerateNewspaper() {
  setIsGenerating(true);
  setGenerationError(null);
  
  try {
    // Call combined endpoint
    const response = await fetch('/api/newspapers/generate', {
      method: 'POST',
      body: JSON.stringify({ theme, locale }),
    });
    
    const data = await response.json();
    
    // Store in session storage
    sessionStorage.setItem('newspaperArticles', JSON.stringify(data.articles));
    sessionStorage.setItem('newspaperFeeds', JSON.stringify(data.feedUrls));
    sessionStorage.setItem('newspaperFeedMetadata', JSON.stringify(data.feedMetadata));
    // ... other data
    
    // Navigate to newspaper page
    router.push('/newspaper');
  } catch (error) {
    setGenerationError(error.message);
  } finally {
    setIsGenerating(false);
  }
}
```

#### 2. Newspaper Settings Modal (`frontend/components/features/newspaper/NewspaperSettings.tsx`)

**New Features:**
- Display feed list with titles
- Add feed input field
- Remove feed button
- Feed URL validation

**New Props:**
```typescript
interface NewspaperSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: NewspaperSettings, feedUrls: string[]) => Promise<void>;
  locale: Locale;
  defaultName?: string;
  initialFeeds?: Array<{ url: string; title?: string; isDefault?: boolean }>;
}
```

**New State:**
```typescript
const [feeds, setFeeds] = useState<Array<{ url: string; title?: string; isDefault?: boolean }>>(initialFeeds || []);
const [newFeedUrl, setNewFeedUrl] = useState('');
const [feedError, setFeedError] = useState<string | null>(null);
```

#### 3. Loading Animation

**Reuse existing component** from Phase 2:
- `frontend/components/ui/LoadingAnimation.tsx`
- Add new message keys to i18n

**New i18n keys:**
```typescript
{
  en: {
    generatingNewspaper: "Generating your newspaper...",
    pleaseWait: "This may take up to 30 seconds",
  },
  ja: {
    generatingNewspaper: "新聞を生成中...",
    pleaseWait: "最大30秒かかる場合があります",
  }
}
```

### Backend Components

#### 1. New Endpoint: POST `/api/newspapers/generate`

**Purpose:** Combined feed suggestion and newspaper generation

**Request:**
```typescript
{
  theme: string;
  locale: 'en' | 'ja';
}
```

**Response:**
```typescript
{
  articles: Article[];
  feedUrls: string[];
  feedMetadata: Array<{
    url: string;
    title?: string;
    language?: string;
    isDefault: boolean;
  }>;
  newspaperName: string;
  summary?: string;
  languages: string[];
}
```

**Implementation:**
```typescript
// backend/src/routes/newspapers.ts
app.post('/api/newspapers/generate', async (c) => {
  const { theme, locale } = await c.req.json();
  
  // 1. Suggest feeds (existing logic)
  const feedSuggestions = await suggestFeeds(theme, locale);
  
  // 2. Mark default feeds
  const feedsWithMetadata = feedSuggestions.feeds.map(feed => ({
    ...feed,
    isDefault: feed.isDefault || false,
  }));
  
  // 3. Fetch articles
  const feedUrls = feedsWithMetadata.map(f => f.url);
  const { articles, feedLanguages, feedTitles } = await fetchArticlesForNewspaper(feedUrls, theme);
  
  // 4. Limit default feed articles
  const limitedArticles = limitDefaultFeedArticles(articles, feedsWithMetadata);
  
  // 5. Calculate importance
  const articlesWithImportance = await calculateImportanceForArticles(limitedArticles, theme, locale);
  
  // 6. Generate summary
  const summary = await generateSummary(articlesWithImportance, languages, locale);
  
  // 7. Return data
  return c.json({
    articles: articlesWithImportance,
    feedUrls,
    feedMetadata: feedsWithMetadata.map(f => ({
      url: f.url,
      title: feedTitles.get(f.url) || f.title,
      language: feedLanguages.get(f.url),
      isDefault: f.isDefault,
    })),
    newspaperName: feedSuggestions.newspaperName,
    summary,
    languages: Array.from(new Set(Array.from(feedLanguages.values()))),
  });
});
```

#### 2. Article Limiting Function

**Purpose:** Limit articles from default feeds

**Implementation:**
```typescript
// backend/src/services/articleLimiter.ts
export function limitDefaultFeedArticles(
  articles: Article[],
  feedMetadata: Array<{ url: string; isDefault: boolean }>
): Article[] {
  const MAX_DEFAULT_ARTICLES_PER_FEED = 2;
  
  // Group articles by feed
  const articlesByFeed = new Map<string, Article[]>();
  for (const article of articles) {
    const feedArticles = articlesByFeed.get(article.feedSource) || [];
    feedArticles.push(article);
    articlesByFeed.set(article.feedSource, feedArticles);
  }
  
  // Limit default feed articles
  const limitedArticles: Article[] = [];
  for (const [feedUrl, feedArticles] of articlesByFeed) {
    const feedMeta = feedMetadata.find(f => f.url === feedUrl);
    const isDefault = feedMeta?.isDefault || false;
    
    if (isDefault) {
      // Take only first N articles from default feeds
      limitedArticles.push(...feedArticles.slice(0, MAX_DEFAULT_ARTICLES_PER_FEED));
    } else {
      // Take all articles from non-default feeds
      limitedArticles.push(...feedArticles);
    }
  }
  
  return limitedArticles;
}
```

#### 3. Feed Metadata Storage

**Purpose:** Store feed metadata in session storage for save modal

**Session Storage Keys:**
```typescript
- newspaperArticles: Article[]
- newspaperFeeds: string[]
- newspaperFeedMetadata: Array<{ url: string; title?: string; isDefault: boolean }>
- newspaperTheme: string
- newspaperName: string
- newspaperSummary: string
- newspaperLanguages: string[]
- newspaperLocale: Locale
```

## Data Models

### Feed Metadata

```typescript
interface FeedMetadata {
  url: string;
  title?: string;
  language?: string;
  isDefault: boolean;
}
```

### Generation Response

```typescript
interface GenerationResponse {
  articles: Article[];
  feedUrls: string[];
  feedMetadata: FeedMetadata[];
  newspaperName: string;
  summary?: string;
  languages: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: One-Click Generation Completeness
*For any* valid theme input, clicking "Generate Newspaper" should result in either a successful newspaper page navigation or a clear error message, never leaving the user in an ambiguous state.

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Default Feed Article Limit
*For any* newspaper generation with default feeds, the number of articles from each default feed should not exceed 2 articles.

**Validates: Requirements 5.2**

### Property 3: Minimum Article Count Preservation
*For any* newspaper generation, even when limiting default feed articles, the total article count should be at least 8 articles (or all available if fewer than 8 exist).

**Validates: Requirements 5.5**

### Property 4: Feed Metadata Consistency
*For any* feed URL in the generated newspaper, there should be corresponding metadata (title, language, isDefault flag) stored in session storage.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 5: Button State Consistency
*For any* generation request, the button should be disabled during generation and re-enabled after completion or error.

**Validates: Requirements 2.5**

### Property 6: Loading Animation Visibility
*For any* generation process, the loading animation should be visible from the moment the button is clicked until the process completes or fails.

**Validates: Requirements 3.1, 3.5**

### Property 7: Feed Editing Preservation
*For any* feed list modification in the save modal, the modified list should be saved with the newspaper and retrievable on subsequent views.

**Validates: Requirements 4.6**

### Property 8: Locale-Specific Text
*For any* user locale (EN or JA), all UI text (button labels, loading messages, error messages) should be displayed in the correct language.

**Validates: Requirements 10.2, 10.3, 10.4, 10.5**

## Error Handling

### Frontend Error Handling

1. **Network Errors**: Display "Network error. Please check your connection."
2. **Timeout Errors**: Display "Request timed out. Please try again."
3. **API Errors**: Display error message from backend
4. **Validation Errors**: Display inline validation messages

### Backend Error Handling

1. **Bedrock Failures**: Fall back to DynamoDB + default feeds
2. **Feed Fetch Failures**: Continue with available feeds
3. **Timeout**: Return 504 Gateway Timeout
4. **Invalid Input**: Return 400 Bad Request with validation errors

## Testing Strategy

### Unit Tests

1. **Article Limiter**:
   - Test limiting default feed articles to 2 per feed
   - Test preserving non-default feed articles
   - Test minimum article count preservation

2. **Feed Metadata**:
   - Test marking default feeds correctly
   - Test extracting feed titles from RSS
   - Test handling missing metadata

3. **Session Storage**:
   - Test storing all required data
   - Test retrieving data for save modal
   - Test clearing data after save

### Integration Tests

1. **End-to-End Generation**:
   - Test complete flow from theme input to newspaper page
   - Test error handling at each step
   - Test timeout scenarios

2. **Save Modal**:
   - Test displaying feeds with metadata
   - Test adding new feeds
   - Test removing feeds
   - Test saving with modified feeds

### Property-Based Tests

1. **Property 1**: Generate newspapers with random themes, verify navigation or error
2. **Property 2**: Generate newspapers with default feeds, verify article limits
3. **Property 3**: Generate newspapers with limited articles, verify minimum count
4. **Property 4**: Generate newspapers, verify feed metadata consistency
5. **Property 5**: Simulate button clicks, verify button state transitions
6. **Property 6**: Simulate generation, verify loading animation visibility
7. **Property 7**: Modify feeds in modal, verify persistence
8. **Property 8**: Test with both locales, verify text translations

## Performance Considerations

1. **Combined Endpoint**: ~25-30 seconds total (20s feeds + 5s generation)
2. **Timeout**: Set to 30 seconds to stay within API Gateway limits
3. **Caching**: Reuse existing feed usage cache
4. **Parallel Processing**: Maintain parallel feed fetching

## Migration Strategy

1. **No Database Migration**: No changes to existing newspaper schema
2. **Backward Compatibility**: Existing newspapers continue to work
3. **Gradual Rollout**: New flow for new newspapers only
4. **Session Storage**: Temporary storage, no persistence required

## Security Considerations

1. **Input Validation**: Validate theme and locale on backend
2. **Feed URL Validation**: Validate URLs before fetching
3. **Rate Limiting**: Apply existing rate limits to new endpoint
4. **CORS**: Maintain existing CORS configuration
