# Design Document - Phase 2

## Overview

Phase 2 adds language support, historical newspaper viewing, enhanced search capabilities, and visual improvements to MyRSSPress. The system automatically detects article languages (Japanese/English), enables language-based filtering, provides date-based newspaper archives (7-day retention), and enhances user experience with loading animations and AI-generated summaries.

Key enhancements:
1. Language detection and filtering (JP/EN)
2. Historical newspaper viewing with date-based URLs
3. Free-word search for newspapers
4. Loading animations during generation
5. Enhanced main area with guaranteed images
6. AI-generated newspaper summaries (3 lines, 100-200 characters)
7. Extended database schema for new features

Project structure remains the same as Phase 1:
- `backend/` - TypeScript/Hono API server (for Lambda)
- `frontend/` - Next.js + TailwindCSS (for Amplify Hosting)
- `infra/` - Terraform IaC code

## Architecture

### Updated System Architecture

Phase 2 adds the following components to the existing architecture:

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js + TailwindCSS)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Language     │  │ Date-Based   │  │ Search       │      │
│  │ Filter       │  │ Navigation   │  │ Component    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│           Backend API (TypeScript/Hono on Lambda)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Language     │  │ Historical   │  │ Summary      │      │
│  │ Detector     │  │ Newspaper    │  │ Generator    │      │
│  │              │  │ Service      │  │ (Bedrock)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   AWS Bedrock    │  │   DynamoDB       │  │  EventBridge │
│   (Language +    │  │   (Extended      │  │  (Cleanup    │
│    Summary)      │  │    Schema)       │  │   Schedule)  │
└──────────────────┘  └──────────────────┘  └──────────────┘
```

### New Components

**Frontend:**
- Language filter component (JP/EN selection)
- Date picker for historical newspapers
- Search input with real-time filtering
- Loading animation component
- Copyright-free image placeholder service

**Backend:**
- Language detection service
- Historical newspaper service
- Summary generation service (Bedrock)
- Cleanup Lambda function (scheduled execution)

**Infrastructure:**
- EventBridge rule for daily cleanup
- Extended DynamoDB schema


## Key Service Designs

### 0. Article Filtering Service

**Purpose**: Filter articles by theme relevance to prevent unrelated content from appearing in newspapers

**Problem**: When using general news feeds (e.g., Yahoo News, Asahi Shimbun), articles unrelated to the user's theme (e.g., "cooking", "movies") are included, degrading user experience.

**Solution**: Use AI to judge article relevance and filter out unrelated content

**Implementation**: Batch judgment using Bedrock

```typescript
// backend/src/services/articleFilterService.ts

interface ArticleRelevanceResult {
  relevantIndices: number[];
  totalArticles: number;
  filteredCount: number;
}

/**
 * Filter articles by theme relevance using batch AI judgment
 * @param articles - Articles to filter
 * @param theme - User's theme keyword
 * @param locale - Language for prompt
 * @param minThreshold - Minimum relevance threshold (default: 0.3)
 * @returns Filtered articles
 */
export async function filterArticlesByTheme(
  articles: Article[],
  theme: string,
  locale: 'en' | 'ja' = 'en',
  minThreshold: number = 0.3
): Promise<Article[]> {
  // If too few articles, don't filter
  if (articles.length < 8) {
    console.log(`[Article Filter] Too few articles (${articles.length}), skipping filter`);
    return articles;
  }

  try {
    // Build prompt for batch judgment
    const prompt = buildFilterPrompt(articles, theme, locale);
    
    console.log(`[Article Filter] Filtering ${articles.length} articles for theme: "${theme}"`);
    
    // Call Bedrock for batch judgment
    const result = await callBedrockForFiltering(prompt);
    
    // Parse response
    const relevantIndices = parseFilterResponse(result);
    
    // Filter articles
    const filteredArticles = relevantIndices
      .filter(i => i >= 0 && i < articles.length)
      .map(i => articles[i]);
    
    console.log(`[Article Filter] Filtered: ${filteredArticles.length}/${articles.length} articles relevant`);
    
    // If too few articles after filtering, return all
    if (filteredArticles.length < 8) {
      console.log(`[Article Filter] Too few filtered articles (${filteredArticles.length}), returning all`);
      return articles;
    }
    
    return filteredArticles;
  } catch (error) {
    console.error('[Article Filter] Filtering failed, returning all articles:', error);
    return articles; // Fallback: return all articles
  }
}

/**
 * Build prompt for batch article filtering
 */
function buildFilterPrompt(
  articles: Article[],
  theme: string,
  locale: 'en' | 'ja'
): string {
  const articleList = articles
    .map((a, i) => `${i}. ${a.title}`)
    .join('\n');
  
  if (locale === 'ja') {
    return `テーマ: ${theme}

以下の記事のうち、テーマに関連する記事のインデックス番号を配列で返してください。
関連性が低い記事は除外してください。

記事リスト:
${articleList}

JSON形式で返してください（説明不要）:
{ "relevantIndices": [0, 3, 5, ...] }`;
  } else {
    return `Theme: ${theme}

From the following articles, return the index numbers of articles related to the theme.
Exclude articles with low relevance.

Article list:
${articleList}

Return in JSON format (no explanation):
{ "relevantIndices": [0, 3, 5, ...] }`;
  }
}

/**
 * Call Bedrock for article filtering
 */
async function callBedrockForFiltering(prompt: string): Promise<any> {
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // Lower temperature for more consistent filtering
    }),
  });
  
  const response = await bedrockClient.send(command);
  return JSON.parse(new TextDecoder().decode(response.body));
}

/**
 * Parse Bedrock response to extract relevant article indices
 */
function parseFilterResponse(response: any): number[] {
  try {
    const content = response.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.relevantIndices || [];
  } catch (error) {
    console.error('[Article Filter] Failed to parse response:', error);
    throw error;
  }
}
```

**Integration into newspaper generation:**

```typescript
// backend/src/services/historicalNewspaperService.ts

async function generateNewspaper(
  feedUrls: string[],
  theme: string,
  locale: 'en' | 'ja'
): Promise<NewspaperData> {
  // 1. Fetch articles from feeds
  const allArticles = await fetchArticlesFromFeeds(feedUrls);
  
  // 2. Filter articles by theme relevance (NEW)
  const filteredArticles = await filterArticlesByTheme(
    allArticles,
    theme,
    locale,
    0.3 // 30% relevance threshold
  );
  
  // 3. Calculate importance scores
  const articlesWithImportance = await calculateImportance(
    filteredArticles,
    theme
  );
  
  // 4. Continue with existing logic...
  const languages = await detectLanguages(articlesWithImportance);
  const summary = await generateSummary(articlesWithImportance, theme, languages);
  
  return {
    articles: articlesWithImportance,
    languages,
    summary,
    // ...
  };
}
```

**Benefits:**
1. **Improved relevance**: Only theme-related articles displayed
2. **Better UX**: Users see content they're interested in
3. **Efficient**: Single API call for all articles (~2-5 seconds)
4. **Robust**: Falls back to all articles if filtering fails

**Performance:**
- Filtering time: ~2-5 seconds for 15 articles
- Cost: ~$0.0001 per newspaper generation
- Fallback: Show all articles if filtering fails or results in < 8 articles

**Alternative approaches considered:**
1. ❌ Individual article scoring: Too slow (15 × 1s = 15s)
2. ❌ Keyword matching: Low accuracy
3. ✅ Batch judgment: Fast and accurate

### 1. Feed Quality Improvement Service

**Purpose**: Improve AI-suggested feed quality and reduce invalid/terminated feed URLs

**Problem**: Currently, Bedrock AI sometimes suggests invalid (404) or terminated service URLs, causing errors when users try to fetch articles.

**Solution**:

#### 1. Maintain Reliable Feeds List by Category

**Implementation**: Extend default feeds and organize by category

```typescript
// backend/src/constants/reliableFeeds.ts
export const RELIABLE_FEEDS_BY_CATEGORY = {
  technology: [
    { url: 'https://techcrunch.com/feed/', title: 'TechCrunch', language: 'EN' },
    { url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', language: 'EN' },
    { url: 'https://www.wired.com/feed/rss', title: 'WIRED', language: 'EN' },
  ],
  business: [
    { url: 'https://www.bloomberg.com/feed/podcast/etf-report.xml', title: 'Bloomberg', language: 'EN' },
    { url: 'https://www.ft.com/?format=rss', title: 'Financial Times', language: 'EN' },
  ],
  politics: [
    { url: 'https://www.bbc.com/news/politics/rss.xml', title: 'BBC Politics', language: 'EN' },
    { url: 'https://www.politico.com/rss/politics08.xml', title: 'Politico', language: 'EN' },
  ],
  // Japanese categories
  'technology-jp': [
    { url: 'https://www.itmedia.co.jp/rss/2.0/news_bursts.xml', title: 'ITmedia', language: 'JP' },
    { url: 'https://japan.cnet.com/rss/index.rdf', title: 'CNET Japan', language: 'JP' },
  ],
  'business-jp': [
    { url: 'https://www.nikkei.com/rss/', title: 'Nikkei', language: 'JP' },
  ],
  // ... other categories
};

// Category mapping (infer category from theme)
export function getCategoryFromTheme(theme: string, locale: 'en' | 'ja'): string | null {
  const themeLower = theme.toLowerCase();
  const suffix = locale === 'ja' ? '-jp' : '';
  
  if (themeLower.includes('tech') || themeLower.includes('テクノロジー')) {
    return `technology${suffix}`;
  }
  if (themeLower.includes('business') || themeLower.includes('ビジネス')) {
    return `business${suffix}`;
  }
  if (themeLower.includes('politics') || themeLower.includes('政治')) {
    return `politics${suffix}`;
  }
  // ... other categories
  
  return null; // Category not found
}
```

#### 2. Add Feed Health Check

**Implementation**: Periodically check feed health

```typescript
// backend/src/services/feedHealthCheckService.ts
interface FeedHealthStatus {
  url: string;
  isHealthy: boolean;
  lastChecked: Date;
  lastArticleDate?: Date;
  errorMessage?: string;
}

async function checkFeedHealth(url: string): Promise<FeedHealthStatus> {
  try {
    const feed = await parser.parseURL(url);
    
    // Check if articles exist
    if (!feed.items || feed.items.length === 0) {
      return {
        url,
        isHealthy: false,
        lastChecked: new Date(),
        errorMessage: 'No articles found',
      };
    }
    
    // Check latest article date (healthy if within 30 days)
    const latestArticle = feed.items[0];
    const latestDate = latestArticle.pubDate ? new Date(latestArticle.pubDate) : null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const isHealthy = latestDate ? latestDate > thirtyDaysAgo : false;
    
    return {
      url,
      isHealthy,
      lastChecked: new Date(),
      lastArticleDate: latestDate || undefined,
      errorMessage: isHealthy ? undefined : 'No recent articles (> 30 days)',
    };
  } catch (error) {
    return {
      url,
      isHealthy: false,
      lastChecked: new Date(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Benefits**:
1. **Quality improvement**: Prioritize reliable feeds
2. **Error reduction**: Reduce invalid URL suggestions
3. **Performance**: Reduce validation time with caching
4. **Learning**: Accumulate validation results for future suggestions

**Implementation priority**: After Phase 2 (implement as Phase 3)


### 1. Language Detection Service

**Implementation**: RSS feed language field + character-based detection

```typescript
// Get language field from RSS parser
async function parseFeedWithLanguage(url: string): Promise<{ articles: Article[], language?: string }> {
  const feed = await parser.parseURL(url);
  const language = feed.language; // RSS <language> field
  
  const articles = feed.items.map(item => ({
    title: item.title,
    description: item.description,
    link: item.link,
    pubDate: new Date(item.pubDate),
    imageUrl: extractImageUrl(item),
    feedSource: url,
  }));
  
  return { articles, language };
}

// Character-based language detection (fallback)
function detectLanguage(text: string): 'JP' | 'EN' {
  // Count Japanese characters (hiragana, katakana, kanji)
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g);
  const japaneseCount = japaneseChars ? japaneseChars.length : 0;
  
  // If > 10% Japanese characters, classify as Japanese
  const threshold = text.length * 0.1;
  return japaneseCount > threshold ? 'JP' : 'EN';
}

async function detectLanguages(
  articles: Article[], 
  feedLanguages: Map<string, string>
): Promise<string[]> {
  const languages = new Set<string>();
  
  for (const article of articles) {
    // Priority 1: Check RSS feed <language> field
    const feedLanguage = feedLanguages.get(article.feedSource);
    if (feedLanguage) {
      const lang = feedLanguage.startsWith('ja') ? 'JP' : 'EN';
      languages.add(lang);
      continue;
    }
    
    // Priority 2: Detect from article content (title + first 50 chars of description)
    const description = article.description || '';
    const text = `${article.title} ${description.substring(0, 50)}`;
    const language = detectLanguage(text);
    languages.add(language);
  }
  
  return Array.from(languages);
}
```

**Rationale:**
- Cost: Zero
- Speed: < 1ms/article
- Accuracy: Sufficient for JP/EN distinction
- AWS Comprehend not used (cost reduction)

**Alternative:** AWS Comprehend (more accurate but higher cost)
- Cost: $0.0001/request
- Speed: ~100ms/article
- Can upgrade later if needed

### 2. Summary Generation Service

**Implementation**: Using Bedrock (Claude 3 Haiku)

```typescript
async function generateSummary(
  articles: Article[],
  theme: string,
  languages: string[] // Newspaper language attributes
): Promise<string> {
  const articleList = articles
    .slice(0, 10) // Use only top 10 articles
    .map((a, i) => `${i + 1}. ${a.title}`)
    .join('\n');
  
  // Determine summary language based on newspaper languages
  // Priority: JP > EN > others (for future expansion)
  const summaryLanguage = determineSummaryLanguage(languages);
  
  const prompt = summaryLanguage === 'ja'
    ? `以下は「${theme}」に関する新聞記事のタイトルです。
この新聞の内容を3行（100-200文字）で要約してください。

記事タイトル:
${articleList}

要約（3行、100-200文字）:`
    : `The following are newspaper article titles about "${theme}".
Please summarize the content of this newspaper in 3 lines (100-200 characters).

Article titles:
${articleList}

Summary (3 lines, 100-200 characters):`;
  
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });
  
  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.content[0].text.trim();
}
```

**Language determination logic (for future expansion):**
```typescript
function determineSummaryLanguage(languages: string[]): string {
  // Priority: JP > EN > others (for future expansion)
  if (languages.includes('JP')) return 'ja';
  if (languages.includes('EN')) return 'en';
  
  // For future language additions
  // if (languages.includes('ZH')) return 'zh'; // Chinese
  // if (languages.includes('KO')) return 'ko'; // Korean
  
  // Default to English
  return 'en';
}
```

**Caching strategy:**
- First generation: ~5-10 seconds
- Subsequent access: Retrieved from DynamoDB (< 100ms)
- Cost: ~$0.0001/summary

**Error handling:**
- Bedrock API failure: Display newspaper without summary
- Timeout: 10 seconds
- Retry: Up to 3 times (exponential backoff)


### 3. Historical Newspaper Service

**URL Structure:**
```
/newspapers/[newspaperId]/[date]
Example: /newspapers/uuid-1234/2025-12-09
```

**Implementation:**

```typescript
async function getOrCreateNewspaper(
  newspaperId: string,
  date: string,
  feedUrls: string[],
  theme: string
): Promise<NewspaperData> {
  // Validate date
  const validation = validateDate(date);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Get existing newspaper
  const existing = await getNewspaperByDate(newspaperId, date);
  if (existing) {
    return existing; // Return from cache
  }
  
  // Generate new newspaper
  const articles = await fetchArticlesForDate(feedUrls, date);
  const articlesWithImportance = await calculateImportance(articles, theme);
  const languages = await detectLanguages(articlesWithImportance);
  const summary = await generateSummary(articlesWithImportance, theme, 'ja');
  
  const newspaper: NewspaperData = {
    newspaperId,
    newspaperDate: date,
    articles: articlesWithImportance,
    languages,
    summary,
    createdAt: new Date().toISOString(),
  };
  
  await saveNewspaper(newspaper);
  return newspaper;
}

function validateDate(date: string): { valid: boolean; error?: string } {
  // All dates are processed in JST (Asia/Tokyo)
  const targetDate = new Date(date + 'T00:00:00+09:00'); // JST
  const today = new Date();
  
  // Today's date in JST (00:00:00)
  const todayJST = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  todayJST.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(todayJST);
  sevenDaysAgo.setDate(todayJST.getDate() - 7);
  
  // Check if future
  if (targetDate > todayJST) {
    return { valid: false, error: 'Future newspapers are not available' };
  }
  
  // Check if older than 7 days
  if (targetDate < sevenDaysAgo) {
    return { valid: false, error: 'Newspapers older than 7 days are not available' };
  }
  
  return { valid: true };
}
```

**Article fetching logic:**
```typescript
async function fetchArticlesForDate(
  feedUrls: string[],
  date: string
): Promise<Article[]> {
  // All dates are processed in JST (Asia/Tokyo)
  const targetDate = new Date(date + 'T00:00:00+09:00'); // JST
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayJST = new Date(nowJST);
  todayJST.setHours(0, 0, 0, 0);
  
  const endTime = targetDate.getTime() === todayJST.getTime()
    ? nowJST // If today, up to current time (JST)
    : new Date(targetDate.setHours(23, 59, 59, 999)); // Otherwise, full day
  
  // Fetch all articles
  const allArticles = await Promise.all(
    feedUrls.map(url => parseFeed(url))
  ).then(results => results.flat());
  
  // Filter by date range
  let articles = allArticles.filter(article => {
    const pubDate = new Date(article.pubDate);
    return pubDate >= startOfDay && pubDate <= endTime;
  });
  
  // If insufficient, go back further
  const minArticles = 8;
  if (articles.length < minArticles) {
    const sevenDaysAgo = new Date(startOfDay);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    articles = allArticles.filter(article => {
      const pubDate = new Date(article.pubDate);
      return pubDate >= sevenDaysAgo && pubDate <= endTime;
    });
  }
  
  // Sort by date (newest first) and select 8-15 articles
  articles.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  
  const targetCount = Math.floor(Math.random() * 8) + 8; // 8-15
  return articles.slice(0, targetCount);
}
```

### 4. Cleanup Service

**Implementation**: Runs daily at 3 AM JST

```typescript
async function cleanupOldNewspapers(): Promise<{ deletedCount: number }> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Query newspapers older than 7 days
  const oldNewspapers = await queryOldNewspapers(cutoffDate);
  
  // Delete in batches
  let deletedCount = 0;
  const batchSize = 25; // DynamoDB batch write limit
  
  for (let i = 0; i < oldNewspapers.length; i += batchSize) {
    const batch = oldNewspapers.slice(i, i + batchSize);
    await deleteBatch(batch);
    deletedCount += batch.length;
  }
  
  console.log(`Cleanup complete: ${deletedCount} newspapers deleted`);
  return { deletedCount };
}
```

**EventBridge Schedule:**
```hcl
# infra/modules/eventbridge/main.tf
resource "aws_cloudwatch_event_rule" "cleanup_schedule" {
  name                = "myrsspress-cleanup-schedule"
  description         = "Trigger cleanup Lambda daily at 3 AM JST"
  schedule_expression = "cron(0 18 * * ? *)" # 3 AM JST = 6 PM UTC (previous day)
}
```

### 5. Copyright-Free Image Service

**Implementation**: Using Unsplash Source API

```typescript
export function CopyrightFreeImage({ theme, alt }: { theme?: string; alt: string }) {
  // Use Unsplash Source API
  const imageUrl = theme 
    ? `https://source.unsplash.com/800x600/?${encodeURIComponent(theme)}`
    : 'https://source.unsplash.com/800x600/?newspaper,news';
  
  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-auto object-cover"
      onError={(e) => {
        // Fallback: Local placeholder
        e.currentTarget.src = '/placeholder-newspaper.jpg';
      }}
    />
  );
}
```

**Usage example:**
```typescript
// Lead article
<article className="lead-article">
  {layout.lead.imageUrl ? (
    <img src={layout.lead.imageUrl} alt={layout.lead.title} />
  ) : (
    <CopyrightFreeImage theme={theme} alt={layout.lead.title} />
  )}
  {/* Rest of article */}
</article>
```

**Alternative services:**
- Unsplash Source API: `https://source.unsplash.com/`
- Picsum Photos: `https://picsum.photos/`
- Lorem Picsum: `https://loremflickr.com/`

**Note:** Consider caching placeholder images to avoid repeated API calls.


## Data Models

### Extended Newspaper Model

```typescript
interface Newspaper {
  newspaperId: string;      // UUID
  newspaperDate?: string;   // ISO 8601 date (YYYY-MM-DD) - New
  name: string;             // Newspaper name
  userName: string;         // Creator name
  userId?: string;          // User ID (optional)
  feedUrls: string[];       // RSS feed URLs
  languages?: string[];     // Language tags ["JP", "EN"] - New (optional)
  summary?: string;         // AI-generated summary - New
  articles?: Article[];     // Article data (for historical newspapers) - New
  createdAt: string;        // Creation timestamp (ISO 8601)
  updatedAt: string;        // Update timestamp (ISO 8601)
  viewCount: number;        // View count
  isPublic: boolean;        // Public/private
}
```

### Backward Compatibility for Existing Newspapers

**Problem**: Existing newspapers created in Phase 1 don't have the `languages` field

**Solution**:

1. **Make field optional**:
   - `languages?: string[]` - May not exist
   - Use `?` in TypeScript type definition

2. **Default handling in frontend**:
   ```typescript
   // Handling in language filter
   function filterByLanguage(newspapers: Newspaper[], selectedLanguage: 'JP' | 'EN'): Newspaper[] {
     return newspapers.filter(newspaper => {
       // If no languages field, display in all language filters
       if (!newspaper.languages || newspaper.languages.length === 0) {
         return true; // Always display newspapers with unknown language
       }
       return newspaper.languages.includes(selectedLanguage);
     });
   }
   ```

3. **Backend handling**:
   ```typescript
   // When retrieving existing newspapers
   async function getNewspaper(newspaperId: string): Promise<Newspaper> {
     const newspaper = await dynamodb.get({ PK: `NEWSPAPER#${newspaperId}`, SK: 'METADATA' });
     
     // Default to empty array if no languages field
     return {
       ...newspaper,
       languages: newspaper.languages || [],
     };
   }
   ```

4. **UI display**:
   - Newspapers without language tags: Don't display language badge
   - Or display "Language unknown" badge

5. **Search handling**:
   - When language filter is selected, include newspapers without `languages` in results
   - Users can view newspapers with unknown language

**No migration needed**:
- No need to update existing newspaper records
- Only newly created newspapers will have `languages` field
- New fields are added gradually

**Behavior of newspapers without language settings**:

1. **Display**: Shown in all language filters
   - JP filter selected: ✅ Displayed
   - EN filter selected: ✅ Displayed
   - Reason: Prevent users from not being able to see existing newspapers

2. **Search**: Searchable with free-word search
   - Search by title: ✅ Searchable
   - Search by feed URL: ✅ Searchable
   - Searched regardless of language

3. **Popular/Recent newspapers**: Displayed normally
   - Sort order: View count or creation date
   - Remains after language filter applied

4. **UI display**: Don't display language badge
   - No language tag → No badge
   - Or display "Language unknown" badge (optional)

5. **API response**: Return as `languages: []`
   ```json
   {
     "newspaperId": "uuid-1234",
     "name": "Old Newspaper",
     "languages": [],  // Empty array
     "createdAt": "2025-12-01T10:00:00Z"
   }
   ```

### DynamoDB Schema Update

**Newspapers Table:**

**Primary Key:**
- Partition Key: `PK` = `NEWSPAPER#{newspaperId}` (String)
- Sort Key: `SK` = `DATE#{date}` or `METADATA` (String)

**Attributes:**
- All existing attributes from Phase 1
- `languages: string[]` - Language tags (e.g., ["JP", "EN"])
- `summary: string` - AI-generated summary (100-200 characters)
- `newspaperDate: string` - Date in YYYY-MM-DD format
- `articles: Article[]` - Complete article data (for historical newspapers)

**Access Patterns:**

1. **Get newspaper metadata (current)**:
   - `PK = NEWSPAPER#{newspaperId}`, `SK = METADATA`

2. **Get newspaper for specific date**:
   - `PK = NEWSPAPER#{newspaperId}`, `SK = DATE#{date}`

3. **Get all dates for a newspaper**:
   - `PK = NEWSPAPER#{newspaperId}`, `SK begins_with DATE#`

4. **Get public newspapers by language**:
   - Query using GSI, then filter by language on client side

**Record examples:**

```typescript
// Current newspaper (metadata only)
{
  PK: "NEWSPAPER#uuid-1234",
  SK: "METADATA",
  newspaperId: "uuid-1234",
  name: "Tech Morning Digest",
  userName: "John Doe",
  feedUrls: ["https://example.com/tech-feed"],
  languages: ["EN"],
  summary: "Today's tech news covers AI advances, startup funding, and cloud computing trends.",
  createdAt: "2025-12-09T10:00:00Z",
  updatedAt: "2025-12-09T10:00:00Z",
  viewCount: 42,
  isPublic: true,
  GSI1PK: "PUBLIC",
  GSI1SK: "VIEWS#0042#uuid-1234",
  GSI2PK: "PUBLIC",
  GSI2SK: "CREATED#2025-12-09T10:00:00Z#uuid-1234"
}

// Historical newspaper (with articles)
{
  PK: "NEWSPAPER#uuid-1234",
  SK: "DATE#2025-12-09",
  newspaperId: "uuid-1234",
  newspaperDate: "2025-12-09",
  name: "Tech Morning Digest",
  feedUrls: ["https://example.com/tech-feed"],
  languages: ["EN"],
  summary: "Today's tech news covers AI advances...",
  articles: [
    {
      title: "AI Breakthrough",
      description: "...",
      link: "https://...",
      pubDate: "2025-12-09T08:00:00Z",
      imageUrl: "https://...",
      importance: 85
    }
  ],
  createdAt: "2025-12-09T10:00:00Z"
}
```


## API Endpoints

### New Endpoints

#### GET /api/newspapers/:newspaperId/:date
**Purpose**: Get or create newspaper for a specific date

**Request:**
```
GET /api/newspapers/uuid-1234/2025-12-09
```

**Response:**
```json
{
  "newspaperId": "uuid-1234",
  "newspaperDate": "2025-12-09",
  "name": "Tech Morning Digest",
  "languages": ["EN"],
  "summary": "Today's tech news covers AI advances, startup funding, and cloud computing trends.",
  "articles": [...],
  "createdAt": "2025-12-09T10:00:00Z"
}
```

**Error Responses:**
```json
// Future date
{
  "error": "Future newspapers are not available",
  "code": "FUTURE_DATE"
}

// Too old
{
  "error": "Newspapers older than 7 days are not available",
  "code": "DATE_TOO_OLD"
}

// Invalid date format
{
  "error": "Invalid date format. Use YYYY-MM-DD",
  "code": "INVALID_DATE"
}
```

#### GET /api/newspapers/:newspaperId/dates
**Purpose**: Get list of available dates for a newspaper

**Response:**
```json
{
  "dates": [
    "2025-12-09",
    "2025-12-08",
    "2025-12-07",
    "2025-12-06"
  ]
}
```

### Updated Endpoints

#### POST /api/newspapers
**Request (updated):**
```json
{
  "name": "Tech Morning Digest",
  "userName": "John Doe",
  "feedUrls": ["https://example.com/tech-feed"],
  "articles": [...],
  "theme": "Tech",
  "locale": "ja",
  "isPublic": true
}
```

**Response (updated):**
```json
{
  "newspaperId": "uuid-1234",
  "languages": ["EN"],
  "summary": "Today's tech news covers AI advances...",
  "createdAt": "2025-12-09T10:00:00Z"
}
```

**Backend processing:**
1. Detect languages from articles
2. Generate summary using Bedrock
3. Save newspaper with languages and summary

#### GET /api/newspapers?sort=popular&limit=10&language=JP
**Request (updated):**
```
GET /api/newspapers?sort=popular&limit=10&language=JP
```

**Query Parameters:**
- `sort`: `popular` or `recent`
- `limit`: Number of results (default: 10, max: 50)
- `language`: `JP`, `EN`, or omit for all (new)

**Response (updated):**
```json
{
  "newspapers": [
    {
      "newspaperId": "uuid-1234",
      "name": "Tech Morning Digest",
      "userName": "John Doe",
      "languages": ["JP", "EN"],
      "summary": "Today's tech news...",
      "createdAt": "2025-12-09T10:00:00Z",
      "viewCount": 42
    }
  ]
}
```


## Correctness Properties

*A property is a characteristic or behavior that should be true for all valid executions of the system. It's essentially a formal statement about what the system should do. Properties bridge the gap between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Japanese Language Detection
For *any* article containing Japanese characters (hiragana, katakana, or kanji), language detection should identify it as "JP"
**Verifies: Requirements 1.1, 1.2**

### Property 2: English Language Detection
For *any* article containing no Japanese characters, language detection should identify it as "EN"
**Verifies: Requirements 1.1, 1.3**

### Property 3: Mixed Language Detection
For *any* newspaper containing both Japanese and English articles, the languages array should contain both ["JP", "EN"]
**Verifies: Requirement 1.4**

### Property 4: Language Filter Accuracy
For *any* language filter selection (JP or EN), all displayed newspapers should contain that language in their languages array
**Verifies: Requirements 2.4, 2.5, 2.6**

### Property 5: Default Language Selection
For *any* user with Japanese UI locale, the default language filter should be "JP", and for English UI locale, it should be "EN"
**Verifies: Requirements 2.2, 2.3**

### Property 6: Search Filter Completeness
For *any* search query, all displayed newspapers should contain the query string in either title or feed URL
**Verifies: Requirements 3.3, 3.4**

### Property 7: Date Validation - Future Rejection
For *any* future date, the system should reject the request with "Future newspapers are not available" error
**Verifies: Requirement 4.6**

### Property 8: Date Validation - 7-Day Window
For *any* date older than 7 days from today, the system should reject the request with appropriate error message
**Verifies: Requirement 4.7**

### Property 9: Historical Newspaper Caching
For *any* previously accessed date, the second access should return the same newspaper without regeneration
**Verifies: Requirement 4.5**

### Property 10: Date-Based Article Filtering
For *any* historical newspaper generation, articles should be prioritized from the target date (00:00 to current time)
**Verifies: Requirements 4.3, 4.4**

### Property 11: Summary Length Constraint
For *any* generated summary, it should be between 100 and 250 characters
**Verifies: Requirement 7.2**

### Property 12: Summary Caching
For *any* newspaper saved with a summary, retrieving it again should return the same summary without regeneration
**Verifies: Requirement 7.5**

### Property 13: Main Area Image Presence
For *any* newspaper layout, the lead article should always have an image (original or copyright-free placeholder)
**Verifies: Requirements 6.1, 6.3**

### Property 14: Cleanup Date Threshold
For *any* newspaper older than 7 days, the cleanup process should delete it
**Verifies: Requirement 10.1**

### Property 15: Language Persistence
For *any* saved newspaper, retrieving it by ID should return the same languages array
**Verifies: Requirements 1.5, 8.1**

### Property 16: Summary Persistence
For *any* newspaper saved with a summary, retrieving it by ID should return the same summary
**Verifies: Requirements 7.4, 8.2**

### Property 17: Date-Based URL Structure
For *any* newspaper with a date parameter, the URL should follow the format /newspapers/[id]/[YYYY-MM-DD]
**Verifies: Requirement 4.1**

### Property 18: Loading Animation Display
For *any* newspaper generation process, a loading animation should be displayed until completion
**Verifies: Requirements 5.1, 5.2, 5.3**

### Property 19: Article Filtering Relevance
For *any* newspaper generation with article filtering enabled, all displayed articles should be relevant to the theme (relevance score >= 0.3)
**Verifies: Requirement 11.1, 11.3**

### Property 20: Article Filtering Fallback
For *any* article filtering failure or result with fewer than 8 articles, the system should fall back to displaying all articles
**Verifies: Requirement 11.5, 11.6**

### Property 21: Article Filtering Performance
For *any* article filtering operation, the processing time should be less than 10 seconds
**Verifies: Requirement 11.2, 11.4**

## Test Strategy

### Unit Tests

**Frontend:**
- Language filter component behavior
- Search filter logic
- Date validation logic
- Date navigation component
- Loading animation display
- Copyright-free image fallback

**Backend:**
- Language detection algorithm (Japanese character counting)
- Summary generation with Bedrock
- Historical newspaper service
- Date validation logic
- Cleanup service logic
- Article filtering by date range

**Coverage Goal:** 60% or higher

### Property-Based Tests

**Test Framework:** fast-check

**Configuration:**
- Each property test runs at least 100 iterations
- Each test explicitly references design document correctness properties
- Tag format: `**Feature: phase-2, Property {number}: {property_text}**`

**Properties to Test:**
1. Language detection (Properties 1, 2, 3)
2. Language filtering (Properties 4, 5)
3. Search filtering (Property 6)
4. Date validation (Properties 7, 8)
5. Historical newspaper caching (Property 9)
6. Date-based article filtering (Property 10)
7. Summary generation (Properties 11, 12)
8. Image presence (Property 13)
9. Cleanup logic (Property 14)
10. Data persistence (Properties 15, 16, 17)
11. Loading animation (Property 18)

### E2E Tests (Playwright)

**New Test Scenarios:**
- Language filter selection and newspaper filtering
- Free-word search functionality
- Date navigation (previous/next day)
- Historical newspaper generation on first access
- Historical newspaper retrieval on second access
- Future date rejection
- Old date (> 7 days) rejection
- Loading animation display during generation
- Summary display in newspaper
- Copyright-free image fallback

## Performance Optimization

### Language Detection

**Strategy:** Character-based detection (no external API)
- Execution time: < 1ms/article
- Cost: Zero
- Accuracy: Sufficient for JP/EN detection

### Summary Generation

**Strategy:** Cache summaries in DynamoDB
- First generation: ~5-10 seconds
- Subsequent retrieval: < 100ms (from cache)
- Cost: ~$0.0001/generation

### Historical Newspaper Loading

**Strategy:** Lazy loading and caching
- First access: Generate and save (~5-8 seconds)
- Second access: Retrieve from DynamoDB (< 200ms)
- No regeneration needed

### Search and Filtering

**Strategy:** Client-side filtering (no backend query)
- Execution time: < 100ms for 100 newspapers
- Backend cost: Zero
- Real-time updates

### Cleanup Performance

**Strategy:** Batch deletion with pagination
- Process 25 newspapers per batch (DynamoDB limit)
- Execution time: ~1-2 seconds per 100 newspapers
- Scheduled during low-traffic hours (3 AM JST)

## Deployment

### Infrastructure Updates

**New Resources:**
- EventBridge rule for cleanup schedule
- Cleanup Lambda function
- Extended DynamoDB schema (no migration needed)

**Terraform Modules:**
```hcl
# infra/modules/eventbridge/
module "cleanup_schedule" {
  source = "./modules/eventbridge"
  
  lambda_function_arn = module.lambda.cleanup_function_arn
  schedule_expression = "cron(0 18 * * ? *)" # 3 AM JST
}

# infra/modules/lambda/
resource "aws_lambda_function" "cleanup" {
  function_name = "myrsspress-cleanup"
  handler       = "cleanup.handler"
  runtime       = "nodejs24.x"
  timeout       = 60
  memory_size   = 256
  
  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
    }
  }
}
```

### Deployment Strategy

**Phase 2 Deployment:**
1. Deploy infrastructure updates (Terraform)
2. Deploy backend with new endpoints (GitHub Actions)
3. Deploy frontend with new components (Amplify)
4. Verify cleanup Lambda execution
5. Monitor CloudWatch Logs

**Rollback Plan:**
- Backend: Revert to previous Lambda image
- Frontend: Revert Amplify deployment
- Infrastructure: Apply previous state with `terraform apply`

### Monitoring

**CloudWatch Metrics:**
- Language detection execution time
- Summary generation success rate
- Historical newspaper cache hit rate
- Cleanup execution count
- Error rate per endpoint

**CloudWatch Alarms:**
- Summary generation failure rate > 10%
- Cleanup Lambda failure
- Historical newspaper generation time > 10 seconds
- DynamoDB throttling

## Error Handling

### Frontend Errors

**Language Filter Errors:**
- No newspapers match filter → Display "No newspapers found" message
- Network error during filtering → Display error with retry option

**Search Errors:**
- No search results → Display "No newspapers found for '{query}'" message

**Date Navigation Errors:**
- Future date selected → Display "Future newspapers are not available" alert
- Date older than 7 days → Display "Newspapers older than 7 days are not available" alert
- Invalid date format → Display "Invalid date format" alert

**Image Loading Errors:**
- Copyright-free image load failure → Fall back to local placeholder image
- Original article image failure → Display copyright-free placeholder

### Backend Errors

**Language Detection Errors:**
- Detection failure → Default to empty array `[]` and log error
- Continue newspaper generation

**Summary Generation Errors:**
- Bedrock API timeout → Return `null` for summary, display newspaper without summary
- API rate limit → Retry with exponential backoff (max 3 times)
- Invalid response → Log error and return `null`

**Historical Newspaper Errors:**
- Date validation failure → Return 400 error with specific message
- Insufficient articles for date → Return 400 error "Insufficient articles for this date"
- DynamoDB query failure → Retry with exponential backoff (max 3 times)

**Cleanup Errors:**
- DynamoDB batch delete failure → Log error and continue with next batch
- Lambda timeout → Log partial completion and retry on next scheduled run

### Error Logging

All errors are logged to CloudWatch Logs with:
- Timestamp
- Error type
- Stack trace
- Request context (newspaperId, date, language, etc.)
- User action (if applicable)

### Error Recovery

**Automatic Retry:**
- Bedrock API calls: 3 attempts with exponential backoff
- DynamoDB operations: 3 attempts with exponential backoff
- RSS feed fetching: Skip failed feeds and continue

**Graceful Degradation:**
- Summary generation failure → Display newspaper without summary
- Language detection failure → Display newspaper without language tags
- Image loading failure → Display placeholder image
