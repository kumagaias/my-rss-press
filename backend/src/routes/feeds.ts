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

      // Retry logic: Try up to 3 times if no valid feeds are found
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Feed Suggestion] Attempt ${attempt}/${maxRetries} for theme: ${validated.theme}`);
          
          // Get feed suggestions from Bedrock
          const suggestions = await suggestFeeds(validated.theme, validated.locale);

          // Success - return suggestions
          console.log(`[Feed Suggestion] Success on attempt ${attempt}, got ${suggestions.length} feeds`);
          return c.json({
            suggestions,
          });
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          
          // Retry on "No valid feeds found" or "Bedrock API error"
          const shouldRetry = lastError.message.includes('No valid feeds found') || 
                             lastError.message.includes('Bedrock API error');
          
          // If this is not the last attempt and error is retryable, retry
          if (attempt < maxRetries && shouldRetry) {
            console.log(`[Feed Suggestion] Attempt ${attempt} failed: ${lastError.message}, retrying...`);
            // Wait a bit before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          // If it's the last attempt and error is retryable, break and fall through to default feeds
          if (attempt === maxRetries && shouldRetry) {
            console.log(`[Feed Suggestion] All ${maxRetries} attempts failed, falling back to default feeds`);
            break;
          }
          
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
