import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { determineSummaryLanguage, generateSummary } from '../../../src/services/summaryGenerationService.js';
import type { Article } from '../../../src/services/rssFetcherService.js';

// Create a shared mock send function
const createMockSend = () => vi.fn();
let mockSend = createMockSend();

// Mock AWS SDK
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(function(this: any) {
    // Use a getter to access the current mockSend
    Object.defineProperty(this, 'send', {
      get: () => mockSend,
      configurable: true,
    });
    return this;
  }),
  InvokeModelCommand: vi.fn(function(this: any, params: any) {
    Object.assign(this, params);
    return this;
  }),
}));

// Mock config
vi.mock('../../../src/config.js', () => ({
  config: {
    bedrockRegion: 'ap-northeast-1',
    bedrockModelIdLite: 'amazon.nova-lite-v1:0',
    bedrockModelIdMicro: 'amazon.nova-micro-v1:0',
    useMockBedrock: false,
    enableCache: false,
    isLocal: false,
  },
}));

// Import after mocks are set up
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

describe('summaryGenerationService - Unit Tests', () => {
  beforeEach(() => {
    // Reset mock implementation
    mockSend.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('determineSummaryLanguage', () => {
    it('should return "en" for empty languages array', () => {
      expect(determineSummaryLanguage([])).toBe('en');
    });

    it('should return "ja" for only Japanese', () => {
      expect(determineSummaryLanguage(['JP'])).toBe('ja');
    });

    it('should return "en" for only English', () => {
      expect(determineSummaryLanguage(['EN'])).toBe('en');
    });

    it('should return "en" for mixed languages', () => {
      expect(determineSummaryLanguage(['JP', 'EN'])).toBe('en');
    });

    it('should return "en" for multiple English entries', () => {
      expect(determineSummaryLanguage(['EN', 'EN'])).toBe('en');
    });

    it('should return "ja" for multiple Japanese entries', () => {
      expect(determineSummaryLanguage(['JP', 'JP'])).toBe('ja');
    });
  });

  describe('generateSummary', () => {
    const mockArticles: Article[] = [
      {
        title: 'Article 1',
        description: 'Description 1',
        link: 'https://example.com/1',
        pubDate: new Date().toISOString(),
        importance: 10,
        feedSource: 'https://example.com/feed',
      },
      {
        title: 'Article 2',
        description: 'Description 2',
        link: 'https://example.com/2',
        pubDate: new Date().toISOString(),
        importance: 8,
        feedSource: 'https://example.com/feed',
      },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
      mockSend.mockReset();
    });

    describe('Summary generation with valid Nova Micro response', () => {
      it('should successfully parse Nova Micro response and return summary', async () => {
        // Mock valid Nova Micro response
        const mockSummary = 'Latest news about Technology with detailed analysis.\nKey developments and trending topics covered.\nStay informed with complete coverage.';
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                role: 'assistant',
                content: [
                  {
                    text: mockSummary,
                  },
                ],
              },
            },
            stopReason: 'end_turn',
            usage: {
              inputTokens: 50,
              outputTokens: 30,
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBe(mockSummary);
        expect(mockSend).toHaveBeenCalledTimes(1);
      });

      it('should use Nova Micro request format by default', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'Test summary' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        await generateSummary(mockArticles, 'Technology', ['EN']);
        
        const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
        const requestBody = JSON.parse(commandArg.body);
        
        // Verify Nova Micro format
        expect(requestBody).toHaveProperty('messages');
        expect(requestBody).toHaveProperty('inferenceConfig');
        expect(requestBody.messages[0].content).toBeInstanceOf(Array);
        expect(requestBody.messages[0].content[0]).toHaveProperty('text');
        expect(requestBody.inferenceConfig).toHaveProperty('maxTokens', 300);
      });

      it('should generate summary in Japanese for JP-only languages', async () => {
        const mockSummary = 'テクノロジーに関する最新ニュースと重要なトピックをお届けします。';
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: mockSummary }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, 'Technology', ['JP']);
        
        expect(result).toBe(mockSummary);
        
        // Verify Japanese prompt was used
        const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
        const requestBody = JSON.parse(commandArg.body);
        const prompt = requestBody.messages[0].content[0].text;
        
        expect(prompt).toContain('以下は「Technology」をテーマにした新聞の記事タイトルです');
      });

      it('should generate summary in English for EN-only languages', async () => {
        const mockSummary = 'Latest news about Technology.';
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: mockSummary }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBe(mockSummary);
        
        // Verify English prompt was used
        const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
        const requestBody = JSON.parse(commandArg.body);
        const prompt = requestBody.messages[0].content[0].text;
        
        expect(prompt).toContain('The following are article titles from a newspaper themed "Technology"');
      });

      it('should use English prompt for mixed languages', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'Mixed language summary' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        await generateSummary(mockArticles, 'Technology', ['JP', 'EN']);
        
        const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
        const requestBody = JSON.parse(commandArg.body);
        const prompt = requestBody.messages[0].content[0].text;
        
        expect(prompt).toContain('The following are article titles from a newspaper themed "Technology"');
      });

      it('should limit to 10 articles for context', async () => {
        const manyArticles: Article[] = Array.from({ length: 20 }, (_, i) => ({
          title: `Article ${i + 1}`,
          description: `Description ${i + 1}`,
          link: `https://example.com/${i + 1}`,
          pubDate: new Date().toISOString(),
          importance: 10 - i,
          feedSource: 'https://example.com/feed',
        }));

        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'Summary of many articles' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        await generateSummary(manyArticles, 'Technology', ['EN']);
        
        const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
        const requestBody = JSON.parse(commandArg.body);
        const prompt = requestBody.messages[0].content[0].text;
        
        // Count article titles in prompt (should be max 10)
        const titleMatches = prompt.match(/\d+\. Article \d+/g);
        expect(titleMatches).toBeDefined();
        expect(titleMatches!.length).toBeLessThanOrEqual(10);
      });
    });

    describe('API error handling (return null)', () => {
      it('should return null on Bedrock API error', async () => {
        mockSend.mockRejectedValue(new Error('Bedrock API error'));
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBeNull();
      });

      it('should handle timeout gracefully', async () => {
        // Simulate timeout by delaying response beyond 10 seconds
        mockSend.mockImplementation(() => 
          new Promise((resolve) => setTimeout(resolve, 11000))
        );
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBeNull();
      }, 15000);

      it('should handle throttling errors', async () => {
        mockSend.mockRejectedValue(new Error('ThrottlingException'));
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBeNull();
      });

      it('should handle service unavailable errors', async () => {
        mockSend.mockRejectedValue(new Error('ServiceUnavailableException'));
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBeNull();
      });
    });

    describe('Language detection and matching', () => {
      it('should use Japanese for JP-only languages', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: '日本語の要約' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        await generateSummary(mockArticles, 'Technology', ['JP']);
        
        const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
        const requestBody = JSON.parse(commandArg.body);
        const prompt = requestBody.messages[0].content[0].text;
        
        expect(prompt).toContain('以下は「Technology」をテーマにした新聞の記事タイトルです');
      });

      it('should use English for EN-only languages', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'English summary' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        await generateSummary(mockArticles, 'Technology', ['EN']);
        
        const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
        const requestBody = JSON.parse(commandArg.body);
        const prompt = requestBody.messages[0].content[0].text;
        
        expect(prompt).toContain('The following are article titles from a newspaper themed "Technology"');
      });

      it('should use English for empty languages array', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'English summary' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        await generateSummary(mockArticles, 'Technology', []);
        
        const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
        const requestBody = JSON.parse(commandArg.body);
        const prompt = requestBody.messages[0].content[0].text;
        
        expect(prompt).toContain('The following are article titles from a newspaper themed "Technology"');
      });

      it('should use English for mixed JP and EN languages', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'English summary' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        await generateSummary(mockArticles, 'Technology', ['JP', 'EN']);
        
        const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
        const requestBody = JSON.parse(commandArg.body);
        const prompt = requestBody.messages[0].content[0].text;
        
        expect(prompt).toContain('The following are article titles from a newspaper themed "Technology"');
      });
    });

    describe('Parsing error handling', () => {
      it('should return null when response body is empty', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: '' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBeNull();
      });

      it('should return null when response has no content', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBeNull();
      });

      it('should return null when response has malformed structure', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              // Missing message field
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBeNull();
      });

      it('should return null when response body is not valid JSON', async () => {
        const mockResponse = {
          body: new TextEncoder().encode('This is not valid JSON'),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBeNull();
      });

      it('should handle whitespace-only summary', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: '   \n\n   ' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, 'Technology', ['EN']);
        
        expect(result).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should handle empty articles array', async () => {
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'Summary with no articles' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary([], 'Technology', ['EN']);
        
        expect(result).toBe('Summary with no articles');
      });

      it('should handle articles with missing importance field', async () => {
        const articlesWithoutImportance: Article[] = [
          {
            title: 'Article 1',
            description: 'Description 1',
            link: 'https://example.com/1',
            pubDate: new Date().toISOString(),
            importance: 0,
            feedSource: 'https://example.com/feed',
          },
        ];

        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'Summary' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(articlesWithoutImportance, 'Technology', ['EN']);
        
        expect(result).toBe('Summary');
      });

      it('should handle very long theme names', async () => {
        const longTheme = 'A'.repeat(500);
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'Summary' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, longTheme, ['EN']);
        
        expect(result).toBe('Summary');
      });

      it('should handle special characters in theme', async () => {
        const specialTheme = 'Tech & AI: "Future" <Innovation>';
        const mockResponse = {
          body: new TextEncoder().encode(JSON.stringify({
            output: {
              message: {
                content: [{ text: 'Summary' }],
              },
            },
          })),
        };
        
        mockSend.mockResolvedValue(mockResponse);
        
        const result = await generateSummary(mockArticles, specialTheme, ['EN']);
        
        expect(result).toBe('Summary');
      });
    });
  });

  describe('generateSummaryWithRetry', () => {
    it('should return null after max retries', async () => {
      const { generateSummaryWithRetry } = await import('../../../src/services/summaryGenerationService.js');
      
      const result = await generateSummaryWithRetry(
        [
          {
            title: 'Article 1',
            description: 'Description 1',
            link: 'https://example.com/1',
            pubDate: new Date().toISOString(),
            importance: 10,
            feedSource: 'https://example.com/feed',
          },
        ],
        'Technology',
        ['EN'],
        1 // Only 1 retry for faster test
      );

      expect(result).toBeNull();
    });

    it('should return null immediately if generateSummary returns null', async () => {
      const { generateSummaryWithRetry } = await import('../../../src/services/summaryGenerationService.js');
      
      const result = await generateSummaryWithRetry(
        [],
        'Technology',
        ['EN'],
        3
      );

      expect(result).toBeNull();
    });
  });
});
