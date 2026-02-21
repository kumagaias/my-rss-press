import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';

// IMPORTANT: Set mock mode BEFORE importing any modules
const originalEnv = process.env.USE_BEDROCK_MOCK;
process.env.USE_BEDROCK_MOCK = 'true';

// Now import the service (config will read USE_BEDROCK_MOCK='true')
import { suggestFeeds } from '../../../src/services/feedSuggestionService.js';

describe('Feed Suggestion Service - Property-Based Tests', () => {
  beforeAll(() => {
    console.log('Property tests running with USE_BEDROCK_MOCK =', process.env.USE_BEDROCK_MOCK);
  });

  afterAll(() => {
    // Restore original environment
    process.env.USE_BEDROCK_MOCK = originalEnv;
  });

  /**
   * Property 4: Feed Suggestion Minimum Count
   * 
   * **Validates: Requirements 4.1**
   * 
   * For any theme input, the feed suggestion service should return at least 15 valid RSS feed URLs
   * (including fallback to default feeds if necessary).
   * 
   * Tag: Feature: bedrock-to-nova-micro-migration, Property 4: Feed Suggestion Minimum Count
   */
  it('Property 4: Feed Suggestion Minimum Count - should return at least 15 feeds for any theme', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random theme strings (1-50 characters, alphanumeric and spaces)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate random locale (en or ja)
        fc.constantFrom('en' as const, 'ja' as const),
        async (theme, locale) => {
          console.log(`[Property 4] Testing theme: "${theme}", locale: "${locale}"`);
          
          // Call suggestFeeds with random theme and locale
          const result = await suggestFeeds(theme, locale);
          
          // Verify result structure
          expect(result).toBeDefined();
          expect(result).toHaveProperty('feeds');
          expect(result).toHaveProperty('newspaperName');
          expect(Array.isArray(result.feeds)).toBe(true);
          
          // **Core Property: Minimum 15 feeds (Requirements 4.1)**
          expect(result.feeds.length).toBeGreaterThanOrEqual(15);
          
          // Verify each feed has required fields
          result.feeds.forEach((feed, index) => {
            expect(feed).toHaveProperty('url');
            expect(feed).toHaveProperty('title');
            expect(feed).toHaveProperty('reasoning');
            expect(typeof feed.url).toBe('string');
            expect(typeof feed.title).toBe('string');
            expect(typeof feed.reasoning).toBe('string');
            expect(feed.url.length).toBeGreaterThan(0);
            expect(feed.title.length).toBeGreaterThan(0);
          });
          
          console.log(`[Property 4] ✓ Verified ${result.feeds.length} feeds for theme "${theme}"`);
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
   * Property 5: Feed URL Format Validation
   * 
   * **Validates: Requirements 4.3**
   * 
   * For any feed suggestion response, all returned feed URLs should match valid RSS feed URL patterns
   * (http/https protocol, valid domain, common feed paths).
   * 
   * Tag: Feature: bedrock-to-nova-micro-migration, Property 5: Feed URL Format Validation
   */
  it('Property 5: Feed URL Format Validation - all feed URLs should match valid patterns', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random theme strings (1-50 characters, alphanumeric and spaces)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate random locale (en or ja)
        fc.constantFrom('en' as const, 'ja' as const),
        async (theme, locale) => {
          console.log(`[Property 5] Testing theme: "${theme}", locale: "${locale}"`);
          
          // Call suggestFeeds with random theme and locale
          const result = await suggestFeeds(theme, locale);
          
          // Verify result structure
          expect(result).toBeDefined();
          expect(result).toHaveProperty('feeds');
          expect(Array.isArray(result.feeds)).toBe(true);
          expect(result.feeds.length).toBeGreaterThan(0);
          
          // **Core Property: All URLs match valid RSS feed URL patterns (Requirements 4.3)**
          
          // Valid RSS feed URL pattern:
          // - Protocol: http:// or https://
          // - Domain: valid domain name (alphanumeric, hyphens, dots)
          // - Path: optional, but commonly includes /rss, /feed, /atom, .xml, etc.
          const urlPattern = /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(\.[a-zA-Z]{2,})(\/[^\s]*)?$/;
          
          result.feeds.forEach((feed, index) => {
            // Verify URL field exists and is a string
            expect(feed).toHaveProperty('url');
            expect(typeof feed.url).toBe('string');
            expect(feed.url.length).toBeGreaterThan(0);
            
            // Verify URL matches valid pattern
            const isValidUrl = urlPattern.test(feed.url);
            if (!isValidUrl) {
              console.error(`[Property 5] Invalid URL at index ${index}: ${feed.url}`);
            }
            expect(isValidUrl).toBe(true);
            
            // Verify URL uses http or https protocol
            const hasValidProtocol = feed.url.startsWith('http://') || feed.url.startsWith('https://');
            expect(hasValidProtocol).toBe(true);
            
            // Verify URL has a domain (at least one dot after protocol)
            const urlWithoutProtocol = feed.url.replace(/^https?:\/\//, '');
            const hasDomain = urlWithoutProtocol.includes('.') || urlWithoutProtocol.includes(':'); // Allow localhost:port
            expect(hasDomain).toBe(true);
          });
          
          console.log(`[Property 5] ✓ Verified ${result.feeds.length} feed URLs match valid patterns for theme "${theme}"`);
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
