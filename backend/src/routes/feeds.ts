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
      // If Bedrock fails or returns no valid feeds, immediately fall back to defaults
      try {
        console.log(`[Feed Suggestion] Requesting feeds for theme: ${validated.theme}`);
        
        // Get feed suggestions from Bedrock
        const suggestions = await suggestFeeds(validated.theme, validated.locale);

        // Success - return suggestions
        console.log(`[Feed Suggestion] Success, got ${suggestions.length} feeds`);
        return c.json({
          suggestions,
        });
      } catch (error) {
        const lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if error is retryable (no valid feeds or Bedrock API error)
        const shouldFallback = lastError.message.includes('No valid feeds found') || 
                               lastError.message.includes('Bedrock API error');
        
        if (shouldFallback) {
          console.log(`[Feed Suggestion] Bedrock failed (${lastError.message}), falling back to default feeds`);
          // Fall through to default feeds below
        } else {
          // For other errors, throw immediately
          throw lastError;
        }
      }

      // If we get here, all retries failed - return default feeds only
      console.log(`[Feed Suggestion] Returning default feeds for locale: ${validated.locale || 'en'}`);
      const { getAllDefaultFeeds } = await import('../services/bedrockService.js');
      const defaultFeeds = getAllDefaultFeeds(validated.locale || 'en');
      
      // Mark all as default feeds
      const suggestions = defaultFeeds.map(feed => ({
        ...feed,
        isDefault: true,
      }));
      
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
