import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS SDK - same pattern as summaryGenerationService.test.ts
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: class {
    send = vi.fn();
  },
  InvokeModelCommand: class {
    constructor(public input: any) {}
  },
}));

import { filterArticlesByTheme } from '../../../src/services/articleFilterService.js';
import type { Article } from '../../../src/services/articleFilterService.js';

const mockArticles: Article[] = [
  {
    title: 'Best Italian Pasta Recipes',
    description: 'Learn how to make authentic Italian pasta',
    link: 'https://example.com/pasta',
    pubDate: new Date('2025-12-18'),
    feedSource: 'https://example.com/feed',
  },
  {
    title: 'Breaking: Political Crisis in Country X',
    description: 'Major political developments',
    link: 'https://example.com/politics',
    pubDate: new Date('2025-12-18'),
    feedSource: 'https://example.com/feed',
  },
  {
    title: 'Homemade Bread Baking Guide',
    description: 'Step-by-step bread baking tutorial',
    link: 'https://example.com/bread',
    pubDate: new Date('2025-12-18'),
    feedSource: 'https://example.com/feed',
  },
  {
    title: 'Stock Market Crashes',
    description: 'Financial news update',
    link: 'https://example.com/stocks',
    pubDate: new Date('2025-12-18'),
    feedSource: 'https://example.com/feed',
  },
  {
    title: 'Vegan Cooking Tips',
    description: 'Healthy vegan recipes',
    link: 'https://example.com/vegan',
    pubDate: new Date('2025-12-18'),
    feedSource: 'https://example.com/feed',
  },
  {
    title: 'Crime Report: Theft in City',
    description: 'Local crime news',
    link: 'https://example.com/crime',
    pubDate: new Date('2025-12-18'),
    feedSource: 'https://example.com/feed',
  },
  {
    title: 'Japanese Sushi Making',
    description: 'Traditional sushi techniques',
    link: 'https://example.com/sushi',
    pubDate: new Date('2025-12-18'),
    feedSource: 'https://example.com/feed',
  },
  {
    title: 'Sports: Team Wins Championship',
    description: 'Sports news update',
    link: 'https://example.com/sports',
    pubDate: new Date('2025-12-18'),
    feedSource: 'https://example.com/feed',
  },
  {
    title: 'Dessert Recipes for Beginners',
    description: 'Easy dessert ideas',
    link: 'https://example.com/dessert',
    pubDate: new Date('2025-12-18'),
    feedSource: 'https://example.com/feed',
  },
];

describe('articleFilterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('filterArticlesByTheme', () => {
    it('should return all articles if fewer than 8 articles', async () => {
      const fewArticles = mockArticles.slice(0, 5);

      const result = await filterArticlesByTheme(fewArticles, 'cooking', 'en');

      expect(result).toHaveLength(5);
      expect(result).toEqual(fewArticles);
    });

    it('should return all articles if Bedrock API fails', async () => {
      // Bedrock is mocked and will fail, so should return all articles
      const result = await filterArticlesByTheme(mockArticles, 'cooking', 'en');

      // Should return all articles as fallback
      expect(result).toHaveLength(mockArticles.length);
      expect(result).toEqual(mockArticles);
    });

    it('should handle Japanese locale', async () => {
      // Should not throw even with Japanese locale
      const result = await filterArticlesByTheme(mockArticles, '料理', 'ja');

      // Bedrock is mocked and will fail, so should return all articles
      expect(result).toHaveLength(mockArticles.length);
      expect(result).toEqual(mockArticles);
    });

    it('should handle English locale', async () => {
      const result = await filterArticlesByTheme(mockArticles, 'cooking', 'en');

      // Bedrock is mocked and will fail, so should return all articles
      expect(result).toHaveLength(mockArticles.length);
      expect(result).toEqual(mockArticles);
    });

    it('should handle empty articles array', async () => {
      const result = await filterArticlesByTheme([], 'cooking', 'en');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle articles with missing description', async () => {
      const articlesWithoutDescription: Article[] = [
        {
          title: 'Article 1',
          link: 'https://example.com/1',
          pubDate: new Date('2025-12-18'),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 2',
          link: 'https://example.com/2',
          pubDate: new Date('2025-12-18'),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 3',
          link: 'https://example.com/3',
          pubDate: new Date('2025-12-18'),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 4',
          link: 'https://example.com/4',
          pubDate: new Date('2025-12-18'),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 5',
          link: 'https://example.com/5',
          pubDate: new Date('2025-12-18'),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 6',
          link: 'https://example.com/6',
          pubDate: new Date('2025-12-18'),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 7',
          link: 'https://example.com/7',
          pubDate: new Date('2025-12-18'),
          feedSource: 'https://example.com/feed',
        },
        {
          title: 'Article 8',
          link: 'https://example.com/8',
          pubDate: new Date('2025-12-18'),
          feedSource: 'https://example.com/feed',
        },
      ];

      const result = await filterArticlesByTheme(articlesWithoutDescription, 'cooking', 'en');

      // Should not throw
      expect(result).toHaveLength(articlesWithoutDescription.length);
    });

    it('should handle minimum threshold parameter', async () => {
      const result = await filterArticlesByTheme(mockArticles, 'cooking', 'en', 0.5);

      // Bedrock is mocked and will fail, so should return all articles
      expect(result).toHaveLength(mockArticles.length);
      expect(result).toEqual(mockArticles);
    });

    it('should handle exactly 8 articles', async () => {
      const exactlyEightArticles = mockArticles.slice(0, 8);

      const result = await filterArticlesByTheme(exactlyEightArticles, 'cooking', 'en');

      // Should attempt filtering (but will fail due to mock)
      expect(result).toHaveLength(exactlyEightArticles.length);
      expect(result).toEqual(exactlyEightArticles);
    });

    it('should handle more than 8 articles', async () => {
      const result = await filterArticlesByTheme(mockArticles, 'cooking', 'en');

      // Should attempt filtering (but will fail due to mock)
      expect(result).toHaveLength(mockArticles.length);
      expect(result).toEqual(mockArticles);
    });
  });
});
