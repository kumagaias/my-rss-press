import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { filterArticlesByTheme } from '../../../src/services/articleFilterService.js';
import type { Article } from '../../../src/models/newspaper.js';

// Create mock client
const bedrockMock = mockClient(BedrockRuntimeClient);

describe('articleFilterService', () => {
  const mockArticles: Article[] = [
    {
      title: 'AI Breakthrough in Machine Learning',
      description: 'New AI model achieves state-of-the-art results in natural language processing tasks.',
      link: 'https://example.com/ai-breakthrough',
      pubDate: '2024-01-01T00:00:00Z',
      importance: 0.9,
    },
    {
      title: 'Stock Market Update',
      description: 'Markets closed higher today as investors reacted to economic data.',
      link: 'https://example.com/stock-market',
      pubDate: '2024-01-01T00:00:00Z',
      importance: 0.5,
    },
    {
      title: 'Deep Learning Framework Released',
      description: 'New open-source framework simplifies deep learning model development.',
      link: 'https://example.com/deep-learning',
      pubDate: '2024-01-01T00:00:00Z',
      importance: 0.8,
    },
    {
      title: 'Weather Forecast',
      description: 'Sunny weather expected this weekend across the region.',
      link: 'https://example.com/weather',
      pubDate: '2024-01-01T00:00:00Z',
      importance: 0.3,
    },
    {
      title: 'Neural Networks in Healthcare',
      description: 'AI-powered diagnostic tools show promising results in clinical trials.',
      link: 'https://example.com/healthcare-ai',
      pubDate: '2024-01-01T00:00:00Z',
      importance: 0.85,
    },
    {
      title: 'Sports News',
      description: 'Local team wins championship in exciting final match.',
      link: 'https://example.com/sports',
      pubDate: '2024-01-01T00:00:00Z',
      importance: 0.4,
    },
    {
      title: 'Computer Vision Advances',
      description: 'New techniques improve object detection accuracy in real-time applications.',
      link: 'https://example.com/computer-vision',
      pubDate: '2024-01-01T00:00:00Z',
      importance: 0.87,
    },
    {
      title: 'Celebrity Gossip',
      description: 'Famous actor spotted at local restaurant.',
      link: 'https://example.com/celebrity',
      pubDate: '2024-01-01T00:00:00Z',
      importance: 0.2,
    },
  ];

  beforeEach(() => {
    bedrockMock.reset();
  });

  describe('filterArticlesByTheme', () => {
    it('should filter articles by theme relevance', async () => {
      // Mock Bedrock response with relevance scores (enough high scores to pass minimum)
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              scores: [0.9, 0.8, 0.85, 0.7, 0.88, 0.75, 0.9, 0.65],
            }),
          }],
        })),
      });

      const result = await filterArticlesByTheme(mockArticles, 'AI and Machine Learning', 'en');

      // All articles pass threshold (0.3), so all 8 should be returned
      expect(result.length).toBe(8);
      expect(result[0].title).toBe('AI Breakthrough in Machine Learning');
    });

    it('should skip filtering if less than 8 articles', async () => {
      const fewArticles = mockArticles.slice(0, 5);
      
      const result = await filterArticlesByTheme(fewArticles, 'AI', 'en');

      expect(result).toEqual(fewArticles);
      expect(result.length).toBe(5);
    });

    it('should return all articles if filtered result has less than 8 articles', async () => {
      // Mock response with mostly low scores
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              scores: [0.9, 0.1, 0.85, 0.05, 0.1, 0.05, 0.1, 0.05],
            }),
          }],
        })),
      });

      const result = await filterArticlesByTheme(mockArticles, 'AI', 'en');

      // Should return all articles because filtered result would be < 8
      expect(result).toEqual(mockArticles);
      expect(result.length).toBe(8);
    });

    it('should return all articles if Bedrock API fails', async () => {
      bedrockMock.on(InvokeModelCommand).rejects(new Error('Bedrock API error'));

      const result = await filterArticlesByTheme(mockArticles, 'AI', 'en');

      // Should return all articles as fallback
      expect(result).toEqual(mockArticles);
      expect(result.length).toBe(8);
    });

    it('should use custom threshold', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              scores: [0.9, 0.5, 0.85, 0.6, 0.88, 0.7, 0.9, 0.55],
            }),
          }],
        })),
      });

      const result = await filterArticlesByTheme(mockArticles, 'AI', 'en', 0.5);

      // All articles pass threshold 0.5, so all 8 should be returned
      expect(result.length).toBe(8);
    });

    it('should handle Japanese locale', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              scores: [0.9, 0.8, 0.85, 0.7, 0.88, 0.75, 0.9, 0.65],
            }),
          }],
        })),
      });

      const result = await filterArticlesByTheme(mockArticles, 'AI', 'ja');

      expect(result.length).toBe(8);
      
      // Verify Japanese prompt was used
      const calls = bedrockMock.commandCalls(InvokeModelCommand);
      expect(calls.length).toBe(1);
      const body = JSON.parse(calls[0].args[0].input.body as string);
      expect(body.messages[0].content).toContain('以下の記事');
    });

    it('should handle malformed Bedrock response', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'Invalid JSON response',
          }],
        })),
      });

      const result = await filterArticlesByTheme(mockArticles, 'AI', 'en');

      // Should return all articles as fallback
      expect(result).toEqual(mockArticles);
      expect(result.length).toBe(8);
    });

    it('should handle empty scores array', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              scores: [],
            }),
          }],
        })),
      });

      const result = await filterArticlesByTheme(mockArticles, 'AI', 'en');

      // Should return all articles as fallback (no scores means no filtering)
      expect(result).toEqual(mockArticles);
    });

    it('should handle partial scores array', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              scores: [0.9, 0.8, 0.7], // Only 3 scores for 8 articles
            }),
          }],
        })),
      });

      const result = await filterArticlesByTheme(mockArticles, 'AI', 'en');

      // Should return all articles because filtered result (3) < 8
      expect(result.length).toBe(8);
    });
  });
});
