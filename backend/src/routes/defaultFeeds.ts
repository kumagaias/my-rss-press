/**
 * Default Feeds API Routes
 * 
 * Provides endpoints for fetching articles from default RSS feeds.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { fetchDefaultFeedArticles } from '../services/defaultFeedService.js';

const app = new Hono();

// Query parameter schema
const QuerySchema = z.object({
  locale: z.enum(['en', 'ja'], {
    errorMap: () => ({ message: 'Locale must be "en" or "ja"' }),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }).optional(),
});

/**
 * GET /api/default-feeds
 * Fetch articles from default feeds
 * 
 * Query Parameters:
 * - locale: 'en' | 'ja' (required)
 * - date: YYYY-MM-DD (optional, defaults to last 7 days)
 * 
 * Response:
 * {
 *   articles: Article[],
 *   totalFeeds: number,
 *   successfulFeeds: number
 * }
 */
app.get('/', async (c) => {
  try {
    // Parse and validate query parameters
    const rawQuery = {
      locale: c.req.query('locale'),
      date: c.req.query('date'),
    };

    const query = QuerySchema.parse(rawQuery);

    // Validate date if provided
    if (query.date) {
      const validation = validateDate(query.date);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }
    }

    // Fetch articles from default feeds
    const result = await fetchDefaultFeedArticles(query.locale, query.date);

    return c.json(result);
  } catch (error) {
    console.error('[Default Feed API] Error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid query parameters',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }, 400);
    }
    
    // Handle other errors
    return c.json({
      error: 'Failed to fetch default feed articles',
    }, 500);
  }
});

/**
 * Validate date parameter
 * @param date - Date string in YYYY-MM-DD format
 * @returns Validation result
 */
function validateDate(date: string): { valid: boolean; error?: string } {
  // Parse date in JST timezone
  const targetDate = new Date(date + 'T00:00:00+09:00');
  
  // Check if valid date
  if (isNaN(targetDate.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }

  // Get today in JST
  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayJST = new Date(nowJST);
  todayJST.setHours(0, 0, 0, 0);

  // Check if future date
  if (targetDate > todayJST) {
    return { valid: false, error: 'Future dates are not allowed' };
  }

  // Check if older than 7 days
  const sevenDaysAgo = new Date(todayJST);
  sevenDaysAgo.setDate(todayJST.getDate() - 7);

  // Allow dates from 7 days ago (inclusive) to today
  if (targetDate < sevenDaysAgo) {
    return { valid: false, error: 'Dates older than 7 days are not allowed' };
  }

  return { valid: true };
}

export default app;
