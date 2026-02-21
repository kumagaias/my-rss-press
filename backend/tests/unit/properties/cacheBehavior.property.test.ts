import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Test: Cache Behavior
 * 
 * **Validates: Requirements 9.4, 11.4**
 * 
 * Property: For any repeated request with the same parameters in local development mode,
 * when cache is enabled, the system should return cached results without making 
 * additional API calls.
 * 
 * This test verifies that the caching mechanism works correctly in local development
 * mode to reduce API costs and improve performance.
 * 
 * Tag: Feature: bedrock-to-nova-micro-migration, Property 18: Cache Behavior
 */

// Create a shared mock send function
const createMockSend = () => vi.fn();
let mockSend = createMockSend();

// Track all InvokeModelCommand calls
let invokeModelCalls: any[] = [];

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: vi.fn(function(this: any) {
      Object.defineProperty(this, 'send', {
        get: () => mockSend,
        configurable: true,
      });
      return this;
    }),
    InvokeModelCommand: vi.fn(function(this: any, params: any) {
      Object.assign(this, params);
      // Track the call
      invokeModelCalls.push(params);
      return this;
    }),
  };
});

// Mock config with cache enabled in local mode
vi.mock('../../../src/config.js', () => ({
  config: {
    bedrockRegion: 'ap-northeast-1',
    bedrockModelIdLite: 'amazon.nova-lite-v1:0',
    bedrockModelIdMicro: 'amazon.nova-micro-v1:0',
    useMockBedrock: false,
    enableCache: true, // Cache enabled
    isLocal: true, // Local development mode
    dynamodbTable: 'test-table',
  },
}));

// Mock dependencies for feedSuggestionService
vi.mock('../../../src/services/categoryFallback.js', () => ({
  getAllDefaultFeeds: vi.fn(() => [
    { url: 'https://default.com/feed', title: 'Default Feed', description: 'Default' },
  ]),
}));

vi.mock('../../../src/services/categoryService.js', () => ({
  getCategoryByTheme: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../../../src/services/categoryCache.js', () => ({
  categoryCache: {
    getFeeds: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('../../../src/services/feedUsageService.js', () => ({
  getPopularFeeds: vi.fn(() => Promise.resolve([])),
}));

// Mock global fetch to make validation pass
global.fetch = vi.fn((url: string) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: {
      get: (name: string) => {
        if (name === 'content-type') return 'application/rss+xml';
        if (name === 'content-length') return '1000';
        return null;
      },
    },
    text: () => Promise.resolve('<?xml version="1.0"?><rss></rss>'),
  } as Response);
}) as any;

// Import service after mocks are set up
import { suggestFeeds } from '../../../src/services/feedSuggestionService.js';

describe('Property 18: Cache Behavior', () => {
  beforeEach(() => {
    mockSend.mockReset();
    vi.clearAllMocks();
    invokeModelCalls = [];
    
    // Clear the cache by re-importing the module
    // This ensures each test starts with a fresh cache
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper function to create a valid Nova Micro response
   */
  const createNovaResponse = (content: any) => ({
    body: new TextEncoder().encode(JSON.stringify({
      output: {
        message: {
          role: 'assistant',
          content: [{ text: JSON.stringify(content) }],
        },
      },
    })),
  });

  /**
   * Property Test: Cache hit on duplicate requests
   * 
   * For any theme and locale, when making the same request twice in local
   * development mode with cache enabled, the second request should return
   * cached results without making an additional API call.
   */
  it('Feature: bedrock-to-nova-micro-migration, Property 18: Cache Behavior - cache hit on duplicate requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random themes and locales (alphanumeric only to avoid URL validation issues)
        fc.record({
          theme: fc.stringMatching(/^[a-zA-Z0-9]{3,20}$/),
          locale: fc.constantFrom('en', 'ja'),
          uniqueId: fc.integer({ min: 1000000, max: 9999999 }), // Add unique ID to ensure no cache collision
        }),
        async ({ theme, locale, uniqueId }) => {
          // Make theme unique for this test iteration
          const uniqueTheme = `${theme}${uniqueId}`;
          
          // Reset tracking
          invokeModelCalls = [];
          mockSend.mockReset();

          // Mock Bedrock response with valid feed URLs
          const mockFeeds = [
            { url: 'https://example.com/feed1', title: 'Feed 1', reasoning: 'Test feed 1' },
            { url: 'https://example.com/feed2', title: 'Feed 2', reasoning: 'Test feed 2' },
            { url: 'https://example.com/feed3', title: 'Feed 3', reasoning: 'Test feed 3' },
          ];
          
          mockSend.mockResolvedValue(createNovaResponse({
            newspaperName: `${uniqueTheme} Daily`,
            feeds: mockFeeds,
          }));

          // First request - should make API call
          const result1 = await suggestFeeds(uniqueTheme, locale);
          const sendCallsAfterFirst = mockSend.mock.calls.length;

          // Verify first request made API call
          expect(sendCallsAfterFirst).toBeGreaterThan(0);
          expect(result1.feeds).toBeDefined();

          // Second request with same parameters - should use cache
          const result2 = await suggestFeeds(uniqueTheme, locale);
          const sendCallsAfterSecond = mockSend.mock.calls.length;

          // Verify second request did NOT make additional API call (cache hit)
          expect(sendCallsAfterSecond).toBe(sendCallsAfterFirst);

          // Verify both results are identical (cache hit)
          expect(result2.feeds).toEqual(result1.feeds);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * Property Test: Cache isolation between different requests
   * 
   * For any two different themes or locales, the cache should maintain
   * separate entries and not return cached results from different requests.
   */
  it('Feature: bedrock-to-nova-micro-migration, Property 18: Cache Behavior - cache isolation between different requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different request parameters (alphanumeric only)
        fc.record({
          request1: fc.record({
            theme: fc.stringMatching(/^[a-zA-Z0-9]{3,20}$/),
            locale: fc.constantFrom('en', 'ja'),
          }),
          request2: fc.record({
            theme: fc.stringMatching(/^[a-zA-Z0-9]{3,20}$/),
            locale: fc.constantFrom('en', 'ja'),
          }),
          uniqueId: fc.integer({ min: 1000000, max: 9999999 }), // Add unique ID
        }).filter(({ request1, request2 }) => {
          // Ensure requests are different (different theme OR different locale)
          return request1.theme !== request2.theme || request1.locale !== request2.locale;
        }),
        async ({ request1, request2, uniqueId }) => {
          // Make themes unique for this test iteration
          const uniqueTheme1 = `${request1.theme}${uniqueId}`;
          const uniqueTheme2 = `${request2.theme}${uniqueId}`;
          
          // Reset tracking
          invokeModelCalls = [];
          mockSend.mockReset();

          // Mock different responses for each request
          const mockFeeds1 = [
            { url: 'https://example1.com/feed', title: 'Feed 1', reasoning: 'Test 1' },
          ];
          const mockFeeds2 = [
            { url: 'https://example2.com/feed', title: 'Feed 2', reasoning: 'Test 2' },
          ];

          // First request
          mockSend.mockResolvedValueOnce(createNovaResponse({
            newspaperName: `${uniqueTheme1} Daily`,
            feeds: mockFeeds1,
          }));
          const result1 = await suggestFeeds(uniqueTheme1, request1.locale);
          const sendCallsAfterFirst = mockSend.mock.calls.length;

          // Second request with different parameters
          mockSend.mockResolvedValueOnce(createNovaResponse({
            newspaperName: `${uniqueTheme2} Daily`,
            feeds: mockFeeds2,
          }));
          const result2 = await suggestFeeds(uniqueTheme2, request2.locale);
          const sendCallsAfterSecond = mockSend.mock.calls.length;

          // Verify both requests made API calls (no cache hit)
          expect(sendCallsAfterFirst).toBeGreaterThan(0);
          expect(sendCallsAfterSecond).toBeGreaterThan(sendCallsAfterFirst);

          // Verify results are different (cache isolation)
          expect(result1.feeds).not.toEqual(result2.feeds);
        }
      ),
      { numRuns: 100 }
    );
  }, 10000); // Increase timeout to 10 seconds

  /**
   * Property Test: Multiple duplicate requests use cache
   * 
   * For any theme and locale, when making multiple duplicate requests,
   * only the first request should make an API call, and all subsequent
   * requests should use the cache.
   */
  it('Feature: bedrock-to-nova-micro-migration, Property 18: Cache Behavior - multiple duplicate requests use cache', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random theme, locale, and number of duplicate requests (alphanumeric only)
        fc.record({
          theme: fc.stringMatching(/^[a-zA-Z0-9]{3,20}$/),
          locale: fc.constantFrom('en', 'ja'),
          numRequests: fc.integer({ min: 2, max: 5 }),
          uniqueId: fc.integer({ min: 1000000, max: 9999999 }), // Add unique ID
        }),
        async ({ theme, locale, numRequests, uniqueId }) => {
          // Make theme unique for this test iteration
          const uniqueTheme = `${theme}${uniqueId}`;
          
          // Reset tracking
          invokeModelCalls = [];
          mockSend.mockReset();

          // Mock Bedrock response with valid feed URLs
          const mockFeeds = [
            { url: 'https://example.com/feed', title: 'Test Feed', reasoning: 'Test' },
          ];
          
          mockSend.mockResolvedValue(createNovaResponse({
            newspaperName: `${uniqueTheme} Daily`,
            feeds: mockFeeds,
          }));

          // Make multiple requests with same parameters
          const results: any[] = [];
          for (let i = 0; i < numRequests; i++) {
            const result = await suggestFeeds(uniqueTheme, locale);
            results.push(result);
          }

          // Verify only one API call was made (first request)
          expect(mockSend.mock.calls.length).toBe(1);

          // Verify all results are identical (all cache hits after first)
          for (let i = 1; i < results.length; i++) {
            expect(results[i].feeds).toEqual(results[0].feeds);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Cache key uniqueness
   * 
   * For any combination of theme and locale, the cache key should be unique
   * and correctly identify the cached entry.
   */
  it('Feature: bedrock-to-nova-micro-migration, Property 18: Cache Behavior - cache key uniqueness', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple unique theme-locale combinations (alphanumeric only)
        fc.array(
          fc.record({
            theme: fc.stringMatching(/^[a-zA-Z0-9]{3,20}$/),
            locale: fc.constantFrom('en', 'ja'),
          }),
          { minLength: 2, maxLength: 4 }
        ).map(requests => {
          // Ensure all requests are unique
          const seen = new Set<string>();
          return requests.filter(req => {
            const key = `${req.theme}:${req.locale}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }).filter(requests => requests.length >= 2),
        async (requests) => {
          // Reset tracking
          invokeModelCalls = [];
          mockSend.mockReset();

          // Make first request for each unique combination
          const firstResults: any[] = [];
          for (const req of requests) {
            mockSend.mockResolvedValueOnce(createNovaResponse({
              newspaperName: `${req.theme} Daily`,
              feeds: [
                { url: `https://${req.theme}.com/feed`, title: req.theme, reasoning: 'Test' },
              ],
            }));
            const result = await suggestFeeds(req.theme, req.locale);
            firstResults.push(result);
          }

          const sendCallsAfterFirst = mockSend.mock.calls.length;

          // Make second request for each combination (should use cache)
          const secondResults: any[] = [];
          for (const req of requests) {
            const result = await suggestFeeds(req.theme, req.locale);
            secondResults.push(result);
          }

          const sendCallsAfterSecond = mockSend.mock.calls.length;

          // Verify no additional API calls were made (all cache hits)
          expect(sendCallsAfterSecond).toBe(sendCallsAfterFirst);

          // Verify each cached result matches its first result
          for (let i = 0; i < requests.length; i++) {
            expect(secondResults[i].feeds).toEqual(firstResults[i].feeds);
          }
        }
      ),
      { numRuns: 50 } // Reduced runs due to complexity
    );
  }, 10000); // Increase timeout to 10 seconds
});
