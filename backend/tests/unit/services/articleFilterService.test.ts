import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { filterArticlesByTheme } from '../../../src/services/articleFilterService.js';
import type { Article } from '../../../src/services/articleFilterService.js';

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
    bedrockModelIdLite: 'apac.amazon.nova-lite-v1:0',
    bedrockModelIdMicro: 'apac.amazon.nova-micro-v1:0',
    useMockBedrock: false,
    enableCache: false,
    isLocal: false,
  },
}));

// Import after mocks are set up
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

describe('Article Filter Service - Unit Tests', () => {
  beforeEach(() => {
    // Reset mock implementation
    mockSend.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create test articles
  const createArticles = (count: number): Article[] => {
    return Array.from({ length: count }, (_, i) => ({
      title: `Article ${i + 1}`,
      description: `Description for article ${i + 1}`,
      link: `https://example.com/article${i + 1}`,
      pubDate: new Date(),
      feedSource: 'https://example.com/feed',
    }));
  };

  describe('Article filtering with valid Nova Micro response', () => {
    it('should successfully filter articles based on theme relevance', async () => {
      const articles = createArticles(15);
      
      // Mock valid Nova Micro response indicating 10 articles are relevant (>= 8)
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              role: 'assistant',
              content: [
                {
                  text: '{"relevantIndices": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}',
                },
              ],
            },
          },
          stopReason: 'end_turn',
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return only the relevant articles (10 out of 15)
      expect(result).toBeDefined();
      expect(result.length).toBe(10);
      expect(result[0].title).toBe('Article 1');
      expect(result[1].title).toBe('Article 2');
      expect(result[9].title).toBe('Article 10');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should use Nova Micro request format by default', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      await filterArticlesByTheme(articles, 'Test', 'en');
      
      const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
      const requestBody = JSON.parse(commandArg.body);
      
      // Verify Nova Micro format
      expect(requestBody).toHaveProperty('messages');
      expect(requestBody).toHaveProperty('inferenceConfig');
      expect(requestBody.messages[0].content).toBeInstanceOf(Array);
      expect(requestBody.messages[0].content[0]).toHaveProperty('text');
      expect(requestBody.inferenceConfig).toHaveProperty('maxTokens', 1000);
      expect(requestBody.inferenceConfig).toHaveProperty('temperature', 0.3);
    });

    it('should use English prompt for English locale', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      await filterArticlesByTheme(articles, 'Technology', 'en');
      
      const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
      const requestBody = JSON.parse(commandArg.body);
      const prompt = requestBody.messages[0].content[0].text;
      
      // Verify English prompt was used
      expect(prompt).toContain('Theme: Technology');
      expect(prompt).toContain('From the following articles');
      expect(prompt).toContain('Return in JSON format');
    });

    it('should use Japanese prompt for Japanese locale', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      await filterArticlesByTheme(articles, '技術', 'ja');
      
      const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
      const requestBody = JSON.parse(commandArg.body);
      const prompt = requestBody.messages[0].content[0].text;
      
      // Verify Japanese prompt was used
      expect(prompt).toContain('テーマ: 技術');
      expect(prompt).toContain('以下の記事のうち');
      expect(prompt).toContain('JSON形式で返してください');
    });

    it('should return all articles if filtered count is less than 8', async () => {
      const articles = createArticles(10);
      
      // Mock response with only 5 relevant articles (less than minimum of 8)
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [0, 2, 4, 6, 8]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles because filtered count < 8
      expect(result.length).toBe(10);
    });

    it('should skip filtering if article count is less than 8', async () => {
      const articles = createArticles(5);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles without calling Bedrock
      expect(result.length).toBe(5);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should filter out invalid indices from response', async () => {
      const articles = createArticles(10);
      
      // Mock response with some invalid indices (negative and out of bounds)
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [-1, 0, 2, 15, 20, 5]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should only include valid indices (0, 2, 5)
      // But since that's only 3 articles (< 8), should return all
      expect(result.length).toBe(10);
    });
  });

  describe('API error handling (return all articles)', () => {
    it('should return all articles when Bedrock API fails', async () => {
      const articles = createArticles(10);
      
      mockSend.mockRejectedValue(new Error('Bedrock API error'));
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback
      expect(result).toBeDefined();
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should handle timeout errors gracefully', async () => {
      const articles = createArticles(10);
      
      mockSend.mockRejectedValue(new Error('Request timeout'));
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should handle throttling errors', async () => {
      const articles = createArticles(10);
      
      mockSend.mockRejectedValue(new Error('ThrottlingException'));
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should handle service unavailable errors', async () => {
      const articles = createArticles(10);
      
      mockSend.mockRejectedValue(new Error('ServiceUnavailableException'));
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });
  });

  describe('Parsing error handling', () => {
    it('should return all articles on malformed JSON', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: 'This is not valid JSON { malformed' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should return all articles on empty response', async () => {
      const articles = createArticles(10);
      
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
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should return all articles when response has no JSON', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: 'No JSON here, just plain text' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should return all articles when relevantIndices is missing', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"message": "No indices provided"}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback (empty array means < 8 articles)
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should return all articles when relevantIndices is not an array', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": "not an array"}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should handle response body that is not valid JSON', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode('This is not valid JSON at all'),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles as fallback
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });
  });

  describe('Validation error handling', () => {
    it('should handle empty relevantIndices array', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": []}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles because filtered count is 0 (< 8)
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should handle all invalid indices', async () => {
      const articles = createArticles(10);
      
      // All indices are out of bounds
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [100, 200, 300]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return all articles because no valid indices (< 8)
      expect(result.length).toBe(10);
      expect(result).toEqual(articles);
    });

    it('should handle duplicate indices in response', async () => {
      const articles = createArticles(10);
      
      // Response contains duplicate indices
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [0, 1, 1, 2, 2, 2, 3, 4, 5, 6, 7, 8]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should handle duplicates (may include duplicates in result)
      expect(result.length).toBeGreaterThanOrEqual(8);
    });

    it('should handle non-integer indices', async () => {
      const articles = createArticles(10);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [0.5, 1.7, 2.3, 3.9, 4.1, 5.5, 6.8, 7.2, 8.6, 9.1]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // JavaScript will treat these as valid array indices (truncated to integers)
      // Should return filtered articles
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Edge cases', () => {
    it('should handle exactly 8 articles', async () => {
      const articles = createArticles(8);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [0, 1, 2, 3]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should filter but return all because filtered count (4) < 8
      expect(result.length).toBe(8);
    });

    it('should handle exactly 8 filtered articles', async () => {
      const articles = createArticles(15);
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [0, 1, 2, 3, 4, 5, 6, 7]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return exactly 8 filtered articles
      expect(result.length).toBe(8);
    });

    it('should handle large number of articles', async () => {
      const articles = createArticles(100);
      
      // Return first 50 articles as relevant
      const relevantIndices = Array.from({ length: 50 }, (_, i) => i);
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: JSON.stringify({ relevantIndices }) }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should return 50 filtered articles
      expect(result.length).toBe(50);
    });

    it('should handle articles with special characters in titles', async () => {
      const articles: Article[] = [
        {
          title: 'Article with "quotes" and \'apostrophes\'',
          description: 'Description',
          link: 'https://example.com/1',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article with <HTML> & special chars',
          description: 'Description',
          link: 'https://example.com/2',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article with emoji 🚀 and unicode ñ',
          description: 'Description',
          link: 'https://example.com/3',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article with newline\nand tab\tcharacters',
          description: 'Description',
          link: 'https://example.com/4',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 5',
          description: 'Description',
          link: 'https://example.com/5',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 6',
          description: 'Description',
          link: 'https://example.com/6',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 7',
          description: 'Description',
          link: 'https://example.com/7',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 8',
          description: 'Description',
          link: 'https://example.com/8',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed',
        },
      ];
      
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [{ text: '{"relevantIndices": [0, 1, 2, 3, 4, 5, 6, 7]}' }],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await filterArticlesByTheme(articles, 'Technology', 'en');
      
      // Should handle special characters without errors
      expect(result.length).toBe(8);
      expect(result[0].title).toContain('quotes');
      expect(result[1].title).toContain('<HTML>');
      expect(result[2].title).toContain('🚀');
    });
  });
});
