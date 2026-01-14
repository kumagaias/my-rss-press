import { Hono } from 'hono';
import { z } from 'zod';
import { DEFAULT_LANGUAGE } from '../constants.js';
import {
  saveNewspaper,
  getNewspaper,
  getPublicNewspapers,
  incrementViewCount,
} from '../services/newspaperService.js';
import {
  fetchArticlesForNewspaper,
} from '../services/rssFetcherService.js';
import { calculateImportance } from '../services/importanceCalculator.js';
import { detectLanguages } from '../services/languageDetectionService.js';
import { generateSummaryWithRetry } from '../services/summaryGenerationService.js';
import {
  getOrCreateNewspaper,
  getAvailableDates,
} from '../services/historicalNewspaperService.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { recordFeedUsage } from '../services/feedUsageService.js';
import { getCategoryByTheme } from '../services/categoryService.js';
import { suggestFeeds } from '../services/bedrockService.js';
import { limitDefaultFeedArticles, type FeedMetadata } from '../services/articleLimiter.js';

export const newspapersRouter = new Hono();

/**
 * Record feed usage asynchronously (fire-and-forget)
 * @param feedUrls - Array of feed URLs used
 * @param theme - Theme keyword
 * @param locale - Locale
 * @param articles - Generated articles
 * @param feedTitles - Map of feed URLs to their titles
 */
async function recordFeedUsageAsync(
  feedUrls: string[],
  theme: string,
  locale: 'en' | 'ja',
  articles: Array<{ feedSource: string }>,
  feedTitles: Map<string, string>
): Promise<void> {
  try {
    // Get category for the theme
    const category = await getCategoryByTheme(theme, locale);
    
    if (!category) {
      console.log(`[FeedUsage] No category found for theme: ${theme}, skipping usage tracking`);
      return;
    }
    
    console.log(`[FeedUsage] Recording usage for category: ${category.displayName} (${category.categoryId})`);
    
    // Count articles per feed
    const feedArticleCounts = new Map<string, number>();
    for (const article of articles) {
      const count = feedArticleCounts.get(article.feedSource) || 0;
      feedArticleCounts.set(article.feedSource, count + 1);
    }
    
    // Record usage for each feed
    const recordPromises = feedUrls.map(async (url) => {
      const articleCount = feedArticleCounts.get(url) || 0;
      const success = articleCount > 0;
      
      // Use actual feed title from RSS metadata, fallback to domain name
      const title = feedTitles.get(url) || url.split('/')[2] || url;
      
      await recordFeedUsage({
        url,
        categoryId: category.categoryId,
        title,
        articleCount,
        success,
      });
    });
    
    await Promise.all(recordPromises);
    console.log(`[FeedUsage] Successfully recorded usage for ${feedUrls.length} feeds`);
  } catch (error) {
    console.error('[FeedUsage] Error recording usage:', error);
    // Don't throw - this is fire-and-forget
  }
}

// Validation schemas
const GenerateNewspaperSchema = z.object({
  feedUrls: z.array(z.string().url()).min(1, 'At least 1 feed URL is required').max(15, 'Too many feed URLs'),
  theme: z.string().min(1, 'Theme is required'),
  defaultFeedUrls: z.array(z.string().url()).optional(), // URLs of default/fallback feeds
  locale: z.enum(['en', 'ja']).optional().default(DEFAULT_LANGUAGE.LOCALE), // Language setting for the newspaper
});

const ArticleSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string().url(),
  pubDate: z.string(),
  imageUrl: z.string().url().optional(),
  importance: z.number(),
  feedSource: z.string().optional(), // RSS feed URL that this article came from
  feedTitle: z.string().optional(), // Feed title from RSS metadata (for display)
});

const SaveNewspaperSchema = z.object({
  name: z.string().min(1, 'Newspaper name is required').max(100),
  userName: z.string().min(1).optional().default('Anonymous'),
  feedUrls: z.array(z.string().url()).min(1).max(15, 'Too many feed URLs'),
  articles: z.array(ArticleSchema).optional(),
  isPublic: z.boolean().optional().default(true),
  locale: z.enum(['en', 'ja']).optional().default(DEFAULT_LANGUAGE.LOCALE), // Language setting for the newspaper
  languages: z.array(z.string()).optional(), // Detected language tags (e.g., ["JP", "EN"])
  summary: z.string().optional(), // AI-generated summary
  newspaperDate: z.string().optional(), // Date of the newspaper (YYYY-MM-DD)
});

const OneClickGenerateSchema = z.object({
  theme: z.string().min(1, 'Theme is required'),
  locale: z.enum(['en', 'ja']).optional().default(DEFAULT_LANGUAGE.LOCALE),
});

/**
 * POST /api/newspapers/generate
 * One-click newspaper generation: suggest feeds + generate newspaper
 * This combines feed suggestion and newspaper generation into a single endpoint
 */
newspapersRouter.post(
  '/newspapers/generate',
  rateLimit(10, 60000), // 10 requests per minute (more restrictive than separate endpoints)
  async (c) => {
    try {
      // Parse and validate request body
      const body = await c.req.json();
      const validated = OneClickGenerateSchema.parse(body);

      console.log(`[OneClick] Generating newspaper for theme: ${validated.theme}, locale: ${validated.locale}`);

      // Step 1: Suggest feeds
      console.log('[OneClick] Step 1: Suggesting feeds...');
      const feedSuggestions = await suggestFeeds(validated.theme, validated.locale);
      
      const feedUrls = feedSuggestions.feeds.map(f => f.url);
      const feedMetadata: FeedMetadata[] = feedSuggestions.feeds.map(f => ({
        url: f.url,
        title: f.title,
        isDefault: f.isDefault || false,
      }));
      
      console.log(`[OneClick] Got ${feedUrls.length} feed suggestions (${feedMetadata.filter(f => f.isDefault).length} default)`);

      // Step 2: Fetch articles
      console.log('[OneClick] Step 2: Fetching articles...');
      const { articles, feedLanguages, feedTitles } = await fetchArticlesForNewspaper(
        feedUrls,
        validated.theme
      );

      console.log(`[OneClick] Fetched ${articles.length} articles`);

      // Check if we have enough articles
      if (articles.length < 3) {
        console.error(`[OneClick] Insufficient articles: ${articles.length} (minimum: 3)`);
        const isJapanese = validated.locale === 'ja';
        return c.json(
          {
            error: articles.length === 0
              ? (isJapanese
                  ? 'フィードから記事を取得できませんでした。フィードURLが正しいか、またはフィードが利用可能か確認してください。'
                  : 'Could not fetch articles from the feeds. Please check that the feed URLs are correct and that the feeds are available.')
              : (isJapanese
                  ? '記事数が不足しています。別のフィードを追加するか、後でもう一度お試しください。'
                  : 'Not enough articles were found. Try adding different feeds or try again later.'),
            articleCount: articles.length,
            suggestion: isJapanese
              ? '別のRSSフィードを試すか、フィードURLがアクセス可能か確認してください。'
              : 'Try using different RSS feeds or check if the feed URLs are accessible.',
          },
          400
        );
      }

      // Step 3: Limit default feed articles
      console.log('[OneClick] Step 3: Limiting default feed articles...');
      const limitedArticles = limitDefaultFeedArticles(articles, feedMetadata);
      console.log(`[OneClick] Limited to ${limitedArticles.length} articles`);

      // Step 4: Calculate importance scores
      console.log('[OneClick] Step 4: Calculating importance...');
      const defaultFeedUrls = new Set(feedMetadata.filter(f => f.isDefault).map(f => f.url));
      const articlesWithImportance = await calculateImportance(
        limitedArticles,
        validated.theme,
        defaultFeedUrls
      );

      // Step 5: Detect languages
      console.log('[OneClick] Step 5: Detecting languages...');
      let languages: string[] = [];
      try {
        languages = await detectLanguages(articlesWithImportance, feedLanguages);
        console.log(`[OneClick] Detected languages: ${languages.join(', ')}`);
      } catch (error) {
        console.error('[OneClick] Error detecting languages:', error);
      }

      // Step 6: Generate summary
      console.log('[OneClick] Step 6: Generating summary...');
      let summary: string | null = null;
      try {
        summary = await generateSummaryWithRetry(
          articlesWithImportance,
          validated.theme,
          languages,
          3
        );
        if (summary) {
          console.log(`[OneClick] Generated summary: ${summary.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error('[OneClick] Error generating summary:', error);
      }

      // Step 7: Record feed usage (fire-and-forget)
      recordFeedUsageAsync(
        feedUrls,
        validated.theme,
        validated.locale,
        articlesWithImportance,
        feedTitles
      ).catch(error => {
        console.error('[OneClick] Failed to record usage (non-blocking):', error);
      });

      // Step 8: Update feed metadata with actual titles and filter out default feeds
      // Default feeds are internal implementation - don't expose to frontend
      const enrichedFeedMetadata = feedMetadata
        .filter(f => !f.isDefault) // Only return user-selected feeds
        .map(f => ({
          url: f.url,
          title: feedTitles.get(f.url) || f.title,
          language: feedLanguages.get(f.url),
        }));

      console.log('[OneClick] Generation complete!');
      console.log(`[OneClick] Returning ${enrichedFeedMetadata.length} user-selected feeds (${feedMetadata.length - enrichedFeedMetadata.length} default feeds excluded)`);

      // Return complete newspaper data
      return c.json({
        articles: articlesWithImportance,
        feedUrls: feedMetadata.filter(f => !f.isDefault).map(f => f.url), // Only user-selected feed URLs
        feedMetadata: enrichedFeedMetadata,
        newspaperName: feedSuggestions.newspaperName,
        summary,
        languages,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Validation error',
            details: error.errors,
          },
          400
        );
      }

      console.error('[OneClick] Error in one-click generation:', error);
      return c.json(
        {
          error: 'Failed to generate newspaper',
        },
        500
      );
    }
  }
);

/**
 * POST /api/generate-newspaper
 * Generate a newspaper from RSS feeds
 */
newspapersRouter.post(
  '/generate-newspaper',
  rateLimit(20, 60000), // 20 requests per minute
  async (c) => {
    try {
      // Parse and validate request body
      const body = await c.req.json();
      const validated = GenerateNewspaperSchema.parse(body);

      console.log(`Generating newspaper for theme: ${validated.theme}`);

      // Fetch articles from RSS feeds
      const { articles, feedLanguages, feedTitles } = await fetchArticlesForNewspaper(
        validated.feedUrls,
        validated.theme
      );

      // Check if we have enough articles
      if (articles.length < 3) {
        console.error(`Insufficient articles: ${articles.length} (minimum: 3)`);
        return c.json(
          {
            error: articles.length === 0
              ? 'フィードから記事を取得できませんでした。フィードURLが正しいか、またはフィードが利用可能か確認してください。'
              : '記事数が不足しています。別のフィードを追加するか、後でもう一度お試しください。',
            articleCount: articles.length,
            suggestion: 'Try using different RSS feeds or check if the feed URLs are accessible.',
          },
          400
        );
      }

      // Calculate importance scores (with penalty for default feed articles)
      const defaultFeedUrls = new Set(validated.defaultFeedUrls || []);
      const articlesWithImportance = await calculateImportance(
        articles,
        validated.theme,
        defaultFeedUrls
      );

      // Detect languages from articles
      let languages: string[] = [];
      try {
        languages = await detectLanguages(articlesWithImportance, feedLanguages);
        console.log(`Detected languages: ${languages.join(', ')}`);
      } catch (error) {
        console.error('Error detecting languages:', error);
        // Continue without languages (empty array)
      }

      // Generate summary (optional, don't fail if it doesn't work)
      let summary: string | null = null;
      try {
        summary = await generateSummaryWithRetry(
          articlesWithImportance,
          validated.theme,
          languages,
          3 // Max 3 retries
        );
        if (summary) {
          console.log(`Generated summary: ${summary.substring(0, 50)}...`);
        } else {
          console.log('Summary generation returned null');
        }
      } catch (error) {
        console.error('Error generating summary:', error);
        // Continue without summary (null)
      }

      // Record feed usage (fire-and-forget, don't block response)
      recordFeedUsageAsync(
        validated.feedUrls,
        validated.theme,
        validated.locale || 'en',
        articlesWithImportance,
        feedTitles
      ).catch(error => {
        console.error('[FeedUsage] Failed to record usage (non-blocking):', error);
      });

      return c.json({
        articles: articlesWithImportance,
        languages, // Include detected languages in response
        summary, // Include generated summary in response (may be null)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Validation error',
            details: error.errors,
          },
          400
        );
      }

      console.error('Error in generate-newspaper:', error);
      return c.json(
        {
          error: 'Failed to generate newspaper',
        },
        500
      );
    }
  }
);

/**
 * GET /api/newspapers/:id/dates
 * Get available dates for a newspaper
 * Note: This route must be defined BEFORE :id/:date to avoid route conflicts
 */
newspapersRouter.get('/newspapers/:id/dates', async (c) => {
  try {
    const newspaperId = c.req.param('id');

    // Get available dates
    const dates = await getAvailableDates(newspaperId);

    return c.json({ dates });
  } catch (error) {
    console.error('Error in get available dates:', error);
    return c.json(
      {
        error: 'Failed to get available dates',
      },
      500
    );
  }
});

/**
 * GET /api/newspapers/:id/:date
 * Get or create a newspaper for a specific date
 * Note: Date format must be YYYY-MM-DD
 */
newspapersRouter.get('/newspapers/:id/:date{[0-9]{4}-[0-9]{2}-[0-9]{2}}', async (c) => {
  const newspaperId = c.req.param('id');
  const date = c.req.param('date');

  console.log(`Getting historical newspaper: ${newspaperId} for date: ${date}`);

  try {
    // Get newspaper metadata to get feedUrls and theme
    const metadata = await getNewspaper(newspaperId);
    if (!metadata) {
      console.error(`Newspaper not found: ${newspaperId}`);
      return c.json(
        {
          error: 'Newspaper not found',
          code: 'NEWSPAPER_NOT_FOUND',
        },
        404
      );
    }

    // Validate metadata has required fields
    if (!metadata.feedUrls || metadata.feedUrls.length === 0) {
      console.error(`Newspaper ${newspaperId} has no feed URLs`);
      return c.json(
        {
          error: 'Newspaper configuration is invalid',
          code: 'INVALID_NEWSPAPER_CONFIG',
        },
        500
      );
    }

    // Get or create historical newspaper
    const newspaper = await getOrCreateNewspaper(
      newspaperId,
      date,
      metadata.feedUrls,
      'general', // Use a default theme for now
      metadata.locale || 'en' // Use newspaper's locale
    );

    // Increment view count for the base newspaper
    await incrementViewCount(newspaperId);

    console.log(`Successfully retrieved/created newspaper for ${newspaperId} on ${date}`);
    return c.json(newspaper);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error creating historical newspaper: ${error.message}`);
      console.error(`Newspaper ID: ${newspaperId}`);
      console.error(`Date: ${date}`);
      console.error(`Stack trace: ${error.stack}`);

      // Handle validation errors
      if (error.message.includes('Future newspapers') ||
          error.message.includes('older than 7 days') ||
          error.message.includes('Invalid date format')) {
        return c.json(
          {
            error: error.message,
            code: error.message.includes('Future') ? 'FUTURE_DATE' :
                  error.message.includes('older') ? 'DATE_TOO_OLD' :
                  'INVALID_DATE',
          },
          400
        );
      }
      
      if (error.message.includes('Insufficient articles')) {
        return c.json(
          {
            error: 'Insufficient articles for this date',
            code: 'INSUFFICIENT_ARTICLES',
          },
          400
        );
      }
    }
    
    // Unhandled error
    console.error('Unhandled error in get historical newspaper:', error);
    return c.json(
      {
        error: 'Failed to get newspaper',
        code: 'INTERNAL_ERROR',
      },
      500
    );
  }
});

/**
 * GET /api/newspapers/:id
 * Get a newspaper by ID
 * Note: This route must be defined AFTER date-specific routes to avoid route conflicts
 */
newspapersRouter.get('/newspapers/:id', async (c) => {
  try {
    const newspaperId = c.req.param('id');

    // Get newspaper
    const newspaper = await getNewspaper(newspaperId);

    if (!newspaper) {
      return c.json(
        {
          error: 'Newspaper not found',
        },
        404
      );
    }

    // Increment view count
    await incrementViewCount(newspaperId);

    return c.json(newspaper);
  } catch (error) {
    console.error('Error in get newspaper:', error);
    return c.json(
      {
        error: 'Failed to get newspaper',
      },
      500
    );
  }
});

/**
 * GET /api/newspapers?sort=popular&limit=10&locale=en
 * Get public newspapers
 */
newspapersRouter.get('/newspapers', async (c) => {
  try {
    const sortParam = c.req.query('sort');
    const sortBy: 'popular' | 'recent' = (sortParam === 'popular' || sortParam === 'recent') ? sortParam : 'popular';
    const limit = Math.max(1, Math.min(100, parseInt(c.req.query('limit') || '10', 10)));
    const localeParam = c.req.query('locale');
    const locale: 'en' | 'ja' | undefined = (localeParam === 'en' || localeParam === 'ja') ? localeParam : undefined;

    // Validate sort parameter
    if (sortBy !== 'popular' && sortBy !== 'recent') {
      return c.json(
        {
          error: 'Invalid sort parameter. Must be "popular" or "recent"',
        },
        400
      );
    }

    // Get public newspapers
    let newspapers = await getPublicNewspapers(sortBy, limit);

    // Filter by locale if specified
    if (locale) {
      newspapers = newspapers.filter(n => n.locale === locale);
    }

    return c.json({
      newspapers,
    });
  } catch (error) {
    console.error('Error in get public newspapers:', error);
    return c.json(
      {
        error: 'Failed to get newspapers',
      },
      500
    );
  }
});

/**
 * POST /api/newspapers
 * Save a newspaper
 */
newspapersRouter.post('/newspapers', async (c) => {
  try {
    // Parse and validate request body
    const body = await c.req.json();
    const validated = SaveNewspaperSchema.parse(body);

    // Save newspaper
    const newspaperId = await saveNewspaper(validated);

    return c.json(
      {
        newspaperId,
        createdAt: new Date().toISOString(),
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        400
      );
    }

    console.error('Error in save newspaper:', error);
    return c.json(
      {
        error: 'Failed to save newspaper',
      },
      500
    );
  }
});
