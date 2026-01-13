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
 * 
 * Query parameters:
 * - locale: 'en' | 'ja' (required)
 * - date: YYYY-MM-DD (optional, defaults to last 7 days)
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

/**
 * Validate date parameter
 */
function validateDate(date: string): { valid: boolean; error?: string } {
  const targetDate = new Date(date + 'T00:00:00+09:00');
  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayJST = new Date(nowJST);
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
