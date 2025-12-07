import { Hono } from 'hono';
import { z } from 'zod';
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
import { rateLimit } from '../middleware/rateLimit.js';

export const newspapersRouter = new Hono();

// Validation schemas
const GenerateNewspaperSchema = z.object({
  feedUrls: z.array(z.string().url()).min(3, 'At least 3 feed URLs are required').max(10, 'Too many feed URLs'),
  theme: z.string().min(1, 'Theme is required'),
  defaultFeedUrls: z.array(z.string().url()).optional(), // URLs of default/fallback feeds
  locale: z.enum(['en', 'ja']).optional().default('en'), // Language setting for the newspaper
});

const ArticleSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string().url(),
  pubDate: z.string(),
  imageUrl: z.string().url().optional(),
  importance: z.number(),
});

const SaveNewspaperSchema = z.object({
  name: z.string().min(1, 'Newspaper name is required').max(100),
  userName: z.string().min(1).optional().default('Anonymous'),
  feedUrls: z.array(z.string().url()).min(1).max(10, 'Too many feed URLs'),
  articles: z.array(ArticleSchema).optional(),
  isPublic: z.boolean().optional().default(true),
  locale: z.enum(['en', 'ja']).optional().default('en'), // Language setting for the newspaper
});

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
      const articles = await fetchArticlesForNewspaper(
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

      return c.json({
        articles: articlesWithImportance,
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
 * GET /api/newspapers/:id
 * Get a newspaper by ID
 * Note: This route must be defined BEFORE /newspapers to avoid route conflicts
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
    let newspapers = await getPublicNewspapers(sortBy, limit, locale);
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
