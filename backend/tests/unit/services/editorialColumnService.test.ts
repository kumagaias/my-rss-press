/**
 * Unit tests for Editorial Column Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateEditorialColumn } from '../../../src/services/editorialColumnService.js';
import type { Article } from '../../../src/services/rssFetcherService.js';

// Create a mock send function that can be controlled per test
let mockSend = vi.fn();

// Mock AWS SDK
vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: vi.fn(function() {
      return {
        send: (...args: any[]) => mockSend(...args),
      };
    }),
    InvokeModelCommand: vi.fn(),
  };
});

// Mock config
vi.mock('../../../src/config.js', () => ({
  config: {
    bedrockRegion: 'us-east-1',
  },
}));

describe('Editorial Column Service', () => {
  const mockArticles: Article[] = [
    {
      title: 'AI Breakthrough in Healthcare',
      description: 'New AI system diagnoses diseases with 95% accuracy',
      link: 'https://example.com/ai-healthcare',
      pubDate: '2025-01-14T00:00:00Z',
      importance: 10,
      feedSource: 'https://example.com/feed',
    },
    {
      title: 'Quantum Computing Advances',
      description: 'Scientists achieve quantum supremacy milestone',
      link: 'https://example.com/quantum',
      pubDate: '2025-01-14T00:00:00Z',
      importance: 9,
      feedSource: 'https://example.com/feed',
    },
    {
      title: 'Climate Tech Innovation',
      description: 'New carbon capture technology shows promise',
      link: 'https://example.com/climate',
      pubDate: '2025-01-14T00:00:00Z',
      importance: 8,
      feedSource: 'https://example.com/feed',
    },
  ];

  beforeEach(() => {
    mockSend = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateEditorialColumn', () => {
    it('should generate editorial column in English', async () => {
      // Mock Bedrock response
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: `Title: The Dawn of Intelligent Machines
Column: As Prometheus brought fire to humanity, today's AI researchers bring the spark of intelligence to machines. The recent breakthrough in healthcare diagnostics reminds us that technology, like fire, can illuminate or consume. We stand at a crossroads where quantum computing and artificial intelligence converge, offering unprecedented power to solve humanity's greatest challenges. Yet with this power comes responsibility—to ensure these tools serve all of humanity, not just the privileged few. The question is not whether we can build intelligent machines, but whether we have the wisdom to guide them.`,
          }],
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
      });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('The Dawn of Intelligent Machines');
      expect(result?.column).toContain('Prometheus');
      expect(result?.column).toContain('AI');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should generate editorial column in Japanese', async () => {
      // Mock Bedrock response
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: `タイトル: 知性の火
コラム: プロメテウスが人類に火をもたらしたように、今日のAI研究者は機械に知性の火花をもたらす。医療診断における最近の突破口は、技術が火のように照らすことも消費することもできることを思い出させる。量子コンピューティングと人工知能が収束する岐路に立ち、人類最大の課題を解決する前例のない力を提供している。しかし、この力には責任が伴う。これらのツールが特権階級だけでなく、すべての人類に奉仕することを確実にする責任だ。問題は、知的な機械を構築できるかどうかではなく、それらを導く知恵があるかどうかだ。`,
          }],
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'テクノロジー',
        locale: 'ja',
      });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('知性の火');
      expect(result?.column).toContain('プロメテウス');
      expect(result?.column).toContain('AI');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle empty articles array', async () => {
      const result = await generateEditorialColumn({
        articles: [],
        theme: 'Technology',
        locale: 'en',
      });

      expect(result).toBeNull();
    });

    it('should handle Bedrock API errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('Bedrock API error'));

      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
        maxRetries: 2,
      });

      expect(result).toBeNull();
      expect(mockSend).toHaveBeenCalledTimes(2); // Should retry
    });

    it('should handle timeout', async () => {
      mockSend.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
      );

      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
        maxRetries: 1,
      });

      expect(result).toBeNull();
    }, 10000); // 10 second test timeout

    it('should handle empty response from Bedrock', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: '',
          }],
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
        maxRetries: 1,
      });

      expect(result).toBeNull();
    });

    it('should handle malformed response format', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'This is just plain text without proper format\nBut it has multiple lines',
          }],
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
        maxRetries: 1,
      });

      // Should still parse with fallback logic
      expect(result).not.toBeNull();
      expect(result?.title).toBeTruthy();
      expect(result?.column).toBeTruthy();
    });

    it('should retry on failure with exponential backoff', async () => {
      let callCount = 0;
      mockSend.mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve({
          body: new TextEncoder().encode(JSON.stringify({
            content: [{
              text: `Title: Success After Retry
Column: This column was generated after a retry.`,
            }],
          })),
        });
      });

      const result = await generateEditorialColumn({
        articles: mockArticles,
        theme: 'Technology',
        locale: 'en',
        maxRetries: 2,
      });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Success After Retry');
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });
});
