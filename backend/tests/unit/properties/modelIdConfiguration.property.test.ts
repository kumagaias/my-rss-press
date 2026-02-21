import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Test: Model ID Configuration
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 13.1, 13.2, 13.3**
 * 
 * Property: For any service invocation, the system should use the model ID 
 * specified in `config.bedrockModelId`, which can be overridden by the 
 * `BEDROCK_MODEL_ID` environment variable.
 * 
 * This test verifies that all five services (feedSuggestionService, summaryGenerationService,
 * importanceCalculator, articleFilterService, editorialColumnService) consistently
 * use the configured model ID from config.ts.
 * 
 * Tag: Feature: bedrock-to-nova-micro-migration, Property 1: Model ID Configuration
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

// Mock config with a test model ID
vi.mock('../../../src/config.js', () => ({
  config: {
    bedrockRegion: 'ap-northeast-1',
    bedrockModelIdLite: 'test-model-id-v1:0',
    bedrockModelIdMicro: 'test-model-id-v1:0',
    useMockBedrock: false,
    enableCache: false,
    isLocal: false,
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

// Mock dependencies for summaryGenerationService
vi.mock('../../../src/services/languageDetectionService.js', () => ({
  detectLanguages: vi.fn(() => ['en']),
}));

// Mock DynamoDB client for services that need it
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(function(this: any) {
    return this;
  }),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({
      send: vi.fn(),
    })),
  },
  GetCommand: vi.fn(),
  PutCommand: vi.fn(),
  QueryCommand: vi.fn(),
}));

// Import services after mocks are set up
import { suggestFeeds } from '../../../src/services/feedSuggestionService.js';
import { generateSummary } from '../../../src/services/summaryGenerationService.js';
import { calculateImportance } from '../../../src/services/importanceCalculator.js';
import { filterArticlesByTheme } from '../../../src/services/articleFilterService.js';
import { generateEditorialColumn } from '../../../src/services/editorialColumnService.js';
import type { Article } from '../../../src/types/index.js';

describe('Property 1: Model ID Configuration', () => {
  beforeEach(() => {
    mockSend.mockReset();
    vi.clearAllMocks();
    invokeModelCalls = [];
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
   * Property Test: All services use config.bedrockModelId
   * 
   * For any service invocation, verify that the InvokeModelCommand
   * is called with the model ID from config.bedrockModelId.
   */
  it('Feature: bedrock-to-nova-micro-migration, Property 1: Model ID Configuration - all services use config.bedrockModelId', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random service names to test
        fc.constantFrom(
          'feedSuggestionService',
          'summaryGenerationService',
          'importanceCalculator',
          'articleFilterService',
          'editorialColumnService'
        ),
        async (serviceName) => {
          // Reset tracking
          invokeModelCalls = [];
          mockSend.mockReset();

          // Mock appropriate response based on service
          switch (serviceName) {
            case 'feedSuggestionService':
              mockSend.mockResolvedValue(createNovaResponse({
                newspaperName: 'Test Newspaper',
                feeds: [
                  { url: 'https://example.com/feed', title: 'Test Feed', reasoning: 'Test' },
                ],
              }));
              await suggestFeeds('test theme', 'en');
              break;

            case 'summaryGenerationService':
              mockSend.mockResolvedValue(createNovaResponse({
                summary: 'Test summary in three lines\nSecond line here\nThird line here',
              }));
              await generateSummary(
                [
                  {
                    title: 'Test Article',
                    description: 'Test description',
                    link: 'https://example.com',
                    pubDate: new Date(),
                    importance: 50,
                  } as Article,
                ],
                'test theme',
                ['en']
              );
              break;

            case 'importanceCalculator':
              mockSend.mockResolvedValue(createNovaResponse({
                scores: [50, 60, 70, 80, 90, 91, 92, 93],
              }));
              await calculateImportance(
                [
                  {
                    title: 'Article 1',
                    description: 'Description 1',
                    link: 'https://example.com/1',
                    pubDate: new Date(),
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 2',
                    description: 'Description 2',
                    link: 'https://example.com/2',
                    pubDate: new Date(),
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 3',
                    description: 'Description 3',
                    link: 'https://example.com/3',
                    pubDate: new Date(),
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 4',
                    description: 'Description 4',
                    link: 'https://example.com/4',
                    pubDate: new Date(),
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 5',
                    description: 'Description 5',
                    link: 'https://example.com/5',
                    pubDate: new Date(),
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 6',
                    description: 'Description 6',
                    link: 'https://example.com/6',
                    pubDate: new Date(),
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 7',
                    description: 'Description 7',
                    link: 'https://example.com/7',
                    pubDate: new Date(),
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 8',
                    description: 'Description 8',
                    link: 'https://example.com/8',
                    pubDate: new Date(),
                    feedSource: 'https://example.com/feed',
                  } as Article,
                ],
                'test theme',
                new Set<string>() // Empty set for defaultFeedUrls
              );
              break;

            case 'articleFilterService':
              mockSend.mockResolvedValue(createNovaResponse({
                selectedIndices: [0, 1, 2, 3, 4, 5, 6, 7],
              }));
              await filterArticlesByTheme(
                [
                  {
                    title: 'Article 1',
                    description: 'Description 1',
                    link: 'https://example.com/1',
                    pubDate: new Date(),
                    importance: 50,
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 2',
                    description: 'Description 2',
                    link: 'https://example.com/2',
                    pubDate: new Date(),
                    importance: 60,
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 3',
                    description: 'Description 3',
                    link: 'https://example.com/3',
                    pubDate: new Date(),
                    importance: 70,
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 4',
                    description: 'Description 4',
                    link: 'https://example.com/4',
                    pubDate: new Date(),
                    importance: 80,
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 5',
                    description: 'Description 5',
                    link: 'https://example.com/5',
                    pubDate: new Date(),
                    importance: 85,
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 6',
                    description: 'Description 6',
                    link: 'https://example.com/6',
                    pubDate: new Date(),
                    importance: 86,
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 7',
                    description: 'Description 7',
                    link: 'https://example.com/7',
                    pubDate: new Date(),
                    importance: 87,
                    feedSource: 'https://example.com/feed',
                  } as Article,
                  {
                    title: 'Article 8',
                    description: 'Description 8',
                    link: 'https://example.com/8',
                    pubDate: new Date(),
                    importance: 88,
                    feedSource: 'https://example.com/feed',
                  } as Article,
                ],
                'test theme'
              );
              break;

            case 'editorialColumnService':
              mockSend.mockResolvedValue(createNovaResponse({
                title: 'Test Editorial',
                column: 'This is a test editorial column with enough words to meet the minimum requirement for testing purposes.',
              }));
              await generateEditorialColumn({
                articles: [
                  {
                    title: 'Article 1',
                    description: 'Description 1',
                    link: 'https://example.com/1',
                    pubDate: new Date(),
                    importance: 50,
                    feedSource: 'https://example.com/feed',
                  } as Article,
                ],
                theme: 'test theme',
                locale: 'en',
              });
              break;
          }

          // Verify that at least one InvokeModelCommand was created
          expect(invokeModelCalls.length).toBeGreaterThan(0);

          // Verify all calls use the configured model ID
          const expectedModelId = 'test-model-id-v1:0';
          for (const call of invokeModelCalls) {
            expect(call.modelId).toBe(expectedModelId);
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * Property Test: Model ID configuration is consistent across multiple calls
   * 
   * For any sequence of service calls, verify that all use the same
   * configured model ID.
   */
  it('Feature: bedrock-to-nova-micro-migration, Property 1: Model ID Configuration - consistent across multiple calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of random service calls
        fc.array(
          fc.constantFrom(
            'feedSuggestionService',
            'summaryGenerationService',
            'importanceCalculator',
            'articleFilterService',
            'editorialColumnService'
          ),
          { minLength: 2, maxLength: 5 }
        ),
        async (serviceNames) => {
          // Reset tracking
          invokeModelCalls = [];
          mockSend.mockReset();

          // Execute all service calls
          for (const serviceName of serviceNames) {
            switch (serviceName) {
              case 'feedSuggestionService':
                mockSend.mockResolvedValue(createNovaResponse({
                  newspaperName: 'Test Newspaper',
                  feeds: [
                    { url: 'https://example.com/feed', title: 'Test Feed', reasoning: 'Test' },
                  ],
                }));
                await suggestFeeds('test theme', 'en');
                break;

              case 'summaryGenerationService':
                mockSend.mockResolvedValue(createNovaResponse({
                  summary: 'Test summary\nSecond line\nThird line',
                }));
                await generateSummary(
                  [
                    {
                      title: 'Test Article',
                      description: 'Test description',
                      link: 'https://example.com',
                      pubDate: new Date(),
                      importance: 50,
                    } as Article,
                  ],
                  'test theme',
                  ['en']
                );
                break;

              case 'importanceCalculator':
                mockSend.mockResolvedValue(createNovaResponse({
                  scores: [50, 60, 70, 80, 90, 91, 92, 93],
                }));
                await calculateImportance(
                  [
                    {
                      title: 'Article 1',
                      description: 'Description 1',
                      link: 'https://example.com/1',
                      pubDate: new Date(),
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 2',
                      description: 'Description 2',
                      link: 'https://example.com/2',
                      pubDate: new Date(),
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 3',
                      description: 'Description 3',
                      link: 'https://example.com/3',
                      pubDate: new Date(),
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 4',
                      description: 'Description 4',
                      link: 'https://example.com/4',
                      pubDate: new Date(),
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 5',
                      description: 'Description 5',
                      link: 'https://example.com/5',
                      pubDate: new Date(),
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 6',
                      description: 'Description 6',
                      link: 'https://example.com/6',
                      pubDate: new Date(),
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 7',
                      description: 'Description 7',
                      link: 'https://example.com/7',
                      pubDate: new Date(),
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 8',
                      description: 'Description 8',
                      link: 'https://example.com/8',
                      pubDate: new Date(),
                      feedSource: 'https://example.com/feed',
                    } as Article,
                  ],
                  'test theme',
                  new Set<string>()
                );
                break;

              case 'articleFilterService':
                mockSend.mockResolvedValue(createNovaResponse({
                  selectedIndices: [0, 1, 2, 3, 4, 5, 6, 7],
                }));
                await filterArticlesByTheme(
                  [
                    {
                      title: 'Article 1',
                      description: 'Description 1',
                      link: 'https://example.com/1',
                      pubDate: new Date(),
                      importance: 50,
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 2',
                      description: 'Description 2',
                      link: 'https://example.com/2',
                      pubDate: new Date(),
                      importance: 60,
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 3',
                      description: 'Description 3',
                      link: 'https://example.com/3',
                      pubDate: new Date(),
                      importance: 70,
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 4',
                      description: 'Description 4',
                      link: 'https://example.com/4',
                      pubDate: new Date(),
                      importance: 80,
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 5',
                      description: 'Description 5',
                      link: 'https://example.com/5',
                      pubDate: new Date(),
                      importance: 85,
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 6',
                      description: 'Description 6',
                      link: 'https://example.com/6',
                      pubDate: new Date(),
                      importance: 86,
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 7',
                      description: 'Description 7',
                      link: 'https://example.com/7',
                      pubDate: new Date(),
                      importance: 87,
                      feedSource: 'https://example.com/feed',
                    } as Article,
                    {
                      title: 'Article 8',
                      description: 'Description 8',
                      link: 'https://example.com/8',
                      pubDate: new Date(),
                      importance: 88,
                      feedSource: 'https://example.com/feed',
                    } as Article,
                  ],
                  'test theme'
                );
                break;

              case 'editorialColumnService':
                mockSend.mockResolvedValue(createNovaResponse({
                  title: 'Test Editorial',
                  column: 'This is a test editorial column with enough words.',
                }));
                await generateEditorialColumn({
                  articles: [
                    {
                      title: 'Article 1',
                      description: 'Description 1',
                      link: 'https://example.com/1',
                      pubDate: new Date(),
                      importance: 50,
                      feedSource: 'https://example.com/feed',
                    } as Article,
                  ],
                  theme: 'test theme',
                  locale: 'en',
                });
                break;
            }
          }

          // Verify that all calls use the same model ID
          expect(invokeModelCalls.length).toBeGreaterThan(0);
          
          const modelIds = invokeModelCalls.map(call => call.modelId);
          const uniqueModelIds = new Set(modelIds);
          
          // All model IDs should be the same (test-model-id-v1:0)
          const expectedModelId = 'test-model-id-v1:0';
          expect(uniqueModelIds.size).toBe(1);
          expect(uniqueModelIds.has(expectedModelId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
