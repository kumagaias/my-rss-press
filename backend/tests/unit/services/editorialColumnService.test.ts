import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateEditorialColumn } from '../../../src/services/editorialColumnService.js';
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

describe('editorialColumnService - Unit Tests', () => {
  // Sample articles for testing
  const mockArticles: Article[] = [
    {
      title: 'AI Revolution in Healthcare',
      description: 'Artificial intelligence is transforming medical diagnosis and treatment planning.',
      link: 'https://example.com/ai-healthcare',
      pubDate: new Date('2025-01-30').toISOString(),
      imageUrl: 'https://example.com/image1.jpg',
      importance: 10,
      feedSource: 'https://example.com/feed',
    },
    {
      title: 'Climate Change Impact on Agriculture',
      description: 'Rising temperatures are affecting crop yields worldwide.',
      link: 'https://example.com/climate-agriculture',
      pubDate: new Date('2025-01-29').toISOString(),
      importance: 9,
      feedSource: 'https://example.com/feed',
    },
    {
      title: 'Tech Giants Face Regulation',
      description: 'New legislation aims to increase oversight of major technology companies.',
      link: 'https://example.com/tech-regulation',
      pubDate: new Date('2025-01-28').toISOString(),
      imageUrl: 'https://example.com/image2.jpg',
      importance: 8,
      feedSource: 'https://example.com/feed',
    },
  ];

  beforeEach(() => {
    // Reset mock implementation
    mockSend.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Editorial column generation with valid Nova Micro response', () => {
    it('should successfully parse Nova Micro response and return editorial column (English)', async () => {
      // Mock valid Nova Micro response
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              role: 'assistant',
              content: [
                {
                  text: `Title: The Dawn of Intelligent Medicine
Column: As artificial intelligence reshapes healthcare, we stand at a crossroads between technological promise and ethical responsibility. The articles reveal a pattern: AI's diagnostic capabilities now rival human experts, yet questions of accountability and bias remain unresolved. History teaches us that every medical revolution—from antibiotics to vaccines—required not just innovation but wisdom in application. Will we learn from past mistakes, or repeat them at silicon speed?`,
                },
              ],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.title).toBe('The Dawn of Intelligent Medicine');
      expect(result?.column).toContain('artificial intelligence');
      expect(result?.column.length).toBeGreaterThan(50);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should successfully parse Nova Micro response and return editorial column (Japanese)', async () => {
      // Mock valid Nova Micro response in Japanese
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              role: 'assistant',
              content: [
                {
                  text: `タイトル: 知能医療の夜明け
コラム: 人工知能が医療を再構築する中、私たちは技術的な約束と倫理的責任の岐路に立っています。記事は一つのパターンを明らかにします：AIの診断能力は今や人間の専門家に匹敵しますが、説明責任とバイアスの問題は未解決のままです。歴史は私たちに教えています。抗生物質からワクチンまで、すべての医療革命には革新だけでなく、応用における知恵が必要でした。私たちは過去の過ちから学ぶのでしょうか、それともシリコンの速度でそれらを繰り返すのでしょうか？`,
                },
              ],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'テクノロジー',
        locale: 'ja',
      });
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.title).toBe('知能医療の夜明け');
      expect(result?.column).toContain('人工知能');
      expect(result?.column.length).toBeGreaterThan(50);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should use Nova Micro request format by default', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [
                {
                  text: 'Title: Test\nColumn: Test column content',
                },
              ],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Test',
        locale: 'en',
      });
      
      const commandArg = (InvokeModelCommand as any).mock.calls[0][0];
      const requestBody = JSON.parse(commandArg.body);
      
      // Verify Nova Micro format
      expect(requestBody).toHaveProperty('messages');
      expect(requestBody).toHaveProperty('inferenceConfig');
      expect(requestBody.messages[0].content).toBeInstanceOf(Array);
      expect(requestBody.messages[0].content[0]).toHaveProperty('text');
      expect(requestBody.inferenceConfig).toHaveProperty('maxTokens', 400);
      expect(requestBody.inferenceConfig).toHaveProperty('topP', 0.9);
    });

    it('should handle fallback parsing when format does not match exactly', async () => {
      // Mock response without explicit Title:/Column: labels
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [
                {
                  text: `The Future of AI
This is a column about artificial intelligence and its impact on society. We must consider the ethical implications carefully.`,
                },
              ],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.title).toBe('The Future of AI');
      expect(result?.column).toContain('artificial intelligence');
    });
  });

  describe('API error handling (return null)', () => {
    it('should return null when Bedrock API fails', async () => {
      mockSend.mockRejectedValue(new Error('Bedrock API error'));
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeNull();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return null when API times out', async () => {
      // Mock a delayed response that exceeds timeout
      mockSend.mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 15000))
      );
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeNull();
    });

    it('should return null when throttling occurs', async () => {
      mockSend.mockRejectedValue(new Error('ThrottlingException'));
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeNull();
    });

    it('should return null when no articles are provided', async () => {
      const result = await generateEditorialColumn({
        articles: [],
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeNull();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('Parsing error handling', () => {
    it('should return null when response text is empty', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [
                {
                  text: '',
                },
              ],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeNull();
    });

    it('should return null when response format is invalid', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [
                {
                  text: 'This is just plain text without any structure',
                },
              ],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeNull();
    });

    it('should return null when response JSON is malformed', async () => {
      const mockResponse = {
        body: new TextEncoder().encode('This is not valid JSON'),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeNull();
    });

    it('should return null when response has missing content field', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              // Missing content field
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeNull();
    });
  });

  describe('Validation error handling', () => {
    it('should return null when title is empty', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [
                {
                  text: 'Title: \nColumn: This is a column without a title',
                },
              ],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      // The parsing should fail because title is empty
      expect(result).toBeNull();
    });

    it('should return null when column is empty', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [
                {
                  text: 'Title: Test Title\nColumn: ',
                },
              ],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      // The parsing should fail because column is empty
      expect(result).toBeNull();
    });

    it('should handle response with only one line (no column)', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          output: {
            message: {
              content: [
                {
                  text: 'Just a single line',
                },
              ],
            },
          },
        })),
      };
      
      mockSend.mockResolvedValue(mockResponse);
      
      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });
      
      expect(result).toBeNull();
    });
  });
});
