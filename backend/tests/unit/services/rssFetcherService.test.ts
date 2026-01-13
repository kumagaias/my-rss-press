import { describe, it, expect } from 'vitest';
import { filterByDate, determineArticleCount } from '../../../src/services/rssFetcherService.js';
import type { Article } from '../../../src/services/rssFetcherService.js';

describe('rssFetcherService', () => {
  describe('filterByDate', () => {
    // Helper function to create test articles
    const createArticle = (daysAgo: number, hours = 12): Article => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(hours, 0, 0, 0);
      return {
        title: `Article from ${daysAgo} days ago`,
        description: 'Test description',
        link: 'https://example.com',
        pubDate: date,
        feedTitle: 'Test Feed',
        importance: 50,
      };
    };

    it('should include articles from yesterday', () => {
      const articles = [
        createArticle(1), // Yesterday
      ];
      const result = filterByDate(articles, 7);
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('1 days ago');
    });

    it('should exclude articles from today', () => {
      const articles = [
        createArticle(0), // Today
        createArticle(1), // Yesterday
      ];
      const result = filterByDate(articles, 7);
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('1 days ago');
    });

    it('should include articles within the date range', () => {
      const articles = [
        createArticle(1), // Yesterday
        createArticle(3), // 3 days ago
        createArticle(5), // 5 days ago
        createArticle(6), // 6 days ago
      ];
      const result = filterByDate(articles, 7);
      expect(result).toHaveLength(4);
    });

    it('should exclude articles older than daysBack', () => {
      const articles = [
        createArticle(1), // Yesterday
        createArticle(5), // 5 days ago
        createArticle(8), // 8 days ago (too old)
        createArticle(10), // 10 days ago (too old)
      ];
      const result = filterByDate(articles, 7);
      expect(result).toHaveLength(2);
      expect(result[0].title).toContain('1 days ago');
      expect(result[1].title).toContain('5 days ago');
    });

    it('should handle articles at exact boundary times - start of day', () => {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);

      const articles: Article[] = [
        {
          title: 'Article at start boundary',
          description: 'Test',
          link: 'https://example.com',
          pubDate: startDate,
          feedTitle: 'Test Feed',
          importance: 50,
        },
      ];

      const result = filterByDate(articles, 7);
      expect(result).toHaveLength(1);
    });

    it('should handle articles at exact boundary times - end of yesterday', () => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);

      const articles: Article[] = [
        {
          title: 'Article at end boundary',
          description: 'Test',
          link: 'https://example.com',
          pubDate: endDate,
          feedTitle: 'Test Feed',
          importance: 50,
        },
      ];

      const result = filterByDate(articles, 7);
      expect(result).toHaveLength(1);
    });

    it('should handle empty article array', () => {
      const result = filterByDate([], 7);
      expect(result).toHaveLength(0);
    });

    it('should handle different daysBack values', () => {
      const articles = [
        createArticle(1), // Yesterday
        createArticle(2), // 2 days ago
        createArticle(3), // 3 days ago
        createArticle(4), // 4 days ago
      ];

      // Test with daysBack = 2
      const result2 = filterByDate(articles, 2);
      expect(result2).toHaveLength(2); // Yesterday and 2 days ago

      // Test with daysBack = 3
      const result3 = filterByDate(articles, 3);
      expect(result3).toHaveLength(3); // Yesterday, 2 days ago, 3 days ago

      // Test with daysBack = 5
      const result5 = filterByDate(articles, 5);
      expect(result5).toHaveLength(4); // All articles (within 5 days)
    });

    it('should correctly calculate 7-day range', () => {
      // Example from Copilot comment:
      // If today is Jan 13 and daysBack=7:
      // startDate = Jan 6 (today - 7 days)
      // endDate = Jan 12 (yesterday)
      // Result: Articles from Jan 6-12 (excluding today Jan 13)
      
      const articles = [
        createArticle(0), // Today (Jan 13) - should be excluded
        createArticle(1), // Yesterday (Jan 12) - should be included
        createArticle(2), // Jan 11 - should be included
        createArticle(3), // Jan 10 - should be included
        createArticle(4), // Jan 9 - should be included
        createArticle(5), // Jan 8 - should be included
        createArticle(6), // Jan 7 - should be included
        createArticle(7), // Jan 6 - should be included (start date)
        createArticle(8), // Jan 5 - should be excluded
      ];

      const result = filterByDate(articles, 7);
      expect(result).toHaveLength(7); // 7 articles (Jan 6-12, excluding today)
    });
  });

  describe('determineArticleCount', () => {
    it('should return a number between 8 and 15', () => {
      for (let i = 0; i < 100; i++) {
        const count = determineArticleCount();
        expect(count).toBeGreaterThanOrEqual(8);
        expect(count).toBeLessThanOrEqual(15);
      }
    });

    it('should return an integer', () => {
      for (let i = 0; i < 100; i++) {
        const count = determineArticleCount();
        expect(Number.isInteger(count)).toBe(true);
      }
    });
  });
});
