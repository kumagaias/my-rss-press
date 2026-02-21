import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';

// IMPORTANT: Set mock mode BEFORE importing any modules
const originalEnv = process.env.USE_BEDROCK_MOCK;
process.env.USE_BEDROCK_MOCK = 'true';

// Now import the service (config will read USE_BEDROCK_MOCK='true')
import { generateSummary } from '../../../src/services/summaryGenerationService.js';
import type { Article } from '../../../src/services/rssFetcherService.js';

describe('Summary Generation Service - Property-Based Tests', () => {
  beforeAll(() => {
    console.log('Property tests running with USE_BEDROCK_MOCK =', process.env.USE_BEDROCK_MOCK);
  });

  afterAll(() => {
    // Restore original environment
    process.env.USE_BEDROCK_MOCK = originalEnv;
  });

  /**
   * Property 7: Summary Length Constraint
   * 
   * **Validates: Requirements 5.1**
   * 
   * For any set of articles and theme, the generated summary should be between 100-200 characters in length.
   * 
   * Tag: Feature: bedrock-to-nova-micro-migration, Property 7: Summary Length Constraint
   */
  it('Property 7: Summary Length Constraint - summary should be 100-200 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random article sets (1-10 articles)
        fc.array(
          fc.record({
            title: fc.string({ minLength: 10, maxLength: 100 }),
            description: fc.string({ minLength: 20, maxLength: 200 }),
            link: fc.webUrl(),
            pubDate: fc.date(),
            imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // Generate random theme strings (1-50 characters)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate random language arrays
        fc.constantFrom(
          ['JP'],
          ['EN'],
          ['JP', 'EN'],
          []
        ),
        async (articles, theme, languages) => {
          console.log(`[Property 7] Testing with ${articles.length} articles, theme: "${theme}", languages: ${languages.join(',')}`);
          
          // Call generateSummary with random articles, theme, and languages
          const summary = await generateSummary(articles as Article[], theme, languages);
          
          // Summary may be null if generation fails (which is acceptable)
          // But if it's not null, it must meet the length constraint
          if (summary !== null) {
            expect(typeof summary).toBe('string');
            
            // **Core Property: Summary length must be 100-200 characters (Requirements 5.1)**
            const length = summary.length;
            console.log(`[Property 7] Summary length: ${length} characters`);
            
            expect(length).toBeGreaterThanOrEqual(100);
            expect(length).toBeLessThanOrEqual(200);
            
            console.log(`[Property 7] ✓ Summary length ${length} is within 100-200 character range`);
          } else {
            console.log(`[Property 7] Summary generation returned null (acceptable)`);
          }
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
   * Property 8: Summary Line Count Constraint
   * 
   * **Validates: Requirements 5.2**
   * 
   * For any set of articles and theme, the generated summary should contain 3 lines or fewer (counting newline characters).
   * 
   * Tag: Feature: bedrock-to-nova-micro-migration, Property 8: Summary Line Count Constraint
   */
  it('Property 8: Summary Line Count Constraint - summary should have ≤3 lines', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random article sets (1-10 articles)
        fc.array(
          fc.record({
            title: fc.string({ minLength: 10, maxLength: 100 }),
            description: fc.string({ minLength: 20, maxLength: 200 }),
            link: fc.webUrl(),
            pubDate: fc.date(),
            imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // Generate random theme strings (1-50 characters)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate random language arrays
        fc.constantFrom(
          ['JP'],
          ['EN'],
          ['JP', 'EN'],
          []
        ),
        async (articles, theme, languages) => {
          console.log(`[Property 8] Testing with ${articles.length} articles, theme: "${theme}", languages: ${languages.join(',')}`);
          
          // Call generateSummary with random articles, theme, and languages
          const summary = await generateSummary(articles as Article[], theme, languages);
          
          // Summary may be null if generation fails (which is acceptable)
          // But if it's not null, it must meet the line count constraint
          if (summary !== null) {
            expect(typeof summary).toBe('string');
            
            // **Core Property: Summary must have ≤3 lines (Requirements 5.2)**
            // Count newline characters to determine line count
            const lineCount = (summary.match(/\n/g) || []).length + 1;
            console.log(`[Property 8] Summary line count: ${lineCount} lines`);
            
            expect(lineCount).toBeLessThanOrEqual(3);
            
            console.log(`[Property 8] ✓ Summary has ${lineCount} line(s), which is ≤3 lines`);
          } else {
            console.log(`[Property 8] Summary generation returned null (acceptable)`);
          }
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
