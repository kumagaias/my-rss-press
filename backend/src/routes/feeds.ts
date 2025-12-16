import { Hono } from 'hono';
import { z } from 'zod';
import { suggestFeeds } from '../services/bedrockService.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const feedsRouter = new Hono();

// Validation schema for suggest-feeds request
const SuggestFeedsSchema = z.object({
  theme: z.string().min(1, 'Theme is required').max(200, 'Theme is too long'),
  locale: z.enum(['en', 'ja']).optional(),
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

      // Single attempt only to stay within API Gateway 29s timeout
      // If it fails, fall back to default feeds immediately
      try {
        console.log(`[Feed Suggestion] Getting suggestions for theme: ${validated.theme}`);
        
        // Get feed suggestions from Bedrock
        const result = await suggestFeeds(validated.theme, validated.locale);

        // Success - return suggestions with newspaper name
        console.log(`[Feed Suggestion] Success, got ${result.feeds.length} feeds and newspaper name: ${result.newspaperName}`);
        return c.json({
          suggestions: result.feeds,
          newspaperName: result.newspaperName,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[Feed Suggestion] Failed: ${errorMessage}, falling back to 1 random default feed`);
        
        // Fall back to 1 random default feed
        const { getAllDefaultFeeds } = await import('../services/bedrockService.js');
        const defaultFeeds = getAllDefaultFeeds(validated.locale || 'en');
        
        // Select 1 random default feed
        const randomIndex = Math.floor(Math.random() * defaultFeeds.length);
        const randomDefaultFeed = defaultFeeds[randomIndex];
        
        const suggestions = [{
          ...randomDefaultFeed,
          isDefault: true,
        }];
        
        // Generate default newspaper name based on theme
        const defaultNewspaperName = validated.locale === 'ja' 
          ? `${validated.theme}デイリー`
          : `The ${validated.theme} Daily`;
        
        console.log(`[Feed Suggestion] Returning 1 random default feed: ${randomDefaultFeed.title}`);
        console.log(`[Feed Suggestion] Using default newspaper name: ${defaultNewspaperName}`);
        
        return c.json({
          suggestions,
          newspaperName: defaultNewspaperName,
        });
      }
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
