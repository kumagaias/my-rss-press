import { Hono } from 'hono';
import { z } from 'zod';
import { suggestFeeds } from '../services/bedrockService.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const feedsRouter = new Hono();

// Validation schema for suggest-feeds request
const SuggestFeedsSchema = z.object({
  theme: z.string().min(1, 'Theme is required'),
});

/**
 * POST /api/suggest-feeds
 * Get AI-powered RSS feed suggestions based on user theme
 */
feedsRouter.post(
  '/suggest-feeds',
  rateLimit(10, 60000), // 10 requests per minute
  async (c) => {
    try {
      // Parse and validate request body
      const body = await c.req.json();
      const validated = SuggestFeedsSchema.parse(body);

      // Get feed suggestions from Bedrock
      const suggestions = await suggestFeeds(validated.theme);

      return c.json({
        suggestions,
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

      console.error('Error in suggest-feeds:', error);
      return c.json(
        {
          error: 'Failed to generate feed suggestions',
        },
        500
      );
    }
  }
);
