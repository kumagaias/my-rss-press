import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';

// IMPORTANT: Set mock mode BEFORE importing any modules
const originalEnv = process.env.USE_BEDROCK_MOCK;
process.env.USE_BEDROCK_MOCK = 'true';

// Now import the service (config will read USE_BEDROCK_MOCK='true')
import { calculateImportance } from '../../../src/services/importanceCalculator.js';
import type { Article } from '../../../src/services/rssFetcherService.js';

describe('Importance Calculator - Property-Based Tests', () => {
  beforeAll(() => {
    console.log('Property tests running with USE_BEDROCK_MOCK =', process.env.USE_BEDROCK_MOCK);
  });

  afterAll(() => {
    // Restore original environment
    process.env.USE_BEDROCK_MOCK = originalEnv;
  });

  /**
   * Property 11: Importance Score Range
   * 
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * For any article, the calculated importance score should be between 0 and 100 (inclusive).
   * 
   * Tag: Feature: bedrock-to-nova-micro-migration, Property 11: Importance Score Range
   */
  it('Property 11: Importance Score Range - all scores should be 0-100', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random article sets (1-20 articles)
        fc.array(
          fc.record({
            title: fc.string({ minLength: 5, maxLength: 150 }),
            description: fc.string({ minLength: 10, maxLength: 300 }),
            link: fc.webUrl(),
            pubDate: fc.date(),
            imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
            feedSource: fc.webUrl(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        // Generate random theme strings (1-50 characters)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate random default feed URLs set
        fc.array(fc.webUrl(), { maxLength: 5 }).map(urls => new Set(urls)),
        async (articles, theme, defaultFeedUrls) => {
          console.log(`[Property 11] Testing with ${articles.length} articles, theme: "${theme}", ${defaultFeedUrls.size} default feeds`);
          
          // Call calculateImportance with random articles, theme, and default feed URLs
          const articlesWithScores = await calculateImportance(
            articles as Article[], 
            theme, 
            defaultFeedUrls
          );
          
          // Verify we got the same number of articles back
          expect(articlesWithScores.length).toBe(articles.length);
          
          // **Core Property: All importance scores must be 0-100 (Requirements 6.1, 6.2, 6.3)**
          for (let i = 0; i < articlesWithScores.length; i++) {
            const article = articlesWithScores[i];
            const score = article.importance;
            
            // Verify importance field exists and is a number
            expect(score).toBeDefined();
            expect(typeof score).toBe('number');
            expect(Number.isFinite(score)).toBe(true);
            
            // Verify score is within valid range [0, 100]
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
            
            console.log(`[Property 11] Article ${i + 1}: "${article.title.substring(0, 30)}..." - Score: ${score} (valid: ${score >= 0 && score <= 100})`);
          }
          
          console.log(`[Property 11] ✓ All ${articlesWithScores.length} articles have valid importance scores (0-100)`);
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design.md
        timeout: 60000, // 60 second timeout for async property tests
        verbose: true, // Show detailed output on failure
      }
    );
  }, 120000); // 2 minute test timeout to allow for 100 iterations

  /**
   * Property 12: Image Bonus Application
   * 
   * **Validates: Requirements 6.2**
   * 
   * For any two identical articles where one has an image and one doesn't, 
   * the article with an image should receive a higher importance score 
   * (approximately +10 to +20 points higher).
   * 
   * Tag: Feature: bedrock-to-nova-micro-migration, Property 12: Image Bonus Application
   */
  it('Property 12: Image Bonus Application - articles with images should score higher', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random article data (without imageUrl)
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 150 }),
          description: fc.string({ minLength: 10, maxLength: 300 }),
          link: fc.webUrl(),
          pubDate: fc.date(),
          feedSource: fc.webUrl(),
        }),
        // Generate random theme strings (1-50 characters)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate random image URL
        fc.webUrl(),
        async (baseArticle, theme, imageUrl) => {
          console.log(`[Property 12] Testing with article: "${baseArticle.title.substring(0, 30)}...", theme: "${theme}"`);
          
          // Create two identical articles - one with image, one without
          const articleWithoutImage: Article = {
            ...baseArticle,
            imageUrl: undefined,
          };
          
          const articleWithImage: Article = {
            ...baseArticle,
            imageUrl: imageUrl,
          };
          
          // Calculate importance for both articles
          const [resultWithoutImage] = await calculateImportance([articleWithoutImage], theme);
          const [resultWithImage] = await calculateImportance([articleWithImage], theme);
          
          const scoreWithoutImage = resultWithoutImage.importance!;
          const scoreWithImage = resultWithImage.importance!;
          
          console.log(`[Property 12] Score without image: ${scoreWithoutImage}`);
          console.log(`[Property 12] Score with image: ${scoreWithImage}`);
          console.log(`[Property 12] Difference: ${scoreWithImage - scoreWithoutImage}`);
          
          // **Core Property: Article with image should have higher score (Requirements 6.2)**
          // The fallback algorithm applies IMAGE_BONUS = 40 points
          // The AI prompt specifies +20 points for images
          // We expect at least +10 points difference to account for randomness
          // Upper bound: IMAGE_BONUS (40) + RANDOM_VARIATION_RANGE (20) = 60 points max
          const scoreDifference = scoreWithImage - scoreWithoutImage;
          
          expect(scoreDifference).toBeGreaterThanOrEqual(10);
          expect(scoreDifference).toBeLessThanOrEqual(60); // Upper bound: 40 + 20 = 60
          
          console.log(`[Property 12] ✓ Image bonus applied correctly (difference: ${scoreDifference} points)`);
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design.md
        timeout: 60000, // 60 second timeout for async property tests
        verbose: true, // Show detailed output on failure
      }
    );
  }, 120000); // 2 minute test timeout to allow for 100 iterations
});
